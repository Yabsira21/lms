import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import StudentSessionView from './_components/StudentSessionView';
import InstructorSessionView from './_components/InstructorSessionView';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function LiveSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  
  const session = await auth.api.getSession({
    headers: await import('next/headers').then(h => h.headers())
  });

  if (!session) {
    redirect('/login');
  }

  // Get class/session details
  const classSession = await prisma.class.findUnique({
    where: { id: sessionId },
    include: {
      Course: {
        include: {
          user: true
        }
      }
    }
  });

  if (!classSession) {
    redirect('/dashboard');
  }

  const isInstructor = classSession.Course.userId === session.user.id;

  if (isInstructor) {
    return <InstructorSessionView session={classSession} user={session.user} />;
  }

  return <StudentSessionView session={classSession} user={session.user} />;
}
