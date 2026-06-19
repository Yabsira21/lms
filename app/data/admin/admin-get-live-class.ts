import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function adminGetLiveClass(id: string) {
  await requireAdmin();

  const data = await prisma.liveClass.findUnique({
    where: { id: id },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      classes: {
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

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminLiveClassSingularData = Awaited<
  ReturnType<typeof adminGetLiveClass>
>;
