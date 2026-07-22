import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { orm } from "./db/client";
import { user, session, account, verification } from "./db/schema";

// Only register a social provider when both its env vars are present, so the
// server still boots with email/password alone until OAuth creds are added.
function buildSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }
  return providers;
}

const socialProviders = buildSocialProviders();

export const auth = betterAuth({
  // Explicit schema mapping so the auth `session` table is never confused with
  // the app's `sessions` task table.
  database: drizzleAdapter(orm, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  socialProviders,
  trustedOrigins: [process.env.WEB_ORIGIN || "http://localhost:5173"],
});

// Which social providers are live — the web UI reads this to show/hide the
// "Continue with Google/GitHub" buttons.
export const enabledSocialProviders = Object.keys(socialProviders);
