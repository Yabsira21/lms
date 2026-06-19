"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { APIResponse } from "@/lib/types";
import { z } from "zod";

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
  points: z.number().min(1),
  order: z.number(),
});

const examSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().optional(),
  passingScore: z.number().optional(),
  status: z.enum(["Draft", "Published", "Archived"]),
  questions: z.array(questionSchema),
});

export async function createExam(
  data: z.infer<typeof examSchema>,
): Promise<APIResponse> {
  await requireAdmin();

  try {
    const validated = examSchema.parse(data);

    const exam = await prisma.exam.create({
      data: {
        title: validated.title,
        description: validated.description,
        duration: validated.duration,
        passingScore: validated.passingScore,
        status: validated.status,
        questions: {
          create: validated.questions.map((q) => ({
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            order: q.order,
          })),
        },
      },
    });

    revalidatePath("/admin/exams");
    return { status: "success", message: "Exam created successfully" };
  } catch (error) {
    console.error("Create exam error:", error);
    return { status: "error", message: "Failed to create exam" };
  }
}

export async function updateExam(
  id: string,
  data: z.infer<typeof examSchema>,
): Promise<APIResponse> {
  await requireAdmin();

  try {
    const validated = examSchema.parse(data);

    // Delete existing questions and recreate
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { examId: id } }),
      prisma.exam.update({
        where: { id },
        data: {
          title: validated.title,
          description: validated.description,
          duration: validated.duration,
          passingScore: validated.passingScore,
          status: validated.status,
          questions: {
            create: validated.questions.map((q) => ({
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points,
              order: q.order,
            })),
          },
        },
      }),
    ]);

    revalidatePath(`/admin/exams/${id}`);
    revalidatePath("/admin/exams");
    return { status: "success", message: "Exam updated successfully" };
  } catch (error) {
    console.error("Update exam error:", error);
    return { status: "error", message: "Failed to update exam" };
  }
}

export async function deleteExam(id: string): Promise<APIResponse> {
  await requireAdmin();

  try {
    await prisma.exam.delete({ where: { id } });
    revalidatePath("/admin/exams");
    return { status: "success", message: "Exam deleted successfully" };
  } catch (error) {
    return { status: "error", message: "Failed to delete exam" };
  }
}
