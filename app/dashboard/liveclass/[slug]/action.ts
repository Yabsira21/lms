"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function sendLiveClassMessage(
  liveClassId: string,
  content: string,
) {
  const session = await requireUser();

  if (!content.trim()) {
    return { error: "Message cannot be empty" };
  }

  // Check if user is enrolled
  const enrollment = await prisma.liveEnrollment.findUnique({
    where: {
      userId_liveClassId: {
        userId: session.id,
        liveClassId: liveClassId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return { error: "Not enrolled" };
  }

  // Create message
  await prisma.liveClassMessage.create({
    data: {
      content: content.trim(),
      userId: session.id,
      liveClassId: liveClassId,
    },
  });

  revalidatePath(`/dashboard/liveclass/${liveClassId}`);

  return { success: true };
}
