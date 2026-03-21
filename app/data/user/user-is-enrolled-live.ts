import "server-only";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function checkIfLiveClassEnrolled(
  liveClassId: string,
): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return false;

  const enrollment = await prisma.liveEnrollment.findUnique({
    where: {
      userId_liveClassId: {
        liveClassId: liveClassId,
        userId: session.user.id,
      },
    },
    select: {
      status: true,
    },
  });

  return enrollment?.status === "Active";
}
