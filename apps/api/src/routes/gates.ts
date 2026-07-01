import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { orm } from "../db/client";
import { gateDecisions } from "../db/schema";

const app = new Hono();

// POST /api/gates/:id/respond
// Resolves a pending gate decision. The SSE stream polling in
// sessions/:id/stream detects the resolved_at change and resumes automatically.
const routes = app.post("/:id/respond", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ choice?: string }>();

  if (!body.choice?.trim()) {
    return c.json({ error: "choice is required" }, 400);
  }

  const [gate] = orm
    .select()
    .from(gateDecisions)
    .where(eq(gateDecisions.id, id))
    .all();

  if (!gate) return c.json({ error: "gate not found" }, 404);
  if (gate.chosen) return c.json({ error: "gate already resolved" }, 409);

  orm
    .update(gateDecisions)
    .set({ chosen: body.choice, resolvedAt: Date.now() })
    .where(eq(gateDecisions.id, id))
    .run();

  return c.json({ ok: true });
});

export default routes;
