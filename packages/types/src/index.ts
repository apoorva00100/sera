// Shared types for APE. Source-only package — no build step.

export interface HealthResponse {
  ok: boolean;
}

// ── DB row types ─────────────────────────────────────────────────────────────

export type SessionStatus = "pending" | "running" | "gating" | "done" | "failed";

export interface Session {
  id: string;
  task: string;
  projectId: string | null;
  status: SessionStatus;
  output: string | null;
  checkpoint: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  sessionId: string;
  subtask: string;
  candidate: string;
  score: number | null;
  chosen: number;
  output: string | null;
  note: string | null;
  createdAt: number;
}

export interface GateDecision {
  id: string;
  sessionId: string;
  question: string;
  options: string;        // JSON-encoded string[] in DB
  chosen: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

export interface UserPreference {
  key: string;
  value: string;
  confidence: number;
  updatedAt: number;
}
