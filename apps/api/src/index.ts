import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
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
    })
  )
  .get("/", (c) => c.json({ ok: true }))
  .route("/api/sessions", sessionsRoutes)
  .route("/api/gates", gatesRoutes)
  .route("/api/context", contextRoutes);

export type AppType = typeof app;

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
