import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/api";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-700",
  gating: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function HomePage() {
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">APE</h1>
        <Link to="/context" className="text-sm text-gray-500 hover:text-gray-900">
          Context
        </Link>
      </div>

      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="Describe what you want to build..."
        rows={6}
        className="w-full resize-y rounded-lg border border-gray-300 p-4 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none"
      />

      <button
        onClick={() => task.trim() && runMutation.mutate(task)}
        disabled={!task.trim() || runMutation.isPending}
        className="mt-4 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {runMutation.isPending ? "Starting..." : "Run"}
      </button>

      {runMutation.isError && (
        <p className="mt-2 text-sm text-red-600">{String(runMutation.error)}</p>
      )}

      <div className="mt-12">
        <h2 className="mb-3 text-sm font-medium text-gray-500">Recent sessions</h2>

        {sessionsQuery.isLoading && (
          <p className="text-sm text-gray-400">Loading...</p>
        )}

        {sessionsQuery.isError && (
          <p className="text-sm text-red-600">Failed to load sessions.</p>
        )}

        {sessionsQuery.data?.length === 0 && (
          <p className="text-sm text-gray-400">No sessions yet.</p>
        )}

        <ul className="divide-y divide-gray-100">
          {sessionsQuery.data?.map((session) => (
            <li key={session.id}>
              <Link
                to="/session/$sessionId"
                params={{ sessionId: session.id }}
                className="flex items-center gap-3 py-3 hover:bg-gray-50"
              >
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[session.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {session.status}
                </span>
                <span className="flex-1 truncate text-sm text-gray-800">
                  {session.task}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatRelativeTime(session.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
