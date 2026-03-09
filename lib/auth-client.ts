import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // remember to add production url here
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
