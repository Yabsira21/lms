import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/session/[sessionId]/status
 * Returns status + actualStartTime so students can compute elapsed time accurately.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classSession = await prisma.class.findUnique({
      where: { id: params.sessionId },
      select: { id: true, status: true, startTime: true, endTime: true, actualStartTime: true }
    });

    if (!classSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: classSession.status,
      startTime: classSession.startTime,           // scheduled start
      actualStartTime: classSession.actualStartTime, // when instructor clicked Start
      endTime: classSession.endTime
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json({ error: 'Failed to get session status' }, { status: 500 });
  }
}

/**
 * PATCH /api/session/[sessionId]/status
 * Instructor-only: Ongoing | Paused | Completed | Cancelled
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, endTime, actualStartTime } = body;

    const allowed = ['Ongoing', 'Paused', 'Completed', 'Cancelled'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${allowed.join(', ')}` }, { status: 400 });
    }

    const classSession = await prisma.class.findUnique({
      where: { id: params.sessionId },
      include: { Course: { select: { userId: true } } }
    });

    if (!classSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (classSession.Course.userId !== session.user.id) {
      return NextResponse.json({ error: 'Only the instructor can update session status' }, { status: 403 });
    }

    const updateData: any = { status, updatedAt: new Date() };
    if (endTime) updateData.endTime = new Date(endTime);
    if (actualStartTime) updateData.actualStartTime = new Date(actualStartTime);

    const updated = await prisma.class.update({
      where: { id: params.sessionId },
      data: updateData,
      select: { status: true, actualStartTime: true, endTime: true }
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json({ error: 'Failed to update session status' }, { status: 500 });
  }
}
