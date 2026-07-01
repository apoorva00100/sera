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
    <div className="rounded-xl border border-gray-200">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Prompt Log</span>
        <span className="text-xs text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200">
          {isLoading ? (
            <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          ) : prompts.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">No prompts recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="w-6 px-3 py-2" />
                    <th className="px-4 py-2 font-medium">Candidate (truncated)</th>
                    <th className="px-4 py-2 font-medium">Score</th>
                    <th className="px-4 py-2 font-medium">Chosen</th>
                    <th className="px-4 py-2 font-medium">Output (truncated)</th>
                    <th className="px-4 py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subtaskOrder.map((subtaskName, si) => {
                    const rows = grouped.get(subtaskName)!;
                    return (
                      <Fragment key={subtaskName}>
                        {/* Subtask group header */}
                        <tr className="bg-gray-50/80">
                          <td
                            colSpan={6}
                            className="px-4 py-1.5 text-xs font-medium text-gray-500"
                          >
                            {si + 1}. {subtaskName}
                          </td>
                        </tr>

                        {/* Candidate rows */}
                        {rows.map((p) => {
                          const isReprompt = p.note === "reprompt";
                          return (
                            <tr
                              key={p.id}
                              className={
                                isReprompt
                                  ? "bg-amber-50"
                                  : p.chosen
                                    ? "bg-green-50"
                                    : ""
                              }
                            >
                              {/* Indent indicator */}
                              <td className="px-3 py-2 text-center text-amber-500">
                                {isReprompt ? "↺" : ""}
                              </td>
                              <td className="max-w-[12rem] px-4 py-2">
                                <span className="line-clamp-2 font-mono text-gray-700">
                                  {p.candidate}
                                </span>
                              </td>
                              <td className="px-4 py-2 tabular-nums text-gray-600">
                                {p.score !== null && p.score !== undefined
                                  ? Number(p.score).toFixed(2)
                                  : "—"}
                              </td>
                              <td className="px-4 py-2 text-center text-green-600">
                                {p.chosen ? "✓" : ""}
                              </td>
                              <td className="max-w-[16rem] px-4 py-2">
                                <span className="line-clamp-2 font-mono text-gray-700">
                                  {p.output ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {isReprompt && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    ↺ reprompt
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
