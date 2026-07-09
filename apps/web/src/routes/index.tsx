import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ACCENT_GRAD =
  "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white 10%), color-mix(in srgb, var(--accent) 80%, black 18%))";

function ApeMark({ size = 30 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background:
          "linear-gradient(160deg, color-mix(in srgb, var(--accent) 92%, white 12%), color-mix(in srgb, var(--accent) 78%, black 22%))",
        boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent)",
      }}
    >
      <div
        className="bg-white"
        style={{ width: size * 0.37, height: size * 0.37, borderRadius: "3px", transform: "rotate(45deg)" }}
      />
    </div>
  );
}

const features = [
  {
    mono: "candidates.draft()",
    title: "Multi-candidate drafting",
    desc: "APE writes several prompt variants for every subtask, so you're never betting the run on one guess.",
    preview:
      "position:absolute; left:18px; right:18px; top:52px; height:90px; border-radius:10px; background:repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 8px, transparent 8px 16px); border:1px solid rgba(255,255,255,0.06);",
  },
  {
    mono: "score.rank()",
    title: "Auto-scoring",
    desc: "Each candidate is scored against your saved context. The highest-ranked prompt runs automatically.",
    preview:
      "position:absolute; left:18px; right:18px; top:60px; height:74px; border-radius:10px; background:linear-gradient(90deg, color-mix(in srgb, var(--accent) 30%, transparent) 0%, color-mix(in srgb, var(--accent) 30%, transparent) 62%, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0.04) 100%);",
  },
  {
    mono: "gate.await()",
    title: "Human gates",
    desc: "When a decision really matters, APE pauses to ask — then remembers your answer as a preference.",
    preview:
      "position:absolute; left:18px; right:18px; top:56px; height:82px; border-radius:10px; border:1px dashed color-mix(in srgb, var(--accent) 45%, transparent); background:color-mix(in srgb, var(--accent) 8%, transparent);",
  },
];

const steps = [
  { n: "01", title: "Describe the task", desc: "Write what you want in plain language. APE splits it into scored subtasks." },
  { n: "02", title: "Draft & score", desc: "Multiple candidates per subtask, ranked against your context and preferences." },
  { n: "03", title: "Gate the calls", desc: "Only real decisions surface to you — everything else runs on the winner." },
  { n: "04", title: "Learn & repeat", desc: "Your gate answers become preferences that sharpen the next run." },
];

const setupSteps = [
  { n: "01", title: "Point your agent at APE", desc: "— drop one MCP block into Claude, Cursor, or Codex. No wrappers." },
  { n: "02", title: "Describe as usual.", desc: "APE drafts, scores, and runs candidates behind the scenes." },
  { n: "03", title: "Answer the gates.", desc: "Your choices persist as preferences across every session." },
];

const tabDefs = [
  { key: "claude", label: "Claude", file: "~/.claude.json" },
  { key: "cursor", label: "Cursor", file: "~/.cursor/mcp.json" },
  { key: "codex", label: "Codex", file: "~/.codex/config.toml" },
];

function FloatCard({
  glyph,
  name,
  meta,
  dot,
  style,
  delay,
}: {
  glyph: string;
  name: string;
  meta: string;
  dot: string;
  style: React.CSSProperties;
  delay: string;
}) {
  return (
    <div
      className="absolute flex items-center gap-3 py-3 pl-3.5 pr-[18px]"
      style={{
        background: "rgba(18,13,11,0.92)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "15px",
        boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
        animation: `ape-float 5s ease-in-out ${delay} infinite`,
        ...style,
      }}
    >
      <div
        className="grid h-[34px] w-[34px] place-items-center"
        style={{ borderRadius: "10px", background: "#1e1712", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span
          className="text-[15px] font-extrabold"
          style={{ color: "color-mix(in srgb, var(--accent) 70%, white 30%)" }}
        >
          {glyph}
        </span>
      </div>
      <div className="text-left">
        <div className="text-[14px] font-bold" style={{ color: "var(--heading)" }}>
          {name}
        </div>
        <div className="mono text-[10.5px]" style={{ color: "var(--muted)" }}>
          {meta}
        </div>
      </div>
      <span
        className="ml-1 h-2 w-2 rounded-full"
        style={{ background: dot, boxShadow: `0 0 8px ${dot}` }}
      />
    </div>
  );
}

function Landing() {
  const [tab, setTab] = useState("claude");
  const codeFile = (tabDefs.find((t) => t.key === tab) || tabDefs[0]).file;

  return (
    <div className="relative z-[2]">
      {/* NAV */}
      <nav className="sticky top-[18px] z-40 flex justify-center px-5 pt-[18px]">
        <div
          className="flex w-full max-w-[1040px] items-center justify-between py-2.5 pl-[18px] pr-3"
          style={{
            background: "rgba(20,15,13,0.82)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <ApeMark />
            <span className="text-[16px] font-extrabold" style={{ color: "var(--heading)", letterSpacing: "-0.01em" }}>
              APE
            </span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <a href="#features" className="ape-navlink">
              Features
            </a>
            <a href="#how" className="ape-navlink">
              How it works
            </a>
            <a href="#setup" className="ape-navlink">
              Setup
            </a>
          </div>
          <Link to="/app" className="ape-btn px-[18px] py-[9px] text-[13.5px] font-bold">
            Launch App
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-[900px] px-6 pb-5 pt-[66px] text-center">
        <div
          className="inline-flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-4 text-[12.5px] font-semibold"
          style={{ background: "rgba(20,15,13,0.7)", border: "1px solid var(--border)", color: "#C9C1BA" }}
        >
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: "var(--accent)", boxShadow: "0 0 9px var(--accent)", animation: "ape-pulse 2.4s ease infinite" }}
          />
          Multi-candidate prompt runtime
        </div>
        <h1
          className="mt-6 font-extrabold"
          style={{ color: "var(--heading)", fontSize: "68px", lineHeight: 0.98, letterSpacing: "-0.035em" }}
        >
          The best prompt.
          <br />
          <span style={{ color: "#524b45" }}>Every single run.</span>
        </h1>
        <p className="mx-auto mt-[22px] max-w-[540px] text-[18px]" style={{ color: "var(--muted-2)", lineHeight: 1.55 }}>
          APE drafts several prompt candidates per task, scores them against your context, and runs the winner — gating
          with you only when it matters.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="#setup" className="ape-btn-ghost px-6 py-[13px] text-[15px] font-bold" style={{ color: "var(--body)" }}>
            Read the docs
          </a>
          <Link to="/app" className="ape-btn inline-flex items-center gap-2 px-[26px] py-[13px] text-[15px]">
            Get started →
          </Link>
        </div>

        {/* Hero visual */}
        <div className="relative mt-12" style={{ height: "380px" }}>
          <svg viewBox="0 0 900 380" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
            <g
              stroke="color-mix(in srgb, var(--accent) 55%, transparent)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="5 6"
              style={{ animation: "ape-dash 1.6s linear infinite" }}
            >
              <path d="M225 118 L225 190 L440 190" />
              <path d="M690 118 L690 200 L460 200" />
              <path d="M450 300 L450 235" />
            </g>
          </svg>
          <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%,-50%)" }}>
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: "130px",
                height: "130px",
                borderRadius: "30px",
                border: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)",
                animation: "ape-ring 2.6s ease-out infinite",
              }}
            />
            <div
              className="grid place-items-center"
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "26px",
                background:
                  "linear-gradient(160deg, color-mix(in srgb, var(--accent) 95%, white 14%), color-mix(in srgb, var(--accent) 72%, black 26%))",
                boxShadow: "0 0 60px color-mix(in srgb, var(--accent) 55%, transparent), inset 0 2px 6px rgba(255,255,255,0.25)",
              }}
            >
              <div
                className="bg-white"
                style={{ width: "34px", height: "34px", borderRadius: "9px", transform: "rotate(45deg)", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}
              />
            </div>
          </div>

          <FloatCard glyph="C" name="Claude" meta="auth-flow · scored 9.1" dot="#5fd68a" delay="0s" style={{ left: "6%", top: "22%" }} />
          <FloatCard glyph="▣" name="Cursor" meta="gate · awaiting" dot="#f5b83d" delay="0.8s" style={{ right: "4%", top: "20%" }} />
          <FloatCard glyph="◇" name="Codex" meta="tests · running" dot="var(--accent)" delay="1.6s" style={{ left: "50%", bottom: "6%", transform: "translateX(-50%)" }} />
        </div>
        <p className="mt-2 text-[14px]" style={{ color: "var(--muted)" }}>
          Works with Claude, Cursor, Codex, and any MCP-compatible agent.
        </p>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-[1040px] px-6 pb-[30px] pt-[70px]">
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {features.map((f) => (
            <div key={f.title} className="flex flex-col">
              <div
                className="relative overflow-hidden p-[18px]"
                style={{
                  height: "168px",
                  background: "#12100e",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px 16px 0 0",
                  borderBottom: "none",
                }}
              >
                <div className="mono text-[11px]" style={{ color: "var(--muted)" }}>
                  {f.mono}
                </div>
                <div style={cssText(f.preview)} />
              </div>
              <div
                className="relative overflow-hidden p-[22px] text-white"
                style={{
                  borderRadius: "0 0 16px 16px",
                  background:
                    "linear-gradient(165deg, color-mix(in srgb, var(--accent) 88%, white 6%), color-mix(in srgb, var(--accent) 70%, black 22%))",
                  boxShadow: "0 20px 50px color-mix(in srgb, var(--accent) 22%, transparent)",
                }}
              >
                <h3 className="m-0 mb-2 text-[19px] font-extrabold" style={{ letterSpacing: "-0.01em" }}>
                  {f.title}
                </h3>
                <p className="m-0 text-[13.5px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-[1040px] px-6 pb-[30px] pt-[70px]">
        <div className="mb-[52px] text-center">
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
            style={{ background: "rgba(20,15,13,0.7)", border: "1px solid var(--border)", color: "#C9C1BA" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Pipeline
          </div>
          <h2 className="mt-[18px] text-[44px] font-extrabold" style={{ color: "var(--heading)", letterSpacing: "-0.03em" }}>
            From task to shipped prompt
          </h2>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          {steps.map((st) => (
            <div key={st.n} className="ape-card p-[22px]" style={{ background: "#14100e" }}>
              <div
                className="mono mb-4 inline-grid h-[34px] w-[34px] place-items-center text-[13px] font-semibold text-white"
                style={{ borderRadius: "10px", background: ACCENT_GRAD, boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)" }}
              >
                {st.n}
              </div>
              <h3 className="m-0 mb-[7px] text-[16px] font-bold" style={{ color: "var(--heading)" }}>
                {st.title}
              </h3>
              <p className="m-0 text-[13.5px] leading-[1.55]" style={{ color: "var(--muted-2)" }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SETUP */}
      <section id="setup" className="mx-auto max-w-[1040px] px-6 pb-[30px] pt-[70px]">
        <div className="mb-[46px] text-center">
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
            style={{ background: "rgba(20,15,13,0.7)", border: "1px solid var(--border)", color: "#C9C1BA" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Setup
          </div>
          <h2 className="mb-2.5 mt-[18px] text-[48px] font-extrabold" style={{ color: "var(--heading)", letterSpacing: "-0.03em" }}>
            Wired in under two minutes.
          </h2>
          <p className="m-0 text-[16px]" style={{ color: "var(--muted-2)" }}>
            One config file. Point your agent at APE and every task runs through the pipeline.
          </p>
        </div>
        <div className="grid items-start gap-10" style={{ gridTemplateColumns: "0.85fr 1.15fr" }}>
          <div className="flex flex-col gap-6 pt-2">
            {setupSteps.map((st) => (
              <div key={st.n} className="flex gap-3.5">
                <span
                  className="mono grid h-[30px] w-[30px] shrink-0 place-items-center text-[11.5px] font-semibold"
                  style={{
                    borderRadius: "9px",
                    color: "color-mix(in srgb, var(--accent) 60%, white 40%)",
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                  }}
                >
                  {st.n}
                </span>
                <p className="mt-[3px] m-0 text-[14.5px] leading-[1.5]" style={{ color: "var(--muted-2)" }}>
                  <span className="font-bold" style={{ color: "var(--heading)" }}>
                    {st.title}
                  </span>{" "}
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "rgba(14,10,9,0.9)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="flex gap-1 p-2.5"
              style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {tabDefs.map((t) => {
                const active = t.key === tab;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="cursor-pointer rounded-[9px] px-4 py-2 text-[13px] font-semibold"
                    style={{
                      border: active ? "1px solid rgba(255,255,255,0.08)" : "none",
                      background: active ? "rgba(255,255,255,0.05)" : "transparent",
                      color: active ? "var(--heading)" : "#7a726b",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-center justify-between px-[18px] py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span className="mono text-[12px]" style={{ color: "var(--muted)" }}>
                {codeFile}
              </span>
              <span className="text-[11.5px] font-semibold" style={{ color: "#7a726b" }}>
                ⎘ Copy
              </span>
            </div>
            <div className="px-[22px] py-[18px]" style={{ minHeight: "240px" }}>
              <pre className="mono m-0 text-[13px] leading-[1.75]" style={{ color: "var(--muted-2)" }}>
{`{
  "mcpServers": {
    "ape": {
      "command": "ape",
      "args": ["mcp"],
      "env": { "APE_API_KEY": "sk_ape_••••" }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1040px] px-6 pb-10 pt-[60px]">
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(120deg, #16110f, #0e0a08)",
            padding: "54px 48px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(60% 120% at 12% 20%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%)" }}
          />
          <div className="relative" style={{ maxWidth: "560px" }}>
            <div className="mb-[22px]">
              <ApeMark size={44} />
            </div>
            <h2 className="m-0 text-[42px] font-extrabold" style={{ color: "var(--heading)", letterSpacing: "-0.03em" }}>
              Stop guessing at prompts.
            </h2>
            <p className="mb-[26px] mt-3 text-[16.5px]" style={{ color: "var(--muted-2)" }}>
              Describe the task once. APE drafts, scores, and ships the winner.
            </p>
            <div className="flex gap-3">
              <a href="#" className="ape-btn-ghost inline-flex gap-2 px-[22px] py-3 text-[14.5px] font-bold" style={{ color: "var(--body)" }}>
                ★ Star on GitHub
              </a>
              <Link to="/app" className="ape-btn inline-flex items-center gap-2 px-6 py-3 text-[14.5px]">
                Get started →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-[1040px] px-6 pb-[70px] pt-10">
        <div
          className="grid gap-[30px] pt-10"
          style={{ borderTop: "1px solid var(--border)", gridTemplateColumns: "1.6fr 1fr 1fr" }}
        >
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              <ApeMark size={28} />
              <span className="text-[15px] font-extrabold" style={{ color: "var(--heading)" }}>
                APE
              </span>
            </div>
            <p className="m-0 max-w-[300px] text-[13.5px] leading-[1.55]" style={{ color: "var(--muted)" }}>
              Multi-candidate prompt runtime for AI coding agents. Describe the task, ship the winner.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how" },
              { label: "Setup", href: "#setup" },
            ]}
          />
          <div>
            <div className="mb-3.5 text-[13px] font-bold" style={{ color: "var(--heading)" }}>
              Connect
            </div>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-[13.5px]" style={{ color: "var(--muted-2)" }}>
                Twitter
              </a>
              <a href="#" className="text-[13.5px]" style={{ color: "var(--muted-2)" }}>
                GitHub
              </a>
              <Link to="/app" className="text-[13.5px]" style={{ color: "var(--muted-2)" }}>
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="mb-3.5 text-[13px] font-bold" style={{ color: "var(--heading)" }}>
        {title}
      </div>
      <div className="flex flex-col gap-2.5">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="text-[13.5px]" style={{ color: "var(--muted-2)" }}>
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// Parse the mockup's inline "prop: value; ..." preview strings into a style object.
function cssText(text: string): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const decl of text.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = decl.slice(idx + 1).trim();
    if (prop && val) style[prop] = val;
  }
  return style as React.CSSProperties;
}
