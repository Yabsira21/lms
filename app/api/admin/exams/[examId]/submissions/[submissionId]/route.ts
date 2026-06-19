import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string; submissionId: string }> },
) {
  await requireAdmin();
  const { examId, submissionId } = await params;

  const submission = await prisma.examSubmission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      exam: {
        select: {
          id: true,
          title: true,
          passingScore: true,
        },
      },
    },
  });

  if (!submission || submission.examId !== examId) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const questions = await prisma.question.findMany({
    where: { examId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({
    ...submission,
    questions,
  });
}
