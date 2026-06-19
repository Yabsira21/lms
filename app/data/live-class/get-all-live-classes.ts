import "server-only";
import { prisma } from "@/lib/db";

export async function getAllLiveClasses() {
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  const data = await prisma.liveClass.findMany({
    where: {
      status: "Published",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      instructor: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          classes: true,
        },
      },
    },
  });

  return data;
}

export type PublicLiveClassType = Awaited<
  ReturnType<typeof getAllLiveClasses>
>[0];
