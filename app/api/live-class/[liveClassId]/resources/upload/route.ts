import { requireUser } from "@/app/data/user/require-user";
import { S3 } from "@/lib/S3Clinet";
import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { request as arcjetRequest } from "@arcjet/next";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  }),
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ liveClassId: string }> },
) {
  const session = await requireUser();
  const { liveClassId } = await params;

  try {
    // Rate limiting
    const req = await arcjetRequest();
    const decision = await aj.protect(req, {
      fingerprint: session.id,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Check if user is the instructor of this live class
    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId },
      select: { instructorId: true },
    });

    if (!liveClass) {
      return NextResponse.json(
        { error: "Live class not found" },
        { status: 404 },
      );
    }

    if (liveClass.instructorId !== session.id) {
      return NextResponse.json(
        { error: "Only instructors can upload resources" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { fileName, contentType, size } = body;

    if (!fileName || !contentType || !size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate unique key for S3
    const unique = `live-class-resources/${liveClassId}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: unique,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 360 });

    return NextResponse.json({
      presignedUrl,
      key: unique,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}
