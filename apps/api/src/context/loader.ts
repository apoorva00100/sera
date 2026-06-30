import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const APE_DIR = join(homedir(), ".ape");

const DEFAULT_PROFILE = `# My profile
## Who I am
Solo founder building B2B SaaS products for small businesses in India.

## My defaults
- Stack: React, Tailwind, Hono, Bun, Drizzle + SQLite → Turso
- Payments: Razorpay (primary), Stripe (international)
- Deploy: Fly.io for API, Vercel for web
- Launch philosophy: ship fast, iterate on feedback

## My aesthetic
Clean, minimal, no dark mode by default, generous whitespace.
`;

async function readOrCreate(path: string, fallback: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, fallback, "utf8");
    return fallback;
  }
}

export async function loadContext(projectId?: string): Promise<string> {
  const profilePath = join(APE_DIR, "profile.md");
  const prefsPath = join(APE_DIR, "preferences.json");

  const [profile, prefsRaw] = await Promise.all([
    readOrCreate(profilePath, DEFAULT_PROFILE),
    readOrCreate(prefsPath, "{}"),
  ]);

  const prefs: Record<string, { value: string; confidence: number }> =
    JSON.parse(prefsRaw);

  const prefsBlock =
    Object.entries(prefs)
      .map(([k, v]) => `- ${k}: ${v.value} (confidence: ${v.confidence.toFixed(1)})`)
      .join("\n") || "(none yet)";

  const parts = [
    `## Profile\n${profile.trim()}`,
    `## Preferences\n${prefsBlock}`,
  ];

  if (projectId) {
    const brandPath = join(APE_DIR, "projects", projectId, "brand.md");
    try {
      const brand = await readFile(brandPath, "utf8");
      parts.push(`## Project\n${brand.trim()}`);
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
      // no brand file for this project — skip silently
    }
  }

  return parts.join("\n\n");
}
