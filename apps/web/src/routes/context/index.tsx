import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../lib/api";

export const Route = createFileRoute("/context/")({
  component: ContextPage,
});

function confidenceColor(c: number): string {
  if (c >= 0.7) return "bg-green-500";
  if (c >= 0.4) return "bg-blue-400";
  return "bg-amber-400";
}

function ContextPage() {
  const queryClient = useQueryClient();

  const contextQuery = useQuery({
    queryKey: ["context"],
    queryFn: async () => {
      const res = await client.api.context.$get();
      return res.json();
    },
  });

  const prefsQuery = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await client.api.context.preferences.$get();
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await client.api.context.preferences[":key"].$delete({
        param: { key },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });

  async function handleOpenEditor() {
    await fetch("http://localhost:3001/api/context/open-editor");
  }

  const prefs =
    prefsQuery.data && Array.isArray(prefsQuery.data) ? prefsQuery.data : [];
  const contextText =
    contextQuery.data && "context" in contextQuery.data
      ? contextQuery.data.context
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-900">
            ← Back
          </Link>
          <span className="text-gray-200">|</span>
          <h1 className="text-sm font-semibold text-gray-800">Context</h1>
        </div>
        <button
          onClick={handleOpenEditor}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit profile.md
        </button>
      </div>

      {/* Preferences table */}
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Preferences
        </h2>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {prefsQuery.isLoading ? (
            <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          ) : prefs.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">
              No preferences saved yet. They'll appear here after you respond to
              gate decisions during a session.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2.5 font-medium">Key</th>
                  <th className="px-4 py-2.5 font-medium">Value</th>
                  <th className="px-4 py-2.5 font-medium">Confidence</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prefs.map((p) => (
                  <tr key={p.key} className="group">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {p.key}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{p.value}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all ${confidenceColor(p.confidence)}`}
                            style={{ width: `${p.confidence * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-gray-400">
                          {(p.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(p.key)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Context string */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Merged Context
        </h2>
        <div className="rounded-xl border border-gray-200 bg-gray-50">
          {contextQuery.isLoading ? (
            <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          ) : (
            <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
              {contextText ?? "No context available."}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
