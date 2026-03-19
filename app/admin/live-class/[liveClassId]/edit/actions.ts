"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { APIResponse } from "@/lib/types";
import { liveClassSchema, LiveClassSchemaType } from "@/lib/zodSchema";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export async function editLiveClass(
  data: LiveClassSchemaType,
  liveClassId: string,
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

    const result = liveClassSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    await prisma.liveClass.update({
      where: {
        id: liveClassId,
        instructorId: session.user.id,
      },
      data: {
        ...result.data,
        // Make sure daysOfWeek and frequencyPerWeek match
        // frequencyPerWeek: result.data.daysOfWeek.length,
      },
    });

    revalidatePath(`/admin/live-class/${liveClassId}/edit`);

    return {
      status: "success",
      message: "Live class updated successfully",
    };
  } catch (error) {
    console.error("Edit live class error:", error);
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}
