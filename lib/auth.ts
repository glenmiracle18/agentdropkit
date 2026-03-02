import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-for-dev",
  baseURL: process.env.BETTER_AUTH_URL || process.env.AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      githubId: {
        type: "string",
        required: false,
      },
      githubUsername: {
        type: "string", 
        required: false,
      },
    },
  },
  callbacks: {
    after: [
      {
        matcher(context) {
          return context.path?.startsWith("/sign-in") && context.method === "POST";
        },
        handler: async (ctx) => {
          if (ctx.context.returned?.user && ctx.context.returned?.account) {
            const { user, account } = ctx.context.returned;
            
            // Update user info from GitHub profile if it's a GitHub sign-in
            if (account.providerId === "github") {
              // The user data should already be updated during the OAuth flow
              // but we can add any additional logic here if needed
            }
          }
        },
      },
    ],
  },
});