// Shared types for APE. Source-only package — no build step.

export interface HealthResponse {
  ok: boolean;
}

// ── SSE event types streamed to the client during a session ─────────────────

export type SessionEvent =
  | { type: "status";   status: string }
  | { type: "subtask";  index: number; text: string }
  | { type: "prompt";   subtask: number; candidate: number; text: string }
  | { type: "score";    subtask: number; candidate: number; score: number }
  | { type: "gate";     gateId: string; question: string; options: string[] }
  | { type: "output";   subtask: number; text: string }
  | { type: "critique"; subtask: number; score: number; reprompting: boolean }
  | { type: "done";     output: string }
  | { type: "error";    message: string };

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
