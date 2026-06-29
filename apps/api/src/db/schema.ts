import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id:         text("id").primaryKey(),
  task:       text("task").notNull(),
  projectId:  text("project_id"),
  status:     text("status").notNull().default("pending"),
  output:     text("output"),
  checkpoint: text("checkpoint"),          // serialized loop state
  createdAt:  integer("created_at").notNull(),
  updatedAt:  integer("updated_at").notNull(),
});

export const prompts = sqliteTable("prompts", {
  id:        text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  subtask:   text("subtask").notNull(),
  candidate: text("candidate").notNull(),
  score:     real("score"),
  chosen:    integer("chosen").notNull().default(0),
  output:    text("output"),
  note:      text("note"),                 // e.g. "reprompt" marker
  createdAt: integer("created_at").notNull(),
});

export const gateDecisions = sqliteTable("gate_decisions", {
  id:         text("id").primaryKey(),
  sessionId:  text("session_id").notNull().references(() => sessions.id),
  question:   text("question").notNull(),
  options:    text("options").notNull(),   // JSON array
  chosen:     text("chosen"),
  createdAt:  integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
});

export const userPreferences = sqliteTable("user_preferences", {
  key:       text("key").primaryKey(),
  value:     text("value").notNull(),
  confidence: real("confidence").notNull().default(0.5),
  updatedAt: integer("updated_at").notNull(),
});
