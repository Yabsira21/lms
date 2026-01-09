"user server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
// import { Prisma } from "@/lib/generated/prisma/browser";
import { APIResponse } from "@/lib/types";

export async function enrollInCourseAction(courseId: string) {
  await requireUser();
  try {
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    return {
      status: "success",
      message: "",
    };
  } catch {
    return {
      status: "error",
      message: "something went wrong",
    };
  }
}
