import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users } from 'lucide-react';

export default async function TestSessionPage() {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then(h => h.headers())
  });

  if (!session) redirect('/login');

  // Always find a session that has a liveClassId where this user is the instructor
  let classSession = await prisma.class.findFirst({
    where: {
      liveClass: { instructorId: session.user.id }
    },
    include: { liveClass: { include: { instructor: true } } }
  });

  if (!classSession) {
    // Create a fresh LiveClass + Class for testing
    const liveClass = await prisma.liveClass.create({
      data: {
        title: 'CSCI 402 – Machine Learning',
        slug: `ml-test-${Date.now()}`,
        smallDescription: 'Test live class',
        description: '{}',
        price: 0,
        category: 'Computer Science',
        status: 'Published',
        startDate: new Date(),
        durationWeeks: 1,
        daysOfWeek: ['Monday'],
        startTime: '08:00',
        sessionDuration: 90,
        instructorId: session.user.id,
      }
    });

    classSession = await prisma.class.create({
      data: {
        title: 'Neural Networks Introduction',
        description: 'Test session',
        liveClassId: liveClass.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 90 * 60 * 1000),
        status: 'Scheduled',
        updatedAt: new Date()
      },
      include: { liveClass: { include: { instructor: true } } }
    });
  }

  const isInstructor = classSession.liveClass?.instructorId === session.user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-6 w-6" />
            Test Live Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{classSession.title}</h3>
              <Badge className="bg-orange-500">{classSession.status}</Badge>
            </div>
            <p className="text-sm text-gray-600">Live Class: {classSession.liveClass?.title}</p>
            <p className="text-sm text-gray-600">Instructor: {classSession.liveClass?.instructor?.name}</p>
            <p className="text-xs text-gray-500">Session ID: {classSession.id}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Your Role:</span>
              <Badge variant={isInstructor ? 'default' : 'secondary'}>
                {isInstructor ? 'Instructor' : 'Student'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {isInstructor
                ? 'You will see the instructor view. Click "Start Session" to begin.'
                : 'You will see the student view. Attendance activates when the instructor starts.'}
            </p>
          </div>

          <Link href={`/session/${classSession.id}`} className="block">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base">
              <Video className="h-5 w-5 mr-2" />
              {isInstructor ? 'Start Live Session' : 'Join Live Session'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
