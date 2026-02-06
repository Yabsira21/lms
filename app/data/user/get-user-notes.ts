import "server-only";
import { prisma } from "@/lib/db";
import { requireUser } from "./require-user";

export async function getUserNotes() {
  const user = await requireUser();

  const data = await prisma.document.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
    },
  });

  return data;
}

export type UserNotesType = Awaited<ReturnType<typeof getUserNotes>>[0];
