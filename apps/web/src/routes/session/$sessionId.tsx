import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useReducer, useState } from "react";
import type { SessionEvent } from "@ape/types";
import { GateCard } from "../../components/GateCard";
import { PromptLog } from "../../components/PromptLog";
import { API_URL } from "../../lib/config";

export const Route = createFileRoute("/session/$sessionId")({
  component: SessionPage,
});

// ── State types ───────────────────────────────────────────────────────────────

type GateEvent = Extract<SessionEvent, { type: "gate" }>;

interface Candidate {
  num: number;
  text: string;
  score?: number;
}

interface SubtaskState {
  index: number;
  text: string;
  candidates: Candidate[];
  chosenNum?: number;
  output?: string;
}

interface GateRecord {
  question: string;
  chosenOption: string;
}

interface PageState {
  subtasks: SubtaskState[];
  activeGate: GateEvent | null;
  gateHistory: GateRecord[];
  finalOutput: string | null;
  error: string | null;
  isDone: boolean;
}

type Action =
  | SessionEvent
  | { type: "clearGate"; question: string; choice: string };

const initial: PageState = {
  subtasks: [],
  activeGate: null,
  gateHistory: [],
  finalOutput: null,
  error: null,
  isDone: false,
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "clearGate":
      return {
        ...state,
        activeGate: null,
        gateHistory: [
          ...state.gateHistory,
          { question: action.question, chosenOption: action.choice },
        ],
      };

    case "subtask": {
      // Reconnects replay the whole event buffer from the start — ignore
      // a subtask we've already recorded instead of pushing a duplicate.
      if (state.subtasks.some((st) => st.index === action.index)) return state;
      return {
        ...state,
        subtasks: [
          ...state.subtasks,
          { index: action.index, text: action.text, candidates: [] },
        ],
      };
    }

    case "prompt":
      return {
        ...state,
        subtasks: state.subtasks.map((st) =>
          st.index === action.subtask
            ? {
                ...st,
                candidates: st.candidates.some((c) => c.num === action.candidate)
                  ? st.candidates
                  : [...st.candidates, { num: action.candidate, text: action.text }],
              }
            : st
        ),
      };

    case "score":
      return {
        ...state,
        subtasks: state.subtasks.map((st) =>
          st.index === action.subtask
            ? {
                ...st,
                candidates: st.candidates.map((c) =>
                  c.num === action.candidate ? { ...c, score: action.score } : c
                ),
              }
            : st
        ),
      };

    case "gate":
      return { ...state, activeGate: action };

    case "output": {
      const subtask = state.subtasks.find((st) => st.index === action.subtask);
      const chosenNum = subtask
        ? [...subtask.candidates].sort(
            (a, b) => (b.score ?? 0) - (a.score ?? 0)
          )[0]?.num
        : undefined;
      return {
        ...state,
        subtasks: state.subtasks.map((st) =>
          st.index === action.subtask
            ? { ...st, output: action.text, chosenNum }
            : st
        ),
      };
    }

    case "done":
      return {
        ...state,
        finalOutput: action.output,
        isDone: true,
        activeGate: null,
      };

    case "error":
      return { ...state, error: action.message };

    default:
      return state;
  }
}

// ── Fade-in wrapper ───────────────────────────────────────────────────────────

function FadeIn({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
  }, []);
  return (
    <div
      ref={ref}
      style={{ opacity: 0, transition: "opacity 0.35s ease", ...style }}
      className={className}
    >
      {children}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","to","of","in","on","at",
  "by","for","with","do","does","did","will","would","could","should","may",
  "and","or","but","not","what","which","who","when","where","why","how",
  "you","we","i","your","our","this","that","it","its",
]);

function deriveKey(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w))
    .join(".");
}

// ── Component ─────────────────────────────────────────────────────────────────

function SessionPage() {
  const { sessionId } = Route.useParams();
  const [state, dispatch] = useReducer(reducer, initial);
  const esRef = useRef<EventSource | null>(null);
  const [copied, setCopied] = useState(false);

  function openStream(sid: string) {
    esRef.current?.close();
    const es = new EventSource(`${API_URL}/api/sessions/${sid}/stream`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as SessionEvent;
        dispatch(event);
        if (event.type === "done" || event.type === "error") {
          es.close();
          esRef.current = null;
        }
      } catch {
        /* ignore parse errors */
      }
    };

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        esRef.current = null;
      }
    };
  }

  useEffect(() => {
    openStream(sessionId);
    return () => {
      esRef.current?.close();
    };
  }, [sessionId]);

  // Save gate decisions as user preferences once the session completes.
  useEffect(() => {
    if (!state.isDone || state.gateHistory.length === 0) return;
    void Promise.all(
      state.gateHistory.map(({ question, chosenOption }) =>
        fetch(`${API_URL}/api/context/preferences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: deriveKey(question), value: chosenOption }),
        })
      )
    );
  }, [state.isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGateRespond(choice: string) {
    const gate = state.activeGate;
    if (!gate) return;
    dispatch({ type: "clearGate", question: gate.question, choice });
    esRef.current?.close();
    esRef.current = null;
    try {
      await fetch(`${API_URL}/api/gates/${gate.gateId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
    } catch {
      /* reconnect regardless */
    }
    openStream(sessionId);             // reopen — server resumes from checkpoint
  }

  async function handleCopy() {
    if (!state.finalOutput) return;
    await navigator.clipboard.writeText(state.finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const status = state.isDone
    ? { label: "DONE", color: "#5fd68a" }
    : state.error
      ? { label: "FAILED", color: "#f0685f" }
      : state.activeGate
        ? { label: "GATING", color: "#f5b83d" }
        : { label: "RUNNING", color: "var(--accent)" };

  return (
    <div className="ape-fade mx-auto max-w-[820px] px-6 pb-24 pt-[46px]">
      {/* Header */}
      <div className="mb-[26px] flex items-center gap-3">
        <Link
          to="/app"
          className="text-[13px] font-semibold"
          style={{ color: "#7a726b" }}
        >
          ← Back
        </Link>
        <span style={{ color: "#3a332e" }}>/</span>
        <span className="mono text-[12.5px]" style={{ color: "var(--muted)" }}>
          {sessionId.slice(0, 10)}
        </span>
        <span
          className="ml-auto inline-flex items-center gap-[7px] rounded-full px-[11px] py-[5px] text-[11.5px] font-bold"
          style={{
            background: `color-mix(in srgb, ${status.color} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${status.color} 40%, transparent)`,
            color: `color-mix(in srgb, ${status.color} 65%, white 35%)`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: status.color,
              animation: state.isDone || state.error ? "none" : "ape-pulse 1.6s ease infinite",
            }}
          />
          {status.label}
        </span>
      </div>

      {/* Gate card — full width, above timeline */}
      {state.activeGate && (
        <FadeIn className="mb-[26px]">
          <GateCard gate={state.activeGate} onRespond={handleGateRespond} />
        </FadeIn>
      )}

      {/* Timeline */}
      <div className="flex flex-col gap-[18px]">
        {state.subtasks.map((subtask) => (
          <FadeIn key={subtask.index} className="ape-card p-[22px]">
            {/* Subtask heading */}
            <div className="mb-4 flex items-center gap-[11px]">
              <span
                className="mono rounded-[7px] px-2 py-[3px] text-[11px] font-semibold"
                style={{
                  color: "color-mix(in srgb, var(--accent) 60%, white 40%)",
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                {String(subtask.index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] font-semibold" style={{ color: "var(--body)" }}>
                {subtask.text}
              </span>
            </div>

            {/* Candidate prompts */}
            {subtask.candidates.length > 0 && (
              <div
                className="mb-3.5 grid gap-2.5"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
              >
                {subtask.candidates.map((c) => {
                  const isChosen = c.num === subtask.chosenNum;
                  return (
                    <FadeIn
                      key={c.num}
                      className="p-[13px]"
                      style={
                        isChosen
                          ? {
                              borderRadius: "12px",
                              background: "color-mix(in srgb, var(--accent) 12%, var(--surface-2))",
                              border: "1px solid color-mix(in srgb, var(--accent) 55%, transparent)",
                              boxShadow: "0 0 22px color-mix(in srgb, var(--accent) 14%, transparent)",
                            }
                          : {
                              borderRadius: "12px",
                              background: "#0e0a08",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }
                      }
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="mono text-[11px]" style={{ color: "var(--muted)" }}>
                          #{c.num}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {c.score !== undefined && (
                            <FadeIn>
                              <span
                                className="mono rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  color: "#C9C1BA",
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                {c.score.toFixed(1)}
                              </span>
                            </FadeIn>
                          )}
                          {isChosen && subtask.output !== undefined && (
                            <span
                              className="grid h-[17px] w-[17px] place-items-center rounded-full text-[10px] text-white"
                              style={{ background: "#3f9d5c" }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                      <p
                        className="mono m-0 line-clamp-3 text-[11.5px] leading-[1.5]"
                        style={{ color: "#948b83" }}
                      >
                        {c.text}
                      </p>
                    </FadeIn>
                  );
                })}
              </div>
            )}

            {/* Subtask output */}
            {subtask.output !== undefined && (
              <FadeIn
                className="px-[15px] py-[13px]"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "11px",
                }}
              >
                <p className="mono m-0 whitespace-pre-wrap text-[12px] leading-[1.55]" style={{ color: "#7dd88f" }}>
                  {subtask.output}
                </p>
              </FadeIn>
            )}
          </FadeIn>
        ))}
      </div>

      {/* Empty state while connecting */}
      {state.subtasks.length === 0 && !state.finalOutput && !state.error && (
        <div
          className="py-16 text-center"
          style={{ border: "1px dashed var(--border)", borderRadius: "18px" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Connecting to session…
          </p>
        </div>
      )}

      {/* Final output */}
      {state.finalOutput !== null && (
        <FadeIn
          className="mt-6 p-6"
          style={{
            borderRadius: "18px",
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--accent) 10%, transparent), color-mix(in srgb, var(--accent) 3%, transparent))",
            border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
          }}
        >
          <div className="mb-3.5 flex items-center justify-between">
            <span
              className="text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ color: "color-mix(in srgb, var(--accent) 55%, white 45%)" }}
            >
              Final output
            </span>
            <button
              onClick={handleCopy}
              className="ape-btn-ghost px-[13px] py-1.5 text-xs"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="mono m-0 whitespace-pre-wrap text-[12.5px] leading-[1.6]" style={{ color: "#C9C1BA" }}>
            {state.finalOutput}
          </pre>
        </FadeIn>
      )}

      {/* Error */}
      {state.error && (
        <div
          className="mt-6 p-4"
          style={{
            borderRadius: "14px",
            background: "rgba(240,104,95,0.08)",
            border: "1px solid rgba(240,104,95,0.35)",
          }}
        >
          <p className="text-sm" style={{ color: "#f0685f" }}>
            {state.error}
          </p>
        </div>
      )}

      {/* Prompt log */}
      <div className="mt-6">
        <PromptLog sessionId={sessionId} isDone={state.isDone} />
      </div>
    </div>
  );
}
