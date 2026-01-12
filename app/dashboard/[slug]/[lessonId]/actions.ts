"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { APIResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<APIResponse> {
  const session = await requireUser();

  try {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    revalidatePath(`/dashbaord/${slug}`);

    return {
      status: "success",
      message: "Progress updated",
    };
  } catch (e) {
    console.log(`error: ${e}`);
    return {
      status: "error",
      message: "failed to mark lesson as complete",
    };
  }
}
