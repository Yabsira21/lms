import "server-only";
import { prisma } from "@/lib/db";
import { requireUser } from "../user/require-user";

export async function getLiveClassChat(liveClassId: string) {
  const session = await requireUser();

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
    throw new Error("Not enrolled");
  }

  // Get messages for this live class
  const messages = await prisma.liveClassMessage.findMany({
    where: {
      liveClassId: liveClassId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 100, // Limit to last 100 messages
  });

  return {
    messages,
    currentUser: {
      id: session.id,
      name: session.name,
      image: session.image,
    },
  };
}
