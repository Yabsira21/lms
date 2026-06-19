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

  if (!session) redirect('/login');

  const classSession = await prisma.class.findUnique({
    where: { id: sessionId },
    include: {
      liveClass: {
        include: {
          instructor: true,
          enrollments: {
            include: { user: true },
            where: { status: 'Active' }
          }
        }
      },
      Attendance: { include: { user: true } }
    }
  });

  if (!classSession) redirect('/dashboard');

  const isInstructor = classSession.liveClass?.instructorId === session.user.id;
  if (!isInstructor) redirect(`/session/${sessionId}`);

  return <AttendanceMonitoring session={classSession} />;
}
