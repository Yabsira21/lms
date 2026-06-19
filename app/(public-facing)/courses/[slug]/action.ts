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

export async function enrollInCourseAction(
  courseId: string,
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
        message: "You have been blocked",
      };
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const exisitingEnrollement = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
        select: {
          status: true,
          id: true,
        },
      });

      if (exisitingEnrollement?.status === "Active") {
        redirect(`/courses/${course.slug}`);
      }

      let enrollment;

      if (exisitingEnrollement) {
        enrollment = await tx.enrollment.update({
          where: {
            id: exisitingEnrollement.id,
          },
          data: {
            amount: course.price,
            status: "Pending",
            updatedAt: new Date(),
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.price,
            status: "Pending",
          },
        });
      }

      // Generate tx_ref from enrollment ID
      const txRef = `${enrollment.id}-${Date.now()}`;

      // Prepare customization

      const chapaData = {
        amount: course.price.toString(),
        currency: "ETB",
        email: user.email,
        first_name: user.name?.trim().substr(0, 50) || "User",
        last_name: ".",
        tx_ref: txRef,
        callback_url: `${env.NGROK_URL}/api/webhook/chapa`,
        return_url: `${env.BETTER_AUTH_URL}/payment/success`,
        customization: {
          title: "Course Payment",
          description: `Payment for ${course.title[0]}`.substr(0, 100),
        },
        meta: {
          userId: user.id,
          courseId: course.id,
          enrollmentId: enrollment.id,
        },
      };

      // console.log("Sending to Chapa:", JSON.stringify(chapaData, null, 2));

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
    console.error("Error in enrollInCourseAction:", error);

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
      throw error; // Re-throw redirect errors
    }

    return {
      status: "error",
      message: error.message || "Something went wrong",
    };
  }

  redirect(checkoutURL);
}
