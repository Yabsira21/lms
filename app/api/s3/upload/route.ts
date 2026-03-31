import { requireAdmin } from "@/app/data/admin/require-admin";
import { requireUser } from "@/app/data/user/require-user";
import { S3 } from "@/lib/S3Clinet";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const fileUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, {
      message: "File name is required",
    })
    .max(255),
  contentType: z
    .string()
    .min(1, {
      message: "Content type is required",
    })
    .max(100),
  size: z.number().min(1, {
    message: "File size must be greater than 0",
  }),
  isImage: z.boolean(),
});

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m", // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs})
  }),
);

export async function POST(request: Request) {
  // const session = await auth.api.getSession({ headers: await headers() });

  const session = await requireUser();
  try {
    const decision = await aj.protect(request, {
      fingerprint: session?.id as string,
    });

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();

    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { fileName, contentType, size } = validation.data;

    const unique = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: unique,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 360 });

    const response = {
      presignedUrl,
      key: unique,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}
