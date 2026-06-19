import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/attendance/record
 * Record attendance for a student in a class session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { classId, confidence } = body;

    if (!classId || confidence === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if attendance already recorded
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_classId: {
          userId: session.user.id,
          classId
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Attendance already recorded',
        attendance: existing
      });
    }

    // Record new attendance
    const attendance = await prisma.attendance.create({
      data: {
        id: `${session.user.id}-${classId}-${Date.now()}`,
        userId: session.user.id,
        classId,
        confidence,
        verified: confidence > 0.7, // Auto-verify if confidence is high
        recognizedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}
