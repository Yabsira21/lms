/**
 * Face Recognition Module
 * Handles face recognition and embedding storage/retrieval
 * Uses client-side generated embeddings (from TensorFlow.js/MediaPipe)
 */

import { prisma } from './db';

export interface FaceEmbedding {
  id: string;
  userId: string;
  embedding: number[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecognitionResult {
  userId: string;
  confidence: number;
  distance: number;
  matched: boolean;
}

export interface RecognitionOptions {
  threshold?: number; // Distance threshold for matching (lower = stricter)
  topK?: number; // Number of top matches to return
}

class FaceRecognitionService {
  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return similarity;
  }

  /**
   * Calculate Euclidean distance between two embeddings
   */
  calculateDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Recognize a face by comparing embedding with stored embeddings
   */
  async recognizeFace(
    queryEmbedding: number[],
    options: RecognitionOptions = {}
  ): Promise<RecognitionResult | null> {
    const { threshold = 0.5, topK = 1 } = options;

    try {
      // Get all face embeddings from database
      const storedEmbeddings = await prisma.faceEmbedding.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (storedEmbeddings.length === 0) {
        return null;
      }

      // Calculate distances to all stored embeddings
      const matches = storedEmbeddings.map((stored: { userId: string; embedding: string }) => {
        const embedding = JSON.parse(stored.embedding) as number[];
        const distance = this.calculateDistance(queryEmbedding, embedding);
        const confidence = 1 / (1 + distance); // Convert distance to confidence

        return {
          userId: stored.userId,
          distance,
          confidence,
          matched: distance <= threshold,
        };
      });

      // Sort by distance (ascending)
      matches.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

      // Return top match if it meets threshold
      const bestMatch = matches[0];
      if (bestMatch && bestMatch.matched) {
        return {
          userId: bestMatch.userId,
          confidence: bestMatch.confidence,
          distance: bestMatch.distance,
          matched: true,
        };
      }

      return null;
    } catch (error) {
      console.error('Error recognizing face:', error);
      throw new Error('Face recognition failed');
    }
  }

  /**
   * Save face embedding to database
   */
  async saveEmbedding(
    userId: string,
    embedding: number[],
    imageUrl?: string
  ): Promise<FaceEmbedding> {
    try {
      console.log('Attempting to save face embedding for user:', userId);
      console.log('Embedding length:', embedding.length);
      
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }
      
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding provided');
      }

      // Check if embedding already exists for user
      const existing = await prisma.faceEmbedding.findUnique({
        where: { userId },
      });

      const embeddingJson = JSON.stringify(embedding);
      console.log('Embedding JSON length:', embeddingJson.length);

      if (existing) {
        console.log('Updating existing embedding for user:', userId);
        // Update existing embedding
        const updated = await prisma.faceEmbedding.update({
          where: { userId },
          data: {
            embedding: embeddingJson,
            imageUrl,
            updatedAt: new Date(),
          },
        });

        return {
          id: updated.id,
          userId: updated.userId,
          embedding: JSON.parse(updated.embedding) as number[],
          imageUrl: updated.imageUrl || undefined,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } else {
        console.log('Creating new embedding for user:', userId);
        // Create new embedding
        const created = await prisma.faceEmbedding.create({
          data: {
            userId,
            embedding: embeddingJson,
            imageUrl,
          },
        });

        console.log('Successfully created embedding with ID:', created.id);
        return {
          id: created.id,
          userId: created.userId,
          embedding: JSON.parse(created.embedding) as number[],
          imageUrl: created.imageUrl || undefined,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      }
    } catch (error) {
      console.error('Error saving face embedding:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to save face embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get face embedding for a user
   */
  async getEmbedding(userId: string): Promise<FaceEmbedding | null> {
    try {
      const embedding = await prisma.faceEmbedding.findUnique({
        where: { userId },
      });

      if (!embedding) {
        return null;
      }

      return {
        id: embedding.id,
        userId: embedding.userId,
        embedding: JSON.parse(embedding.embedding) as number[],
        imageUrl: embedding.imageUrl || undefined,
        createdAt: embedding.createdAt,
        updatedAt: embedding.updatedAt,
      };
    } catch (error) {
      console.error('Error getting face embedding:', error);
      throw new Error('Failed to get face embedding');
    }
  }

  /**
   * Delete face embedding for a user
   */
  async deleteEmbedding(userId: string): Promise<void> {
    try {
      await prisma.faceEmbedding.delete({
        where: { userId },
      });
    } catch (error) {
      console.error('Error deleting face embedding:', error);
      throw new Error('Failed to delete face embedding');
    }
  }
}

// Export singleton instance
export const faceRecognitionService = new FaceRecognitionService();

// Export utility functions
export const recognizeFace = (
  queryEmbedding: number[],
  options?: RecognitionOptions
) => faceRecognitionService.recognizeFace(queryEmbedding, options);

export const saveEmbedding = (
  userId: string,
  embedding: number[],
  imageUrl?: string
) => faceRecognitionService.saveEmbedding(userId, embedding, imageUrl);
