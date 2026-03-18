"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { APIResponse } from "@/lib/types";
import { liveClassSchema, LiveClassSchemaType } from "@/lib/zodSchema";
import { request } from "@arcjet/next";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

function generateSessions(liveClass: any) {
  const sessions = [];

  const { startDate, durationWeeks, daysOfWeek, startTime, sessionDuration } =
    liveClass;

  const start = new Date(startDate);

  for (let week = 0; week < durationWeeks; week++) {
    for (const day of daysOfWeek) {
      const sessionDate = new Date(start);

      // move to correct week
      sessionDate.setDate(start.getDate() + week * 7);

      // move to correct weekday
      const dayIndex = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ].indexOf(day);

      while (sessionDate.getDay() !== dayIndex) {
        sessionDate.setDate(sessionDate.getDate() + 1);
      }

      // set time
      const [hour, minute] = startTime.split(":");
      sessionDate.setHours(Number(hour), Number(minute), 0);

      const endTime = new Date(sessionDate);
      endTime.setMinutes(endTime.getMinutes() + sessionDuration);

      sessions.push({
        title: liveClass.title,
        startTime: sessionDate,
        endTime,
        liveClassId: liveClass.id,
      });
    }
  }

  return sessions;
}

export async function CreateLiveClass(
  values: LiveClassSchemaType,
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

    const validation = liveClassSchema.safeParse(values);
    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid Form Data",
      };
    }

    const data = validation.data;

    // 🔥 TRANSACTION START
    await prisma.$transaction(async (tx) => {
      // 1. Create LiveClass
      const liveClass = await tx.liveClass.create({
        data: {
          ...data,
          instructorId: session.user.id,
          slug: data.title.toLowerCase().replace(/\s+/g, "-"),
        },
      });

      // 2. Generate sessions
      const sessions = generateSessions({
        ...data,
        id: liveClass.id,
      });

      // 3. Create sessions
      await tx.class.createMany({
        data: sessions.map((s: any) => ({
          ...s,
          liveClassId: liveClass.id,
        })),
      });
    });
    // 🔥 TRANSACTION END

    return {
      status: "success",
      message: "Live class created successfully",
    };
  } catch (e) {
    return {
      status: "error",
      message: "Failed to create live class",
    };
  }
}

export async function searchInstructors(query: string) {
  const session = await requireAdmin();

  if (!query || query.length < 2) return [];

  return prisma.user.findMany({
    where: {
      role: "instructor",
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 10,
  });
}
