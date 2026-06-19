import "server-only";
import { requireAdmin } from "./require-admin";
import { prisma } from "@/lib/db";

export async function adminGetExams() {
  await requireAdmin();

  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true, submissions: true },
      },
    },
  });

  return exams;
}

export async function adminGetExam(id: string) {
  await requireAdmin();

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exam) return null;
  return exam;
}

export async function adminGetExamSubmissions(examId: string) {
  await requireAdmin();

  const submissions = await prisma.examSubmission.findMany({
    where: { examId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions;
}
