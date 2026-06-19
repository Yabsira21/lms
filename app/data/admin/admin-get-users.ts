import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";

export async function adminGetUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      banned: true,
      liveClasses: {
        where: {
          status: "Published",
        },
        select: {
          id: true,
          title: true,
        },
        take: 10,
      },
      courses: {
        where: {
          status: "Published",
        },
        select: {
          id: true,
          title: true,
        },
        take: 10,
      },
    },
  });

  return users;
}

export type AdminUserType = Awaited<ReturnType<typeof adminGetUsers>>[0];
