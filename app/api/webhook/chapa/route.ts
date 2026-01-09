// export async function POST() {}

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function verifyChapaSignature(
  req: NextRequest,
  secret: string,
  rawBody: string
): boolean {
  // Get the signatures from the headers
  const chapaSignature = req.headers.get("chapa-signature");
  const xChapaSignature = req.headers.get("x-chapa-signature");

  // Calculate the expected hash
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // The webhook is valid if EITHER header matches the expected hash
  return chapaSignature === expectedHash || xChapaSignature === expectedHash;
}

export async function POST(request: NextRequest) {
  console.log("wow xoxo");
  const rawBody = await request.text();

  console.log(`rawBody: ${rawBody}`);

  // Verify the signature
  if (!verifyChapaSignature(request, env.CHAPA_SECRET_HASH, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process the webhook...
  const event = JSON.parse(rawBody);

  console.log(`event: ${event}`);

  //   try {
  //   } catch {
  //     return new Response("Webhook error", { status: 400 });
  //   }

  //   const session = event.data.object;
  // Your processing logic here
}

export async function GET(request: NextRequest) {
  // 1️⃣ Extract trx_ref from query params
  const url = new URL(request.url);
  const trxRef = url.searchParams.get("trx_ref");

  if (!trxRef) {
    return NextResponse.json({ error: "Missing trx_ref" }, { status: 400 });
  }

  try {
    // 2️⃣ Call Chapa verify API (SERVER → SERVER)
    const verifyResponse = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${trxRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await verifyResponse.json();

    // 3️⃣ Print result (for debugging)
    console.log("Chapa verify response:", data);

    if (data.data.status == "success") {
      const courseId = data.data.meta?.courseId;
      const userId = data.data.meta?.userId;

      if (!courseId) {
        throw new Error("Course not found...");
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error("User not found...");
      }

      await prisma.enrollment.update({
        where: {
          id: data.data.meta?.enrollmentId as string,
        },
        data: {
          userId: user.id,
          courseId: courseId,
          amount: data.data.amount as number,
          status: "Active",
        },
      });
    }
    // 4️⃣ Return minimal safe response
    return NextResponse.json(
      {
        verified: true,
        chapaStatus: data?.data?.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying Chapa transaction:", error);

    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
