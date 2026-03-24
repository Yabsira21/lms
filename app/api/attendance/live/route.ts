import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/attendance/live?classId=xxx
 * Real-time attendance data for a LiveClass session.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    if (!classId) {
      return NextResponse.json({ error: 'Missing classId parameter' }, { status: 400 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        liveClass: {
          include: {
            enrollments: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } }
              },
              where: { status: 'Active' }
            }
          }
        },
        Attendance: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const enrolledStudents = classData.liveClass?.enrollments.map(e => e.user) ?? [];
    const attendanceMap = new Map(classData.Attendance.map(a => [a.userId, a]));

    const participants = enrolledStudents.map(student => {
      const attendance = attendanceMap.get(student.id);
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        status: attendance ? 'present' : 'absent',
        verified: attendance?.verified || false,
        confidence: attendance?.confidence || 0,
        recognizedAt: attendance?.recognizedAt ?? null
      };
    });

    const totalStudents = enrolledStudents.length;
    const presentCount = participants.filter(p => p.status === 'present').length;
    const verifiedCount = participants.filter(p => p.verified).length;
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        classId,
        classTitle: classData.title,
        status: classData.status,
        startTime: classData.startTime,
        endTime: classData.endTime,
        statistics: {
          total: totalStudents,
          present: presentCount,
          absent: totalStudents - presentCount,
          verified: verifiedCount,
          attendanceRate: Math.round(attendanceRate)
        },
        participants: participants.sort((a, b) => {
          if (a.status !== b.status) return a.status === 'present' ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
      }
    });
  } catch (error) {
    console.error('Error fetching live attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 });
  }
}
