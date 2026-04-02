"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function startExam(examId: string) {
  const session = await requireUser();

  // Check if already started
  const existing = await prisma.examSubmission.findUnique({
    where: {
      examId_userId: {
        examId,
        userId: session.id,
      },
    },
  });

  if (existing) {
    redirect(`/exam/${examId}/take`);
  }

  await prisma.examSubmission.create({
    data: {
      examId,
      userId: session.id,
      status: "InProgress",
    },
  });

  revalidatePath(`/exam/${examId}/take`);
  redirect(`/exam/${examId}/take`);
}

export async function submitExam(
  examId: string,
  answers: Record<string, string>,
  violationCount: number,
) {
  const session = await requireUser();

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });

  if (!exam) {
    return { error: "Exam not found" };
  }

  let totalScore = 0;
  let totalPoints = 0;

  const gradedAnswers: Record<
    string,
    { answer: string; correct: boolean; points: number }
  > = {};

  for (const question of exam.questions) {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correctAnswer;
    const pointsEarned = isCorrect ? question.points : 0;

    totalScore += pointsEarned;
    totalPoints += question.points;

    gradedAnswers[question.id] = {
      answer: userAnswer || "",
      correct: isCorrect,
      points: pointsEarned,
    };
  }

  const percentage = (totalScore / totalPoints) * 100;

  await prisma.examSubmission.update({
    where: {
      examId_userId: {
        examId,
        userId: session.id,
      },
    },
    data: {
      score: totalScore,
      totalPoints,
      percentage,
      answers: gradedAnswers,
      violationCount,
      flagged: violationCount >= 3,
      status: "Submitted",
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/exam/${examId}/results`);
  redirect(`/exam/${examId}/results`);
}

export async function recordViolation(examId: string) {
  const session = await requireUser();

  const submission = await prisma.examSubmission.findUnique({
    where: {
      examId_userId: {
        examId,
        userId: session.id,
      },
    },
  });

  if (submission && submission.status === "InProgress") {
    const newViolationCount = (submission.violationCount || 0) + 1;
    await prisma.examSubmission.update({
      where: { id: submission.id },
      data: {
        violationCount: newViolationCount,
        flagged: newViolationCount >= 3,
      },
    });
  }
}
