import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getInstructorLiveClasses() {
  const session = await requireUser();

  // Check if user is an instructor
  if (session.role !== "instructor") {
    return notFound();
  }

  const liveClasses = await prisma.liveClass.findMany({
    where: {
      instructorId: session.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          classes: true,
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
        take: 1,
        select: {
          id: true,
          title: true,
          startTime: true,
          status: true,
        },
      },
    },
  });

  return liveClasses;
}

export type InstructorLiveClassType = Awaited<
  ReturnType<typeof getInstructorLiveClasses>
>[0];
