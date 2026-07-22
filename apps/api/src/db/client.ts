import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const db = new Database(process.env.DB_PATH || "./ape.db");
db.pragma("journal_mode = WAL");

export const orm = drizzle(db, { schema });
export type ORM = typeof orm;
