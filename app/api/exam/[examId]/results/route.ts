import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  try {
    const session = await requireUser();
    const { examId } = await params;

    if (!examId) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    // Get submission
    const submission = await prisma.examSubmission.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: session.id,
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    if (submission.status !== "Submitted") {
      return NextResponse.json(
        { error: "Exam not completed yet" },
        { status: 400 },
      );
    }

    // Get exam with questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Parse answers
    const answers = (submission.answers as Record<string, any>) || {};

    // Build questions with results
    const questionsWithResults = exam.questions.map((question) => {
      const userAnswerData = answers[question.id];
      return {
        id: question.id,
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        points: question.points,
        userAnswer: userAnswerData?.answer || "",
        isCorrect: userAnswerData?.correct || false,
        pointsEarned: userAnswerData?.points || 0,
      };
    });

    return NextResponse.json({
      id: submission.id,
      score: submission.score,
      totalPoints: submission.totalPoints,
      percentage: submission.percentage,
      flagged: submission.flagged,
      violationCount: submission.violationCount,
      submittedAt: submission.submittedAt,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        passingScore: exam.passingScore,
      },
      questions: questionsWithResults,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 },
    );
  }
}
