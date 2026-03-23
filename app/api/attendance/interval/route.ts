import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/attendance/interval
 * Log a single 1-minute attendance interval for a student.
 * Called by the client every minute with VERIFIED or UNVERIFIED status.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { classId, intervalIndex, status, confidence } = body;

    if (!classId || intervalIndex === undefined || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['VERIFIED', 'UNVERIFIED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Upsert the interval (idempotent — safe to retry)
    const interval = await prisma.attendanceInterval.upsert({
      where: {
        userId_classId_intervalIndex: {
          userId: session.user.id,
          classId,
          intervalIndex,
        },
      },
      update: {
        status,
        confidence: confidence ?? null,
        timestamp: new Date(),
      },
      create: {
        userId: session.user.id,
        classId,
        intervalIndex,
        status,
        confidence: confidence ?? null,
        timestamp: new Date(),
      },
    });

    // After each interval, recalculate and upsert the summary Attendance record
    const allIntervals = await prisma.attendanceInterval.findMany({
      where: { userId: session.user.id, classId },
    });

    const totalIntervals = allIntervals.length;
    const verifiedIntervals = allIntervals.filter((i: any) => i.status === 'VERIFIED').length;
    const verifiedPct = totalIntervals > 0 ? verifiedIntervals / totalIntervals : 0;
    const isPresent = verifiedPct >= 0.75;
    const avgConfidence =
      allIntervals.filter((i: any) => i.confidence !== null).reduce((sum: number, i: any) => sum + (i.confidence ?? 0), 0) /
      Math.max(1, allIntervals.filter((i: any) => i.confidence !== null).length);

    await prisma.attendance.upsert({
      where: { userId_classId: { userId: session.user.id, classId } },
      update: {
        verified: isPresent,
        confidence: avgConfidence,
        recognizedAt: new Date(),
      },
      create: {
        id: `${session.user.id}-${classId}`,
        userId: session.user.id,
        classId,
        verified: isPresent,
        confidence: avgConfidence,
        recognizedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      interval,
      summary: { totalIntervals, verifiedIntervals, verifiedPct: Math.round(verifiedPct * 100), isPresent },
    });
  } catch (error) {
    console.error('Error logging attendance interval:', error);
    return NextResponse.json({ error: 'Failed to log interval' }, { status: 500 });
  }
}

/**
 * GET /api/attendance/interval?classId=xxx&userId=xxx
 * Fetch all intervals for a student in a class (used by teacher timeline).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const userId = searchParams.get('userId');

    if (!classId || !userId) {
      return NextResponse.json({ error: 'Missing classId or userId' }, { status: 400 });
    }

    const intervals = await prisma.attendanceInterval.findMany({
      where: { classId, userId },
      orderBy: { intervalIndex: 'asc' },
    });

    const totalIntervals = intervals.length;
    const verifiedIntervals = intervals.filter((i: any) => i.status === 'VERIFIED').length;
    const verifiedPct = totalIntervals > 0 ? Math.round((verifiedIntervals / totalIntervals) * 100) : 0;

    return NextResponse.json({
      success: true,
      intervals,
      summary: { totalIntervals, verifiedIntervals, verifiedPct, isPresent: verifiedPct >= 75 },
    });
  } catch (error) {
    console.error('Error fetching intervals:', error);
    return NextResponse.json({ error: 'Failed to fetch intervals' }, { status: 500 });
  }
}
