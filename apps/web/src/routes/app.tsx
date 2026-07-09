import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/api";
import { STATUS_DOT, formatRelativeTime } from "../lib/sessions";

export const Route = createFileRoute("/app")({
  component: RunPage,
});

function RunPage() {
  const [task, setTask] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await client.api.sessions.$get();
      return res.json();
    },
  });

  const runMutation = useMutation({
    mutationFn: async (taskText: string) => {
      const res = await client.api.sessions.$post({ json: { task: taskText } });
      const data = await res.json();
      if (!("sessionId" in data)) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate({ to: "/session/$sessionId", params: { sessionId: data.sessionId } });
    },
  });

  const sessions = Array.isArray(sessionsQuery.data) ? sessionsQuery.data : [];

  return (
    <main className="ape-fade mx-auto max-w-[760px] px-6 pb-24 pt-[70px]">
      {/* Badge */}
      <div className="flex justify-center">
        <div
          className="inline-flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-4 text-[12.5px] font-semibold"
          style={{
            background: "rgba(20,15,13,0.7)",
            border: "1px solid var(--border)",
            color: "#C9C1BA",
          }}
        >
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 9px var(--accent)",
              animation: "ape-pulse 2.4s ease infinite",
            }}
          />
          Multi-candidate prompt runtime
        </div>
      </div>

      {/* Heading */}
      <h1
        className="mt-6 text-center font-extrabold"
        style={{
          color: "var(--heading)",
          fontSize: "52px",
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
        }}
      >
        What should
        <br />
        we build?
      </h1>
      <p
        className="mx-auto mt-[18px] max-w-[460px] text-center"
        style={{ color: "var(--muted-2)", fontSize: "16.5px", lineHeight: 1.55 }}
      >
        Describe a task. APE drafts multiple prompt candidates, scores them, and
        runs the winner — gating with you when it matters.
      </p>

      {/* Composer */}
      <div
        className="mt-[38px] p-2"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={5}
          placeholder="e.g. Add OAuth login with Google and GitHub, wire up the session hook, and gate on token-rotation strategy..."
          className="mono w-full resize-y bg-transparent px-4 pb-2 pt-4 outline-none"
          style={{ border: "none", color: "var(--body)", fontSize: "15px", lineHeight: 1.6 }}
        />
        <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2">
          <div className="flex gap-[7px]">
            <span className="ape-pill-mono">3 candidates</span>
            <span className="ape-pill-mono">auto-score</span>
          </div>
          <button
            onClick={() => task.trim() && runMutation.mutate(task)}
            disabled={!task.trim() || runMutation.isPending}
            className="ape-btn inline-flex items-center gap-2 px-[22px] py-[11px] text-sm"
          >
            {runMutation.isPending ? "Starting…" : "Run →"}
          </button>
        </div>
      </div>

      {runMutation.isError && (
        <p className="mt-3 text-sm" style={{ color: "#f0685f" }}>
          {String(runMutation.error)}
        </p>
      )}

      {/* Recent sessions */}
      <div className="mt-[54px]">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="ape-section-label m-0">Recent sessions</h2>
          <Link
            to="/history"
            className="text-[12.5px] font-semibold"
            style={{ color: "#7a726b" }}
          >
            View all →
          </Link>
        </div>

        {sessionsQuery.isLoading && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Loading…
          </p>
        )}
        {sessionsQuery.isError && (
          <p className="text-sm" style={{ color: "#f0685f" }}>
            Failed to load sessions.
          </p>
        )}
        {!sessionsQuery.isLoading && sessions.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No sessions yet.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to="/session/$sessionId"
              params={{ sessionId: session.id }}
              className="ape-card-i flex items-center gap-3.5 px-4 py-[15px]"
            >
              <span
                className="h-[9px] w-[9px] shrink-0 rounded-full"
                style={{
                  background: STATUS_DOT[session.status] ?? "#8b837c",
                  boxShadow: `0 0 8px ${STATUS_DOT[session.status] ?? "#8b837c"}`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-semibold"
                  style={{ color: "var(--body)" }}
                >
                  {session.task}
                </div>
                <div className="mono mt-[3px] text-[11.5px]" style={{ color: "var(--muted)" }}>
                  {session.id.slice(0, 8)} · {session.status}
                </div>
              </div>
              <span className="shrink-0 text-xs" style={{ color: "var(--muted)" }}>
                {formatRelativeTime(session.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
