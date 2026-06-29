import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { HealthResponse } from "@ape/types";

const app = new Hono();

app.get("/", (c) => {
  const body: HealthResponse = { ok: true };
  return c.json(body);
});

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
