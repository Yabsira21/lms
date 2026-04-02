import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();

  // Get all submissions for the user
  const submissions = await prisma.examSubmission.findMany({
    where: {
      userId: session.id,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          description: true,
          passingScore: true,
          duration: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  // Separate in-progress and completed exams
  const inProgress = submissions.filter((s) => s.status === "InProgress");
  const completed = submissions.filter((s) => s.status === "Submitted");

  // Get available exams (published exams the user hasn't started)
  const availableExams = await prisma.exam.findMany({
    where: {
      status: "Published",
      NOT: {
        submissions: {
          some: {
            userId: session.id,
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      passingScore: true,
      _count: {
        select: { questions: true },
      },
    },
  });

  return NextResponse.json({
    inProgress,
    completed,
    availableExams,
  });
}
