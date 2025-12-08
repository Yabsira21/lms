import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    AUTH_GITHUB_CLIENT_ID: z.string().min(1),
    AUTH_GOOGLE_CLIENT_ID: z.string().min(1),
    AUTH_GOOGLE_CLIENT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
  },
  //   client: {
  //     NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
  //   },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  //   runtimeEnv: {
  //     DATABASE_URL: process.env.DATABASE_URL,
  //     OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
  //     NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  //   },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    // NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY!,
  },
});
