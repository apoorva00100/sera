import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../lib/api";

export const Route = createFileRoute("/context/")({
  component: ContextPage,
});

function confidenceColor(c: number): string {
  if (c >= 0.7) return "#5fd68a";
  if (c >= 0.4) return "#5aa2f0";
  return "#f5b83d";
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

  const gridCols = "1.1fr 1.3fr 1.4fr 40px";

  return (
    <main className="ape-fade mx-auto max-w-[760px] px-6 pb-24 pt-[46px]">
      <div className="mb-[30px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app" className="text-[13px] font-semibold" style={{ color: "#7a726b" }}>
            ← Back
          </Link>
          <span style={{ color: "#3a332e" }}>/</span>
          <h1 className="m-0 text-[15px] font-bold" style={{ color: "var(--heading)" }}>
            Context
          </h1>
        </div>
        <button onClick={handleOpenEditor} className="ape-btn-ghost px-3.5 py-2 text-[12.5px]">
          Edit profile.md
        </button>
      </div>

      {/* Learned preferences */}
      <h2 className="ape-section-label mb-3.5">Learned preferences</h2>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div
          className="grid gap-3 px-[18px] py-3 text-[11px] font-bold uppercase tracking-[0.08em]"
          style={{
            gridTemplateColumns: gridCols,
            background: "rgba(255,255,255,0.02)",
            color: "var(--muted)",
          }}
        >
          <span>Key</span>
          <span>Value</span>
          <span>Confidence</span>
          <span />
        </div>

        {prefsQuery.isLoading ? (
          <p className="px-[18px] py-4 text-sm" style={{ color: "var(--muted)" }}>
            Loading…
          </p>
        ) : prefs.length === 0 ? (
          <p className="px-[18px] py-4 text-sm" style={{ color: "var(--muted)" }}>
            No preferences saved yet. They'll appear here after you respond to gate
            decisions during a session.
          </p>
        ) : (
          prefs.map((p) => (
            <div
              key={p.key}
              className="group grid items-center gap-3 px-[18px] py-3.5"
              style={{ gridTemplateColumns: gridCols, borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="mono text-[12px]" style={{ color: "#948b83" }}>
                {p.key}
              </span>
              <span className="text-[13.5px] font-medium" style={{ color: "var(--body)" }}>
                {p.value}
              </span>
              <div className="flex items-center gap-2.5">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.confidence * 100}%`, background: confidenceColor(p.confidence) }}
                  />
                </div>
                <span className="mono w-[34px] text-right text-[11.5px]" style={{ color: "var(--muted)" }}>
                  {(p.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <button
                onClick={() => deleteMutation.mutate(p.key)}
                disabled={deleteMutation.isPending}
                className="cursor-pointer text-xs opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                style={{ background: "none", border: "none", color: "#7a726b" }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Merged context */}
      <h2 className="ape-section-label mb-3.5 mt-[34px]">Merged context</h2>
      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "20px 22px",
        }}
      >
        {contextQuery.isLoading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Loading…
          </p>
        ) : (
          <pre className="mono m-0 overflow-x-auto whitespace-pre-wrap text-[12.5px] leading-[1.7]" style={{ color: "#948b83" }}>
            {contextText ?? "No context available."}
          </pre>
        )}
      </div>
    </main>
  );
}
