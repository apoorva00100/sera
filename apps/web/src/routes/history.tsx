import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { client } from "../lib/api";
import { useSession } from "../lib/auth";
import { STATUS_DOT, formatRelativeTime } from "../lib/sessions";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { data: authData, isPending: authPending } = useSession();
  const isAuthed = !!authData?.user;

  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await client.api.sessions.history.$get();
      return res.json();
    },
    enabled: isAuthed,
  });

  const sessions = Array.isArray(historyQuery.data) ? historyQuery.data : [];

  return (
    <main className="ape-fade mx-auto max-w-[760px] px-6 pb-24 pt-[46px]">
      <div className="mb-[30px] flex items-center gap-3">
        <Link to="/app" className="text-[13px] font-semibold" style={{ color: "#7a726b" }}>
          ← Back
        </Link>
        <span style={{ color: "#3a332e" }}>/</span>
        <h1 className="m-0 text-[15px] font-bold" style={{ color: "var(--heading)" }}>
          History
        </h1>
      </div>

      {authPending ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Loading…
        </p>
      ) : !isAuthed ? (
        <div
          className="py-16 text-center"
          style={{ border: "1px dashed var(--border)", borderRadius: "16px" }}
        >
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>
            Sign in to view your task history.
          </p>
          <Link to="/login" search={{ mode: "signin" }} className="ape-btn mt-3 inline-block px-4 py-2 text-sm">
            Sign in
          </Link>
        </div>
      ) : historyQuery.isLoading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Loading…
        </p>
      ) : sessions.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No tasks yet. Tasks you run while signed in will appear here.
        </p>
      ) : (
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
      )}
    </main>
  );
}
