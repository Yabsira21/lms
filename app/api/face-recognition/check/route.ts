import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/face-recognition/check
 * Check if the authenticated user has registered their face
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const faceEmbedding = await prisma.faceEmbedding.findUnique({
      where: { userId: session.user.id },
      select: { id: true, createdAt: true, updatedAt: true }
    });

    return NextResponse.json({
      hasRegistered: !!faceEmbedding,
      registeredAt: faceEmbedding?.createdAt || null,
      updatedAt: faceEmbedding?.updatedAt || null
    });
  } catch (error) {
    console.error('Error checking face registration:', error);
    return NextResponse.json(
      { error: 'Failed to check registration status' },
      { status: 500 }
    );
  }
}
