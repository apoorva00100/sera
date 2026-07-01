import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useReducer, useState } from "react";
import type { SessionEvent } from "@ape/types";
import { GateCard } from "../../components/GateCard";
import { PromptLog } from "../../components/PromptLog";

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

    case "subtask":
      return {
        ...state,
        subtasks: [
          ...state.subtasks,
          { index: action.index, text: action.text, candidates: [] },
        ],
      };

    case "prompt":
      return {
        ...state,
        subtasks: state.subtasks.map((st) =>
          st.index === action.subtask
            ? {
                ...st,
                candidates: [
                  ...st.candidates,
                  { num: action.candidate, text: action.text },
                ],
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
}: {
  children: React.ReactNode;
  className?: string;
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
      style={{ opacity: 0, transition: "opacity 0.35s ease" }}
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
    const es = new EventSource(
      `http://localhost:3001/api/sessions/${sid}/stream`
    );
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
        fetch("http://localhost:3001/api/context/preferences", {
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
      await fetch(`http://localhost:3001/api/gates/${gate.gateId}/respond`, {
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-900">
          ← Back
        </Link>
        <span className="text-gray-200">|</span>
        <span className="font-mono text-xs text-gray-400">{sessionId}</span>
      </div>

      {/* Gate card — full width, above timeline */}
      {state.activeGate && (
        <FadeIn className="mb-8">
          <GateCard gate={state.activeGate} onRespond={handleGateRespond} />
        </FadeIn>
      )}

      {/* Timeline */}
      <div className="space-y-5">
        {state.subtasks.map((subtask) => (
          <FadeIn
            key={subtask.index}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            {/* Subtask heading */}
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
              <span className="font-medium text-gray-800">{subtask.text}</span>
            </div>

            {/* Candidate prompts */}
            {subtask.candidates.length > 0 && (
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {subtask.candidates.map((c) => {
                  const isChosen = c.num === subtask.chosenNum;
                  return (
                    <FadeIn
                      key={c.num}
                      className={`rounded-lg border p-3 ${
                        isChosen
                          ? "border-green-300 bg-green-50"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-1">
                        <span className="text-xs text-gray-400">#{c.num}</span>
                        <div className="flex items-center gap-1">
                          {c.score !== undefined && (
                            <FadeIn>
                              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
                                {c.score.toFixed(1)}
                              </span>
                            </FadeIn>
                          )}
                          {isChosen && subtask.output !== undefined && (
                            <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-medium text-white">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="line-clamp-3 font-mono text-xs leading-relaxed text-gray-600">
                        {c.text}
                      </p>
                    </FadeIn>
                  );
                })}
              </div>
            )}

            {/* Subtask output */}
            {subtask.output !== undefined && (
              <FadeIn className="rounded-lg bg-gray-900 px-4 py-3">
                <p className="font-mono text-xs leading-relaxed text-gray-100 whitespace-pre-wrap">
                  {subtask.output}
                </p>
              </FadeIn>
            )}
          </FadeIn>
        ))}
      </div>

      {/* Empty state while connecting */}
      {state.subtasks.length === 0 && !state.finalOutput && !state.error && (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-400">Connecting to session…</p>
        </div>
      )}

      {/* Final output */}
      {state.finalOutput !== null && (
        <FadeIn className="mt-8 rounded-xl border-2 border-green-200 bg-green-50 p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-green-800">
              Final Output
            </span>
            <button
              onClick={handleCopy}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800">
            {state.finalOutput}
          </pre>
        </FadeIn>
      )}

      {/* Error */}
      {state.error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Prompt log */}
      <div className="mt-10">
        <PromptLog sessionId={sessionId} isDone={state.isDone} />
      </div>
    </div>
  );
}
