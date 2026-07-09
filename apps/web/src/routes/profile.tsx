import { useState, useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSession, authClient } from "../lib/auth";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) setName(session.user.name ?? "");
  }, [session?.user?.name]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const res = await authClient.updateUser({ name: name.trim() });
    setSaving(false);
    if (res.error) {
      setError(res.error.message ?? "Failed to update profile");
      return;
    }
    setSaved(true);
    router.invalidate();
  }

  const label = "mb-2 block text-[11px] font-bold uppercase tracking-[0.08em]";

  return (
    <main className="ape-fade mx-auto max-w-[440px] px-6 pb-24 pt-[46px]">
      <div className="mb-[30px] flex items-center gap-3">
        <Link to="/app" className="text-[13px] font-semibold" style={{ color: "#7a726b" }}>
          ← Back
        </Link>
        <span style={{ color: "#3a332e" }}>/</span>
        <h1 className="m-0 text-[15px] font-bold" style={{ color: "var(--heading)" }}>
          Profile
        </h1>
      </div>

      {isPending ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Loading…
        </p>
      ) : !session?.user ? (
        <div
          className="py-16 text-center"
          style={{ border: "1px dashed var(--border)", borderRadius: "16px" }}
        >
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>
            Sign in to edit your profile.
          </p>
          <Link to="/login" search={{ mode: "signin" }} className="ape-btn mt-3 inline-block px-4 py-2 text-sm">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-[18px]">
          <div>
            <label className={label} style={{ color: "var(--muted)" }}>
              Email
            </label>
            <input type="email" value={session.user.email} disabled className="ape-input" />
          </div>
          <div>
            <label className={label} style={{ color: "var(--muted)" }}>
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              placeholder="Your name"
              className="ape-input"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#f0685f" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="ape-btn self-start px-6 py-3 text-sm"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </form>
      )}
    </main>
  );
}
