import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { faceRecognitionService } from '@/lib/face-recognition';

/**
 * GET /api/face-recognition/embedding
 * Get face embedding for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const embedding = await faceRecognitionService.getEmbedding(session.user.id);

    if (!embedding) {
      return NextResponse.json({
        success: false,
        message: 'No face embedding found for user',
        hasEmbedding: false,
      });
    }

    return NextResponse.json({
      success: true,
      hasEmbedding: true,
      embedding: {
        id: embedding.id,
        userId: embedding.userId,
        imageUrl: embedding.imageUrl,
        createdAt: embedding.createdAt,
        updatedAt: embedding.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting face embedding:', error);
    return NextResponse.json(
      { error: 'Failed to get face embedding', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/face-recognition/embedding
 * Delete face embedding for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await faceRecognitionService.deleteEmbedding(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Face embedding deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting face embedding:', error);
    return NextResponse.json(
      { error: 'Failed to delete face embedding', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
