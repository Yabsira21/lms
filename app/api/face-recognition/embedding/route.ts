import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/face-recognition/embedding?userId=xxx
 * Returns the stored face embedding for a user.
 * Used by the client-side continuous attendance hook.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ?? session.user.id;

    const record = await prisma.faceEmbedding.findUnique({
      where: { userId },
      select: { embedding: true, imageUrl: true },
    });

    if (!record) {
      return NextResponse.json({ error: 'No embedding found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, embedding: record.embedding, imageUrl: record.imageUrl });
  } catch (error) {
    console.error('Error fetching embedding:', error);
    return NextResponse.json({ error: 'Failed to fetch embedding' }, { status: 500 });
  }
}
