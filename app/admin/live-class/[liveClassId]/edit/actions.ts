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
        // instructorId: session.user.id,
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

// Add these to your existing actions file

export async function updateClass(
  classId: string,
  data: {
    title: string;
    startTime: Date;
    endTime: Date;
    status: "Scheduled" | "Ongoing" | "Completed";
    liveClassId: string;
  },
): Promise<APIResponse> {
  const session = await requireAdmin();

  try {
    // Check if class exists and user has permission
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      include: { liveClass: true },
    });

    if (!existingClass) {
      return { status: "error", message: "Class not found" };
    }

    // Check if class is in the past
    const now = new Date();
    if (existingClass.startTime < now && data.status !== "Completed") {
      return { status: "error", message: "Cannot edit past classes" };
    }

    // Check if trying to edit completed class
    if (existingClass.status === "Completed") {
      return { status: "error", message: "Cannot edit completed classes" };
    }

    // Check if start time is in the past
    if (data.startTime < now) {
      return {
        status: "error",
        message: "Cannot schedule classes in the past",
      };
    }

    // Check if end time is after start time
    if (data.endTime <= data.startTime) {
      return { status: "error", message: "End time must be after start time" };
    }

    await prisma.class.update({
      where: { id: classId },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
      },
    });

    revalidatePath(`/admin/live-class/${data.liveClassId}/edit`);

    return { status: "success", message: "Class updated successfully" };
  } catch (error) {
    console.error("Update class error:", error);
    return { status: "error", message: "Failed to update class" };
  }
}

export async function deleteClass(
  classId: string,
  liveClassId: string,
): Promise<APIResponse> {
  const session = await requireAdmin();

  try {
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return { status: "error", message: "Class not found" };
    }

    // Check if class is in the past
    const now = new Date();
    if (existingClass.startTime < now) {
      return { status: "error", message: "Cannot delete past classes" };
    }

    // Check if class is completed
    if (existingClass.status === "Completed") {
      return { status: "error", message: "Cannot delete completed classes" };
    }

    await prisma.class.delete({
      where: { id: classId },
    });

    revalidatePath(`/admin/live-class/${liveClassId}/edit`);

    return { status: "success", message: "Class deleted successfully" };
  } catch (error) {
    console.error("Delete class error:", error);
    return { status: "error", message: "Failed to delete class" };
  }
}
