import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware, APIError } from "better-auth/api";

import prisma from "@/lib/prisma";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Defense in depth: re-validate credentials on the server, since the
      // client-side zod check can be bypassed by calling the API directly.
      if (ctx.path === "/sign-up/email") {
        const result = signUpSchema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message: result.error.issues[0]?.message ?? "Invalid input.",
          });
        }
      }

      if (ctx.path === "/sign-in/email") {
        const result = signInSchema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message: result.error.issues[0]?.message ?? "Invalid input.",
          });
        }
      }
    }),
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
