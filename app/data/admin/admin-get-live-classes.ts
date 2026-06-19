import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetLiveClasses() {
  await requireAdmin();

  const data = await prisma.liveClass.findMany({
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
          classes: true,
          enrollments: true,
        },
      },
    },
  });

  return data;
}

export type AdminLiveClassType = Awaited<
  ReturnType<typeof adminGetLiveClasses>
>[0];
