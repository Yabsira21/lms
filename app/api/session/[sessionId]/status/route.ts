import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = Promise<{ sessionId: string }>;

/**
 * GET /api/session/[sessionId]/status
 * Returns status + actualStartTime so students can compute elapsed time accurately.
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const classSession = await prisma.class.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, startTime: true, endTime: true, actualStartTime: true }
    });

    if (!classSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: classSession.status,
      startTime: classSession.startTime,
      actualStartTime: classSession.actualStartTime,
      endTime: classSession.endTime
    });
  } catch (error) {
    console.error('[GET /status] Error:', error);
    return NextResponse.json({ error: 'Failed to get session status' }, { status: 500 });
  }
}

/**
 * PATCH /api/session/[sessionId]/status
 * LiveClass instructor only: Ongoing | Paused | Completed | Cancelled
 */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const body = await request.json();
    const { status, endTime, actualStartTime } = body;

    const allowed = ['Ongoing', 'Paused', 'Completed', 'Cancelled'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${allowed.join(', ')}` },
        { status: 400 }
      );
    }

    const classSession = await prisma.class.findUnique({
      where: { id: sessionId },
      include: { liveClass: { select: { instructorId: true } } }
    });

    if (!classSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const instructorId = classSession.liveClass?.instructorId;
    if (!instructorId || instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the assigned instructor can update session status' },
        { status: 403 }
      );
    }

    const now = new Date();
    const updateData: any = { status, updatedAt: now };

    // Start: instructor can set the initial anchor time.
    if (actualStartTime) {
      updateData.actualStartTime = new Date(actualStartTime);
    }

    // Pause: store pause timestamp in endTime to freeze elapsed time calculations.
    if (status === 'Paused') {
      updateData.endTime = now;
    }

    // Resume from paused: shift actualStartTime forward by pause duration so elapsed
    // remains strictly "active teaching time" and doesn't include paused minutes.
    if (
      status === 'Ongoing' &&
      classSession.status === 'Paused' &&
      classSession.actualStartTime &&
      classSession.endTime
    ) {
      const pausedMs = now.getTime() - classSession.endTime.getTime();
      updateData.actualStartTime = new Date(classSession.actualStartTime.getTime() + pausedMs);
      updateData.endTime = null;
    }

    // End/cancel: persist final end time.
    if (status === 'Completed' || status === 'Cancelled') {
      updateData.endTime = endTime ? new Date(endTime) : now;
    }

    const updated = await prisma.class.update({
      where: { id: sessionId },
      data: updateData,
      select: { status: true, actualStartTime: true, endTime: true }
    });

    return NextResponse.json({ success: true, ...updated });
  } catch (error) {
    console.error('[PATCH /status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update session status', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
