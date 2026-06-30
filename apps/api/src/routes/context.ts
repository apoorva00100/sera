import { Hono } from "hono";
import { spawn } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { loadContext } from "../context/loader";
import { writePreference, deletePreference } from "../context/writer";

const app = new Hono();

// GET /api/context
app.get("/", async (c) => {
  const context = await loadContext();
  return c.json({ context });
});

// POST /api/context/preferences
app.post("/preferences", async (c) => {
  const body = await c.req.json<{ key?: string; value?: string }>();
  if (!body.key?.trim() || body.value === undefined) {
    return c.json({ error: "key and value are required" }, 400);
  }
  await writePreference(body.key, body.value);
  return c.json({ ok: true });
});

// DELETE /api/context/preferences/:key
app.delete("/preferences/:key", async (c) => {
  const key = c.req.param("key");
  await deletePreference(key);
  return c.json({ ok: true });
});

// GET /api/context/open-editor
// Opens ~/.ape/profile.md in $EDITOR (falls back to nano).
app.get("/open-editor", (c) => {
  const profilePath = join(homedir(), ".ape", "profile.md");
  spawn(process.env.EDITOR ?? "nano", [profilePath], {
    detached: true,
    stdio: "ignore",
  }).unref();
  return c.json({ ok: true });
});

export default app;
