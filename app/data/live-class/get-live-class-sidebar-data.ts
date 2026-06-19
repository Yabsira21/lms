import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getLiveClassSidebarData(slug: string) {
  const session = await requireUser();

  const liveClass = await prisma.liveClass.findUnique({
    where: {
      slug: slug,
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      classes: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: "asc",
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          meetingId: true,
        },
      },
      _count: {
        select: {
          classes: true,
          enrollments: true,
        },
      },
    },
  });

  if (!liveClass) {
    return notFound();
  }

  // Allow the instructor through without an enrollment check
  const isInstructor = session.id === liveClass.instructor.id;

  if (!isInstructor) {
    const enrollment = await prisma.liveEnrollment.findUnique({
      where: {
        userId_liveClassId: {
          userId: session.id,
          liveClassId: liveClass.id,
        },
      },
    });

    if (!enrollment || enrollment.status !== "Active") {
      return notFound();
    }
  }

  return {
    liveClass,
    isInstructor,
  };
}

export type LiveClassSideDataType = Awaited<
  ReturnType<typeof getLiveClassSidebarData>
>;
