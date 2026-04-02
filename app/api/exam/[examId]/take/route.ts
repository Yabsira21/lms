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
        select: {
          id: true,
          text: true,
          options: true,
          points: true,
        },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  // Get or create submission
  let submission = await prisma.examSubmission.findUnique({
    where: {
      examId_userId: {
        examId,
        userId: session.id,
      },
    },
  });

  if (!submission) {
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    submission = await prisma.examSubmission.create({
      data: {
        examId,
        userId: session.id,
        score: 0,
        totalPoints,
        percentage: 0,
        answers: {},
        status: "InProgress",
      },
    });
  }

  if (submission.status === "Submitted") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  return NextResponse.json({
    exam,
    answers: submission.answers as Record<string, string>,
    violationCount: submission.violationCount,
  });
}
