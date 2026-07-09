import { createAuthClient } from "better-auth/react";

// Points at the API server; the client calls its /api/auth/* endpoints.
export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
});

export const { signIn, signUp, signOut, useSession } = authClient;
