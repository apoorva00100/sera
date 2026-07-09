import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { signIn, signUp } from "../lib/auth";
import { client } from "../lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode: "signin" | "signup" } => ({
    mode: search.mode === "signup" ? "signup" : "signin",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await client.api.config.$get();
      return res.json();
    },
  });
  const socialProviders =
    configQuery.data && "socialProviders" in configQuery.data
      ? configQuery.data.socialProviders
      : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result =
        mode === "signup"
          ? await signUp.email({ name: name || email, email, password })
          : await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
        return;
      }
      navigate({ to: "/app" });
    } catch (err) {
      setError(String(err));
    } finally {
      setPending(false);
    }
  }

  async function handleSocial(provider: "google" | "github") {
    setError(null);
    await signIn.social({ provider, callbackURL: "http://localhost:5173/app" });
  }

  const isSignup = mode === "signup";

  return (
    <main className="ape-fade mx-auto max-w-[400px] px-6 pb-24 pt-[70px]">
      <div className="mb-[30px] text-center">
        <h1
          className="m-0 text-[30px] font-extrabold"
          style={{ color: "var(--heading)", letterSpacing: "-0.02em" }}
        >
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2.5 text-[14.5px]" style={{ color: "var(--muted-2)" }}>
          {isSignup
            ? "Sign up to save your task history."
            : "Sign in to see your task history."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[11px]">
        {isSignup && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="ape-input"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="ape-input"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="ape-input"
        />

        {error && (
          <p className="text-sm" style={{ color: "#f0685f" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="ape-btn mt-1 py-[13px] text-sm">
          {pending ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-[11.5px]" style={{ color: "var(--muted)" }}>
          or
        </span>
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      <div className="flex flex-col gap-2.5">
        {(["google", "github"] as const).map((provider) => {
          const configured = socialProviders.includes(provider);
          return (
            <button
              key={provider}
              onClick={() => configured && handleSocial(provider)}
              disabled={!configured}
              title={
                configured
                  ? undefined
                  : `Add ${provider.toUpperCase()}_CLIENT_ID / _SECRET in apps/api/.env to enable`
              }
              className="ape-btn-ghost w-full py-3 text-[13.5px] capitalize disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue with {provider}
              {!configured && (
                <span className="ml-1 text-xs font-normal" style={{ color: "var(--muted)" }}>
                  (needs setup)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[13.5px]" style={{ color: "var(--muted-2)" }}>
        {isSignup ? "Already have an account? " : "No account yet? "}
        <button
          onClick={() => {
            navigate({ to: "/login", search: { mode: isSignup ? "signin" : "signup" } });
            setError(null);
          }}
          className="cursor-pointer font-bold"
          style={{
            background: "none",
            border: "none",
            color: "color-mix(in srgb, var(--accent) 65%, white 35%)",
          }}
        >
          {isSignup ? "Sign in" : "Sign up"}
        </button>
      </p>

      <p className="mt-4 text-center">
        <Link to="/" className="text-xs" style={{ color: "var(--muted)" }}>
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
