import "server-only";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getIndividualLiveClass(slug: string) {
  const liveClass = await prisma.liveClass.findUnique({
    where: {
      slug: slug,
      status: "Published",
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
            gte: new Date(), // Only future classes
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

  return liveClass;
}

export type PublicLiveClassDetailType = Awaited<
  ReturnType<typeof getIndividualLiveClass>
>;
