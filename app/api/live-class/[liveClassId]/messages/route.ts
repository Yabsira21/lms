import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ liveClassId: string }> }
) {
  const session = await requireUser();
  const { liveClassId } = await params;

  // Check enrollment
  const enrollment = await prisma.liveEnrollment.findUnique({
    where: {
      userId_liveClassId: {
        userId: session.id,
        liveClassId: liveClassId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

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
    take: 100,
  });

  return NextResponse.json(messages);
}