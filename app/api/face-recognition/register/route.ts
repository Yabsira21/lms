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
    console.log('Face registration API called');
    
    const session = await auth.api.getSession({ headers: request.headers });
    console.log('Session check result:', session ? 'authenticated' : 'not authenticated');
    
    if (!session?.user) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', session.user.id);

    const formData = await request.formData();
    const embeddingStr = formData.get('embedding') as string | null;

    console.log('Embedding received:', embeddingStr ? 'yes' : 'no');

    if (!embeddingStr) {
      console.log('No embedding provided');
      return NextResponse.json(
        { error: 'Embedding is required' },
        { status: 400 },
      );
    }

    let embedding: number[];
    try {
      embedding = JSON.parse(embeddingStr);
      console.log('Parsed embedding length:', embedding.length);
      
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding format');
      }
    } catch (error) {
      console.log('Invalid embedding format:', error);
      return NextResponse.json(
        { error: 'Invalid embedding format' },
        { status: 400 },
      );
    }

    console.log('Attempting to save embedding...');
    const saved = await saveEmbedding(session.user.id, embedding);
    console.log('Embedding saved successfully:', saved.id);

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
