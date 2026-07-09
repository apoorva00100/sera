import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth, enabledSocialProviders } from "./auth";
import sessionsRoutes from "./routes/sessions";
import gatesRoutes from "./routes/gates";
import contextRoutes from "./routes/context";

const app = new Hono()
  .use(
    "*",
    cors({
      origin: "http://localhost:5173",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type"],
      credentials: true, // required so the Better Auth session cookie is sent
    })
  )
  // Better Auth handler — serves sign-in/up/out, session, OAuth callbacks, etc.
  .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .get("/", (c) => c.json({ ok: true }))
  // Public runtime config — lets the web UI know which social logins are live.
  .get("/api/config", (c) => c.json({ socialProviders: enabledSocialProviders }))
  .route("/api/sessions", sessionsRoutes)
  .route("/api/gates", gatesRoutes)
  .route("/api/context", contextRoutes);

export type AppType = typeof app;

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
