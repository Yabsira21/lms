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

  if (!session) {
    redirect('/login');
  }

  // Get or create a test class session
  let classSession = await prisma.class.findFirst({
    include: {
      Course: {
        include: {
          user: true
        }
      }
    }
  });

  // If no session exists, create one
  if (!classSession) {
    // First, get or create a course
    let course = await prisma.course.findFirst({
      where: {
        userId: session.user.id
      }
    });

    if (!course) {
      // Create a test course
      course = await prisma.course.create({
        data: {
          id: `course-${Date.now()}`,
          title: 'CSCI 402 – Machine Learning',
          description: 'Introduction to Machine Learning and Neural Networks',
          fileKey: 'test-file-key',
          price: 0,
          duration: 90,
          level: 'Intermediate',
          category: 'Computer Science',
          smallDescription: 'Learn the fundamentals of machine learning',
          slug: `machine-learning-${Date.now()}`,
          status: 'Published',
          userId: session.user.id
        }
      });
    }

    // Create a test class session
    classSession = await prisma.class.create({
      data: {
        id: `session-${Date.now()}`,
        title: 'Neural Networks Introduction',
        description: 'Introduction to neural networks and deep learning',
        courseId: course.id,
        startTime: new Date(),
        status: 'Ongoing',
        updatedAt: new Date()
      },
      include: {
        Course: {
          include: {
            user: true
          }
        }
      }
    });
  }

  const isInstructor = classSession.Course.userId === session.user.id;

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
          {/* Session Info */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{classSession.title}</h3>
              <Badge className="bg-red-500">Live</Badge>
            </div>
            <p className="text-sm text-gray-600">Course: {classSession.Course.title}</p>
            <p className="text-sm text-gray-600">Instructor: {classSession.Course.user.name}</p>
            <p className="text-xs text-gray-500">
              Session ID: {classSession.id}
            </p>
          </div>

          {/* User Role Info */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Your Role:</span>
              <Badge variant={isInstructor ? "default" : "secondary"}>
                {isInstructor ? 'Instructor' : 'Student'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {isInstructor 
                ? 'You will see the instructor view with attendance tracking and session controls.'
                : 'You will see the student view with face recognition for attendance verification.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href={`/session/${classSession.id}`} className="block">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base">
                <Video className="h-5 w-5 mr-2" />
                Join Live Session as {isInstructor ? 'Instructor' : 'Student'}
              </Button>
            </Link>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                The session will open in {isInstructor ? 'instructor' : 'student'} mode based on your role
              </p>
            </div>
          </div>

          {/* Testing Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Testing Instructions:</h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              {isInstructor ? (
                <>
                  <li>You'll see the instructor dashboard with attendance tracking</li>
                  <li>Monitor student attendance with face verification status</li>
                  <li>Use session tools to manage the class</li>
                  <li>View live chat and notifications</li>
                </>
              ) : (
                <>
                  <li>Your face will be detected for attendance verification</li>
                  <li>Make sure to allow camera access when prompted</li>
                  <li>You can interact via chat and raise your hand</li>
                  <li>Control your mic and camera settings</li>
                </>
              )}
            </ul>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 Tip: To test the instructor view, create a course where you are the owner.</p>
            <p>💡 Tip: To test the student view, join a session from a course you don't own.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
