import {
  createRootRoute,
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useSession, signOut } from "../lib/auth";

export const Route = createRootRoute({
  component: RootLayout,
});

// The landing page ("/") ships its own nav + footer, so the app chrome is
// suppressed there.
function AppNav() {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.invalidate();
  }

  return (
    <nav className="sticky top-[18px] z-40 mt-[18px] flex justify-center px-5">
      <div
        className="flex w-full max-w-[1000px] items-center justify-between py-2.5 pl-[18px] pr-3"
        style={{
          background: "rgba(20,15,13,0.82)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center gap-[26px]">
          <Link to="/app" className="flex items-center gap-2.5">
            <ApeMark />
            <span
              className="font-extrabold"
              style={{ color: "var(--heading)", fontSize: "16px", letterSpacing: "-0.01em" }}
            >
              APE
            </span>
            <span
              className="pt-0.5 font-medium"
              style={{ color: "var(--muted)", fontSize: "12px", letterSpacing: "0.02em" }}
            >
              prompt engine
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/app" className="ape-navlink">
              Run
            </Link>
            <Link to="/history" className="ape-navlink">
              History
            </Link>
            <Link to="/context" className="ape-navlink">
              Context
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[13.5px]">
          {session?.user ? (
            <>
              <Link
                to="/profile"
                className="font-semibold"
                style={{ color: "var(--text)" }}
                title={session.user.email}
              >
                {session.user.name || session.user.email}
              </Link>
              <button
                onClick={handleSignOut}
                className="cursor-pointer font-semibold"
                style={{ color: "var(--muted)", background: "none", border: "none" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                search={{ mode: "signin" }}
                className="font-semibold"
                style={{ color: "var(--text)" }}
              >
                Sign in
              </Link>
              <Link
                to="/login"
                search={{ mode: "signup" }}
                className="ape-btn px-[18px] py-[9px] text-[13.5px] font-bold"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function ApeMark() {
  return (
    <div
      className="grid h-[30px] w-[30px] place-items-center"
      style={{
        borderRadius: "9px",
        background:
          "linear-gradient(160deg, color-mix(in srgb, var(--accent) 92%, white 12%), color-mix(in srgb, var(--accent) 78%, black 22%))",
        boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent)",
      }}
    >
      <div
        className="h-[11px] w-[11px] bg-white"
        style={{ borderRadius: "3px", transform: "rotate(45deg)" }}
      />
    </div>
  );
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%), radial-gradient(80% 60% at 85% 8%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%), radial-gradient(70% 60% at 12% 20%, rgba(120,50,30,0.14), transparent 55%)",
          opacity: 0.6,
        }}
      />
      {/* Dotted grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          opacity: 0.5,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-[2]">
        {!isLanding && <AppNav />}
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  );
}
