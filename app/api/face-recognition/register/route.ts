import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveEmbedding } from '@/lib/face-recognition';

/**
 * POST /api/face-recognition/register
 * Register a face embedding for the authenticated user
 * Accepts embedding array (client-side generated)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const embeddingStr = formData.get('embedding') as string | null;

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

    const saved = await saveEmbedding(session.user.id, embedding);

    return NextResponse.json({
      success: true,
      embedding: { id: saved.id, userId: saved.userId, createdAt: saved.createdAt },
    });
  } catch (error) {
    console.error('Error registering face:', error);
    return NextResponse.json(
      { error: 'Failed to register face', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
