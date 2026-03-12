import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/session/[sessionId]/status
 * Get current session status
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

    const { sessionId } = params;

    // Get session status
    const classSession = await prisma.class.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true
      }
    });

    if (!classSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: classSession.status,
      startTime: classSession.startTime,
      endTime: classSession.endTime
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/session/[sessionId]/status
 * Update session status (Ongoing, Paused, Completed)
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

    const { sessionId } = params;
    const body = await request.json();
    const { status, endTime, duration } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Verify the session exists and user is the instructor
    const classSession = await prisma.class.findUnique({
      where: { id: sessionId },
      include: {
        Course: true
      }
    });

    if (!classSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is the instructor
    if (classSession.Course.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the instructor can update session status' },
        { status: 403 }
      );
    }

    // Update session status
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (endTime) {
      updateData.endTime = new Date(endTime);
    }

    const updatedSession = await prisma.class.update({
      where: { id: sessionId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Session status updated to ${status}`,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json(
      { error: 'Failed to update session status' },
      { status: 500 }
    );
  }
}
