"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { APIResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchema";
import { request } from "@arcjet/next";
import { NextResponse } from "next/server";

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m", // 1 minute
      max: 5, // limit each IP to 5 requests per windowMs})
    })
  );

export async function CreateCourse(
  values: CourseSchemaType
): Promise<APIResponse> {
  const session = await requireAdmin();
  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }

    const validation = courseSchema.safeParse(values);
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid Form Data",
      };
    }

    const data = await prisma.course.create({
      data: {
        ...validation.data,
        userId: session?.user.id as string, //TODO: get user from session
      },
    });

    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch (e) {
    // console.log(e);
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}
