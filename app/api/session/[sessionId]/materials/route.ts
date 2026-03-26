import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = Promise<{ sessionId: string }>;

/** GET — list all shared materials for a session */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await params;

    const resources = await prisma.classResource.findMany({
      where: { classId: sessionId },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('[GET materials]', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

/** POST — instructor shares a material (URL-based, no file upload needed) */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await params;
    const { title, fileUrl } = await request.json();

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'title and fileUrl are required' }, { status: 400 });
    }

    // Verify instructor
    const classSession = await prisma.class.findUnique({
      where: { id: sessionId },
      include: { liveClass: { select: { instructorId: true } } },
    });

    if (!classSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (classSession.liveClass?.instructorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resource = await prisma.classResource.create({
      data: { classId: sessionId, title, fileUrl },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('[POST materials]', error);
    return NextResponse.json({ error: 'Failed to share material' }, { status: 500 });
  }
}

/** DELETE — remove a material */
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    if (!resourceId) return NextResponse.json({ error: 'resourceId required' }, { status: 400 });

    const classSession = await prisma.class.findUnique({
      where: { id: sessionId },
      include: { liveClass: { select: { instructorId: true } } },
    });

    if (classSession?.liveClass?.instructorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.classResource.delete({ where: { id: resourceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE materials]', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
