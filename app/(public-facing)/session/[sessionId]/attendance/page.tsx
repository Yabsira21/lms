import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AttendanceMonitoring from './_components/AttendanceMonitoring';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AttendanceMonitoringPage({ params }: PageProps) {
  const { sessionId } = await params;
  
  const session = await auth.api.getSession({
    headers: await import('next/headers').then(h => h.headers())
  });

  if (!session) {
    redirect('/login');
  }

  // Get class/session details with attendance records
  const classSession = await prisma.class.findUnique({
    where: { id: sessionId },
    include: {
      Course: {
        include: {
          user: true,
          enrollment: {
            include: {
              User: true
            }
          }
        }
      },
      Attendance: {
        include: {
          user: true
        }
      }
    }
  });

  if (!classSession) {
    redirect('/dashboard');
  }

  // Check if user is instructor
  const isInstructor = classSession.Course.userId === session.user.id;
  
  if (!isInstructor) {
    redirect(`/session/${sessionId}`);
  }

  return <AttendanceMonitoring session={classSession} />;
}
