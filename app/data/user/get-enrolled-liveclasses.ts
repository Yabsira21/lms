import "server-only";
import { requireUser } from "./require-user";
import { prisma } from "@/lib/db";

export async function getEnrolledLiveClasses() {
  const user = await requireUser();

  const data = await prisma.liveEnrollment.findMany({
    where: {
      userId: user.id,
      status: "Active",
    },
    select: {
      liveClass: {
        select: {
          id: true,
          title: true,
          smallDescription: true,
          thumbnailKey: true,
          slug: true,
          price: true,
          startDate: true,
          durationWeeks: true,
          daysOfWeek: true,
          startTime: true,
          sessionDuration: true,
          instructor: {
            select: {
              name: true,
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
            },
          },
          _count: {
            select: {
              classes: true,
            },
          },
        },
      },
    },
  });

  return data;
}

export type EnrolledLiveClassType = Awaited<
  ReturnType<typeof getEnrolledLiveClasses>
>[0];
