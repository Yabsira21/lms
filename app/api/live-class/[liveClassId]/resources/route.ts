import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ liveClassId: string }> },
) {
  const session = await requireUser();
  const { liveClassId } = await params;

  // Check if user is enrolled or is instructor
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: { instructorId: true },
  });

  if (!liveClass) {
    return NextResponse.json(
      { error: "Live class not found" },
      { status: 404 },
    );
  }

  const enrollment = await prisma.liveEnrollment.findUnique({
    where: {
      userId_liveClassId: {
        userId: session.id,
        liveClassId: liveClassId,
      },
    },
  });

  const isEnrolled = enrollment?.status === "Active";
  const isInstructor = liveClass.instructorId === session.id;

  if (!isEnrolled && !isInstructor) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Get all classes for this live class
  const classes = await prisma.class.findMany({
    where: {
      liveClassId: liveClassId,
    },
    select: {
      id: true,
      resources: {
        include: {
          class: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // Combine resources from all classes
  const allResources = classes.flatMap((c) => c.resources);

  // Get user info for each resource (instructor)
  const resourcesWithUsers = await Promise.all(
    allResources.map(async (resource) => {
      // Get the instructor who created this resource
      const instructor = await prisma.user.findUnique({
        where: { id: liveClass.instructorId },
        select: { id: true, name: true, image: true },
      });

      return {
        id: resource.id,
        title: resource.title,
        fileUrl: resource.fileUrl,
        fileType: resource.fileUrl.split(".").pop() || "file",
        createdAt: resource.createdAt,
        user: instructor || {
          id: liveClass.instructorId,
          name: "Instructor",
          image: null,
        },
      };
    }),
  );

  return NextResponse.json({ resources: resourcesWithUsers });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ liveClassId: string }> },
) {
  const session = await requireUser();
  const { liveClassId } = await params;

  // Check if user is instructor
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: { instructorId: true, slug: true },
  });

  if (!liveClass || liveClass.instructorId !== session.id) {
    return NextResponse.json(
      { error: "Only instructors can upload resources" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { title, fileUrl } = body;

  if (!title || !fileUrl) {
    return NextResponse.json(
      { error: "Title and file URL are required" },
      { status: 400 },
    );
  }

  // Get the first upcoming class to attach the resource to
  const firstClass = await prisma.class.findFirst({
    where: {
      liveClassId: liveClassId,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (!firstClass) {
    return NextResponse.json(
      { error: "No classes found for this live class" },
      { status: 400 },
    );
  }

  const resource = await prisma.classResource.create({
    data: {
      title,
      fileUrl,
      classId: firstClass.id,
    },
  });

  revalidatePath(`/dashboard/liveclass/${liveClass.slug}`);

  return NextResponse.json({ success: true, resource });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ liveClassId: string }> },
) {
  const session = await requireUser();
  const { liveClassId } = await params;

  // Check if user is instructor
  const liveClass = await prisma.liveClass.findUnique({
    where: { id: liveClassId },
    select: { instructorId: true, slug: true },
  });

  if (!liveClass || liveClass.instructorId !== session.id) {
    return NextResponse.json(
      { error: "Only instructors can delete resources" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const resourceId = url.pathname.split("/").pop();

  await prisma.classResource.delete({
    where: { id: resourceId },
  });

  revalidatePath(`/dashboard/liveclass/${liveClass.slug}`);

  return NextResponse.json({ success: true });
}
