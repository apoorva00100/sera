// Shared presentation helpers for session lists (home "Recent" + History tab).

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-700",
  gating: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

// Glowing status-dot colors for the dark theme.
export const STATUS_DOT: Record<string, string> = {
  done: "#5fd68a",
  running: "#F62681",
  gating: "#f5b83d",
  failed: "#f0685f",
  pending: "#8b837c",
};

export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
