"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import axios from "axios";
import { APIResponse } from "@/lib/types";
import { redirect } from "next/navigation";
import { fixedWindow, request } from "@arcjet/next";
import arcjet from "@/lib/arcjet";
import { env } from "@/lib/env";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  }),
);

export async function enrollInLiveClassAction(
  liveClassId: string,
): Promise<APIResponse | never> {
  const user = await requireUser();

  let checkoutURL: string;

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: user.id,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "Too many requests. Please try again later.",
      };
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: {
        id: liveClassId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
        maxStudents: true,
        _count: {
          select: {
            enrollments: {
              where: {
                status: "Active",
              },
            },
          },
        },
      },
    });

    if (!liveClass) {
      return {
        status: "error",
        message: "Live class not found",
      };
    }

    // Check if class is full
    if (
      liveClass.maxStudents &&
      liveClass._count.enrollments >= liveClass.maxStudents
    ) {
      return {
        status: "error",
        message: "This class is full",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.liveEnrollment.findUnique({
        where: {
          userId_liveClassId: {
            userId: user.id,
            liveClassId: liveClassId,
          },
        },
        select: {
          status: true,
          id: true,
        },
      });

      if (existingEnrollment?.status === "Active") {
        redirect(`/live-class/${liveClass.slug}`);
      }

      let enrollment;

      if (existingEnrollment) {
        enrollment = await tx.liveEnrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: liveClass.price,
            status: "Pending",
            // updatedAt: new Date(),
          },
        });
      } else {
        enrollment = await tx.liveEnrollment.create({
          data: {
            userId: user.id,
            liveClassId: liveClass.id,
            amount: liveClass.price,
            status: "Pending",
          },
        });
      }

      // Generate tx_ref from enrollment ID
      const txRef = `${enrollment.id}-${Date.now()}`;

      const chapaData = {
        amount: liveClass.price.toString(),
        currency: "ETB",
        email: user.email,
        first_name: user.name?.trim().substr(0, 50) || "User",
        last_name: ".",
        tx_ref: txRef,
        callback_url: `${env.NGROK_URL}/api/webhook/chapa-live`,
        return_url: `${env.BETTER_AUTH_URL}/payment/success`,
        customization: {
          title: "Class Payment",
          description: `Payment for ${liveClass.title}`.substr(0, 100),
        },
        meta: {
          userId: user.id,
          liveClassId: liveClass.id,
          enrollmentId: enrollment.id,
          type: "live-class",
        },
      };

      const response = await axios.post(
        "https://api.chapa.co/v1/transaction/initialize",
        chapaData,
        {
          headers: {
            Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      if (response.data?.data?.checkout_url) {
        return {
          enrollment: enrollment,
          checkoutUrl: response.data.data.checkout_url,
        };
      } else {
        throw new Error("No checkout URL received from Chapa");
      }
    });

    checkoutURL = result.checkoutUrl as string;
  } catch (error: any) {
    console.error("Error in enrollInLiveClassAction:", error);

    if (error.response) {
      console.error("Chapa API error response:", error.response.data);
      return {
        status: "error",
        message: `Payment processing failed: ${
          error.response.data?.message || "Unknown error"
        }`,
      };
    }

    if (error.message?.includes("redirect")) {
      throw error;
    }

    return {
      status: "error",
      message: error.message || "Something went wrong",
    };
  }

  redirect(checkoutURL);
}
