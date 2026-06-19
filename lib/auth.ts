// import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./db";
import { resend } from "./resend";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  socialProviders: {
    github: {
      clientId: env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.AUTH_GITHUB_SECRET || "",
    },
    google: {
      clientId: env.AUTH_GOOGLE_CLIENT_ID || "",
      clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET || "",
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await resend.emails.send({
          from: "LMS <onboarding@resend.dev>",
          to: [email],
          subject: "LMS, verify your email",
          // react: EmailTemplate({ firstName: "John" }),
          html: `<h1>Your verification code is:<strong> ${otp}</strong></h1>`,
        });
      },
    }),
    admin({}),
  ],
});
