import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { eq } from "drizzle-orm";
import { orm } from "../db/client";
import { userPreferences } from "../db/schema";

const PREFS_PATH = join(homedir(), ".ape", "preferences.json");

type Prefs = Record<string, { value: string; confidence: number }>;

async function readPrefs(): Promise<Prefs> {
  try {
    return JSON.parse(await readFile(PREFS_PATH, "utf8"));
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
    await mkdir(join(homedir(), ".ape"), { recursive: true });
    return {};
  }
}

export async function writePreference(key: string, value: string): Promise<void> {
  const prefs = await readPrefs();
  const existing = prefs[key];

  let confidence: number;
  if (!existing) {
    confidence = 0.5;
  } else if (existing.value === value) {
    confidence = Math.min(1.0, existing.confidence + 0.1);
  } else {
    confidence = 0.5;
  }

  prefs[key] = { value, confidence };

  await writeFile(PREFS_PATH, JSON.stringify(prefs, null, 2), "utf8");

  // Sync to DB — better-sqlite3 is synchronous so this runs inline
  orm
    .insert(userPreferences)
    .values({ key, value, confidence, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: userPreferences.key,
      set: { value, confidence, updatedAt: Date.now() },
    })
    .run();
}

export async function deletePreference(key: string): Promise<void> {
  const prefs = await readPrefs();
  delete prefs[key];
  await writeFile(PREFS_PATH, JSON.stringify(prefs, null, 2), "utf8");
  orm.delete(userPreferences).where(eq(userPreferences.key, key)).run();
}
