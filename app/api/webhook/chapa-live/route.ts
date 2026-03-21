import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function verifyChapaSignature(
  req: NextRequest,
  secret: string,
  rawBody: string,
): boolean {
  const chapaSignature = req.headers.get("chapa-signature");
  const xChapaSignature = req.headers.get("x-chapa-signature");

  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return chapaSignature === expectedHash || xChapaSignature === expectedHash;
}

export async function GET(request: NextRequest) {
  console.log("Received GET request at Chapa Live webhook endpoint");

  const url = new URL(request.url);
  const trxRef = url.searchParams.get("trx_ref");

  if (!trxRef) {
    return NextResponse.json({ error: "Missing trx_ref" }, { status: 400 });
  }

  try {
    // Verify transaction with Chapa
    const verifyResponse = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${trxRef}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await verifyResponse.json();
    console.log("Chapa verify response for live class:", data);

    if (data.status === "success" && data.data?.status === "success") {
      const liveClassId = data.data.meta?.liveClassId;
      const userId = data.data.meta?.userId;
      const enrollmentId = data.data.meta?.enrollmentId;

      if (!liveClassId || !userId || !enrollmentId) {
        throw new Error("Missing required meta data");
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if live class exists
      const liveClass = await prisma.liveClass.findUnique({
        where: { id: liveClassId },
      });

      if (!liveClass) {
        throw new Error("Live class not found");
      }

      // Update enrollment to Active
      await prisma.liveEnrollment.update({
        where: {
          id: enrollmentId,
        },
        data: {
          userId: user.id,
          liveClassId: liveClassId,
          amount: data.data.amount,
          status: "Active",
        },
      });

      console.log(
        `Successfully enrolled user ${userId} in live class ${liveClassId}`,
      );
    }

    return NextResponse.json(
      {
        verified: true,
        chapaStatus: data?.data?.status,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying Chapa live class transaction:", error);

    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 },
    );
  }
}
