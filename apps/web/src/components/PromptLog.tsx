import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "../lib/api";

interface Props {
  sessionId: string;
  isDone: boolean;
}

export function PromptLog({ sessionId, isDone }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: async () => {
      const res = await client.api.sessions[":id"].$get({ param: { id: sessionId } });
      return res.json();
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isDone && isOpen) refetch();
  }, [isDone, isOpen, refetch]);

  const prompts =
    data && "prompts" in data && Array.isArray(data.prompts) ? data.prompts : [];

  // Group by subtask, preserving insertion order
  const subtaskOrder: string[] = [];
  const grouped = new Map<string, typeof prompts>();
  for (const p of prompts) {
    if (!grouped.has(p.subtask)) {
      grouped.set(p.subtask, []);
      subtaskOrder.push(p.subtask);
    }
    grouped.get(p.subtask)!.push(p);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-[18px] py-[15px]"
        style={{ background: "none", border: "none" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--body)" }}>
          Prompt log
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {isLoading ? (
            <p className="px-[18px] py-4 text-sm" style={{ color: "var(--muted)" }}>
              Loading…
            </p>
          ) : prompts.length === 0 ? (
            <p className="px-[18px] py-4 text-sm" style={{ color: "var(--muted)" }}>
              No prompts recorded yet.
            </p>
          ) : (
            subtaskOrder.map((subtaskName, si) => (
              <Fragment key={subtaskName}>
                <div
                  className="mono px-[18px] py-[9px] text-[11px]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    color: "#7a726b",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {String(si + 1).padStart(2, "0")} · {subtaskName}
                </div>
                {grouped.get(subtaskName)!.map((p) => {
                  const isReprompt = p.note === "reprompt";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 px-[18px] py-2.5"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: isReprompt
                          ? "rgba(245,184,61,0.06)"
                          : p.chosen
                            ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                            : "transparent",
                      }}
                    >
                      <span
                        className="w-[18px] shrink-0 text-xs"
                        style={{ color: "color-mix(in srgb, var(--accent) 60%, white 40%)" }}
                      >
                        {isReprompt ? "↺" : ""}
                      </span>
                      <span
                        className="mono flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px]"
                        style={{ color: "#948b83" }}
                      >
                        {p.candidate}
                      </span>
                      <span
                        className="mono w-11 shrink-0 text-right text-[11.5px]"
                        style={{ color: "var(--muted)" }}
                      >
                        {p.score !== null && p.score !== undefined
                          ? Number(p.score).toFixed(2)
                          : "—"}
                      </span>
                      <span
                        className="w-[26px] shrink-0 text-center text-xs"
                        style={{ color: "#7dd88f" }}
                      >
                        {p.chosen ? "✓" : ""}
                      </span>
                    </div>
                  );
                })}
              </Fragment>
            ))
          )}
        </div>
      )}
    </div>
  );
}
