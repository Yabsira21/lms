import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/attendance/export?classId=xxx&format=csv
 * Export attendance data for a LiveClass session.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const format = searchParams.get('format') || 'csv';

    if (!classId) {
      return NextResponse.json({ error: 'Missing classId parameter' }, { status: 400 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        liveClass: {
          include: {
            instructor: { select: { name: true } },
            enrollments: {
              include: { user: { select: { id: true, name: true, email: true } } },
              where: { status: 'Active' }
            }
          }
        },
        Attendance: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classData.liveClass?.instructorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the instructor can export attendance' }, { status: 403 });
    }

    const instructorName = classData.liveClass.instructor.name;
    const classTitle = classData.liveClass.title;
    const enrolledStudents = classData.liveClass.enrollments.map(e => e.user);
    const attendanceMap = new Map(classData.Attendance.map(a => [a.userId, a]));

    const records = enrolledStudents.map(student => {
      const att = attendanceMap.get(student.id) as any;
      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        status: att ? 'Present' : 'Absent',
        verified: att?.verified ? 'Yes' : 'No',
        confidence: att?.confidence != null ? `${Math.round(att.confidence * 100)}%` : 'N/A',
        recognizedAt: att?.recognizedAt ? new Date(att.recognizedAt).toLocaleString() : 'N/A'
      };
    });

    const totalStudents = enrolledStudents.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          class: {
            id: classData.id,
            title: classData.title,
            liveClass: classTitle,
            instructor: instructorName,
            startTime: classData.startTime,
            endTime: classData.endTime,
            status: classData.status
          },
          statistics: {
            total: totalStudents,
            present: presentCount,
            absent: totalStudents - presentCount,
            attendanceRate: Math.round(attendanceRate)
          },
          records
        }
      });
    }

    // CSV
    const csvHeaders = ['Student ID', 'Student Name', 'Email', 'Status', 'Verified', 'Confidence', 'Recognized At'];
    const csvRows = records.map(r => [r.studentId, r.studentName, r.studentEmail, r.status, r.verified, r.confidence, r.recognizedAt]);
    const metadataRows = [
      ['Class Attendance Report'], [''],
      ['Session:', classData.title],
      ['Live Class:', classTitle],
      ['Instructor:', instructorName],
      ['Date:', new Date(classData.startTime).toLocaleDateString()],
      ['Time:', `${new Date(classData.startTime).toLocaleTimeString()} - ${classData.endTime ? new Date(classData.endTime).toLocaleTimeString() : 'Ongoing'}`],
      ['Status:', classData.status], [''],
      ['Statistics:'],
      ['Total Students:', totalStudents.toString()],
      ['Present:', presentCount.toString()],
      ['Absent:', (totalStudents - presentCount).toString()],
      ['Attendance Rate:', `${Math.round(attendanceRate)}%`],
      [''], csvHeaders
    ];

    const csvContent = [...metadataRows, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${classData.title.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json({ error: 'Failed to export attendance' }, { status: 500 });
  }
}
