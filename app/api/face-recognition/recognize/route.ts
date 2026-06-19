import { NextRequest, NextResponse } from 'next/server';
import { faceRecognitionService } from '@/lib/face-recognition';

/**
 * POST /api/face-recognition/recognize
 * Recognize a face from an embedding (client-side generated)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const embeddingStr = formData.get('embedding') as string | null;
    const threshold = formData.get('threshold')
      ? parseFloat(formData.get('threshold') as string)
      : 0.5; // Default threshold for Euclidean distance

    if (!embeddingStr) {
      return NextResponse.json(
        { error: 'Embedding is required' },
        { status: 400 },
      );
    }

    let embedding: number[];
    try {
      embedding = JSON.parse(embeddingStr);
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding format');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid embedding format' },
        { status: 400 },
      );
    }

    const match = await faceRecognitionService.recognizeFace(embedding, { threshold });

    if (!match) {
      return NextResponse.json({
        success: false,
        recognized: false,
        message: 'No matching face found',
      });
    }

    return NextResponse.json({
      success: true,
      recognized: true,
      result: {
        userId: match.userId,
        confidence: match.confidence,
        distance: match.distance,
      },
    });
  } catch (error) {
    console.error('Error recognizing face:', error);
    return NextResponse.json(
      { error: 'Failed to recognize face', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
