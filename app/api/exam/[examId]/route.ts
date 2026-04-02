import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  const session = await requireUser();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId, status: "Published" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, options: true, points: true },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({ exam });
}
