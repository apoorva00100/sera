import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eq, desc, and, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import type { SSEStreamingApi } from "hono/streaming";
import type { SessionEvent } from "@ape/types";
import { orm } from "../db/client";
import { sessions, prompts, gateDecisions } from "../db/schema";
import { loadContext } from "../context/loader";
import { runLoop, resumeLoop } from "../ape/loop";
import * as bus from "../bus";

const app = new Hono();

// ── Gate polling helper ───────────────────────────────────────────────────────

async function pollGate(
  gateId: string,
  timeoutMs: number
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [gate] = orm
      .select()
      .from(gateDecisions)
      .where(eq(gateDecisions.id, gateId))
      .all();
    if (gate?.chosen) return gate.chosen;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

// Drives resumeLoop to completion, handling any further gates recursively.
async function handleGate(
  sessionId: string,
  gateId: string,
  stream: SSEStreamingApi
): Promise<void> {
  const choice = await pollGate(gateId, 10 * 60 * 1000);
  if (!choice) {
    await stream.writeSSE({
      data: JSON.stringify({ type: "error", message: "gate timeout" } satisfies SessionEvent),
    });
    return;
  }

  for await (const event of resumeLoop(sessionId, gateId, choice)) {
    await stream.writeSSE({ data: JSON.stringify(event) });
    if (event.type === "done" || event.type === "error") return;
    if (event.type === "gate") {
      await handleGate(sessionId, event.gateId, stream);
      return;
    }
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/sessions
app.post("/", async (c) => {
  const body = await c.req.json<{ task?: string; projectId?: string }>();
  if (!body.task?.trim()) {
    return c.json({ error: "task is required" }, 400);
  }

  const sessionId = ulid();
  const now = Date.now();

  orm
    .insert(sessions)
    .values({
      id: sessionId,
      task: body.task,
      projectId: body.projectId ?? null,
      status: "pending",
      output: null,
      checkpoint: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const context = await loadContext(body.projectId);

  // Fire and forget — loop events are broadcast via bus so SSE stream can subscribe
  void (async () => {
    try {
      for await (const event of runLoop(sessionId, body.task!, context)) {
        bus.push(sessionId, event);
      }
    } catch (err) {
      const errEvent: SessionEvent = { type: "error", message: String(err) };
      bus.push(sessionId, errEvent);
      orm
        .update(sessions)
        .set({ status: "failed", updatedAt: Date.now() })
        .where(eq(sessions.id, sessionId))
        .run();
    } finally {
      bus.close(sessionId);
    }
  })();

  return c.json({ sessionId }, 201);
});

// GET /api/sessions
app.get("/", (c) => {
  const rows = orm
    .select()
    .from(sessions)
    .orderBy(desc(sessions.createdAt))
    .limit(20)
    .all();
  return c.json(rows);
});

// GET /api/sessions/:id
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const [session] = orm
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .all();
  if (!session) return c.json({ error: "not found" }, 404);

  const sessionPrompts = orm
    .select()
    .from(prompts)
    .where(eq(prompts.sessionId, id))
    .all();
  const sessionGates = orm
    .select()
    .from(gateDecisions)
    .where(eq(gateDecisions.sessionId, id))
    .all();

  return c.json({ ...session, prompts: sessionPrompts, gateDecisions: sessionGates });
});

// GET /api/sessions/:id/stream
app.get("/:id/stream", (c) => {
  const id = c.req.param("id");

  return streamSSE(c, async (stream) => {
    const [session] = orm
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .all();

    if (!session) {
      await stream.writeSSE({
        data: JSON.stringify({ type: "error", message: "session not found" } satisfies SessionEvent),
      });
      return;
    }

    // Already finished — replay final output immediately
    if (session.status === "done") {
      await stream.writeSSE({
        data: JSON.stringify({ type: "done", output: session.output ?? "" } satisfies SessionEvent),
      });
      return;
    }

    // Reconnect after a gate fired — find the pending gate and wait for resolution
    if (session.status === "gating") {
      const [gate] = orm
        .select()
        .from(gateDecisions)
        .where(
          and(
            eq(gateDecisions.sessionId, id),
            isNull(gateDecisions.resolvedAt)
          )
        )
        .all();

      if (!gate) {
        await stream.writeSSE({
          data: JSON.stringify({ type: "error", message: "no pending gate found" } satisfies SessionEvent),
        });
        return;
      }

      await handleGate(id, gate.id, stream);
      return;
    }

    // pending | running — subscribe to bus, replay buffer, then listen for new events
    let i = 0;
    while (true) {
      const event = await bus.nextEvent(id, i++);
      if (!event) break; // bus closed (loop finished), nothing more to send

      await stream.writeSSE({ data: JSON.stringify(event) });

      if (event.type === "done" || event.type === "error") break;

      if (event.type === "gate") {
        // Loop paused — take over driving from here
        await handleGate(id, event.gateId, stream);
        break;
      }
    }
  });
});

export default app;
