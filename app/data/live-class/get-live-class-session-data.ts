import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getLiveClassSessionData(slug: string, classId: string) {
  const currentUser = await requireUser();

  const liveClass = await prisma.liveClass.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      instructorId: true,
      instructor: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!liveClass) return notFound();

  const isInstructor = currentUser.id === liveClass.instructorId;

  // Allow instructor through without enrollment check
  if (!isInstructor) {
    const enrollment = await prisma.liveEnrollment.findUnique({
      where: {
        userId_liveClassId: {
          userId: currentUser.id,
          liveClassId: liveClass.id,
        },
      },
    });

    if (!enrollment || enrollment.status !== "Active") return notFound();
  }

  const classSession = await prisma.class.findUnique({
    where: { id: classId, liveClassId: liveClass.id },
  });

  if (!classSession) return notFound();

  return {
    session: classSession,
    liveClass,
    isInstructor,
  };
}
