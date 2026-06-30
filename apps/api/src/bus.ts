import type { SessionEvent } from "@ape/types";

// In-process pub/sub for session events.
// POST fires runLoop in background, SSE stream subscribes here.
// Single-waiter design is fine for a single-user local tool.

interface Channel {
  buffer: SessionEvent[];
  notify: (() => void) | null; // one waiter at a time
  closed: boolean;
}

const channels = new Map<string, Channel>();

function ensure(sessionId: string): Channel {
  let ch = channels.get(sessionId);
  if (!ch) {
    ch = { buffer: [], notify: null, closed: false };
    channels.set(sessionId, ch);
  }
  return ch;
}

export function push(sessionId: string, event: SessionEvent): void {
  const ch = ensure(sessionId);
  ch.buffer.push(event);
  const fn = ch.notify;
  ch.notify = null;
  fn?.();
}

export function close(sessionId: string): void {
  const ch = channels.get(sessionId);
  if (!ch) return;
  ch.closed = true;
  const fn = ch.notify;
  ch.notify = null;
  fn?.();
  // Clean up after a grace period so reconnecting clients can replay the buffer
  setTimeout(() => channels.delete(sessionId), 120_000);
}

// Returns the event at `index`, waiting for it to arrive if not yet buffered.
// Returns null when the channel is closed and no event at that index exists.
export async function nextEvent(
  sessionId: string,
  index: number
): Promise<SessionEvent | null> {
  const ch = ensure(sessionId);

  while (index >= ch.buffer.length) {
    if (ch.closed) return null;
    await new Promise<void>((resolve) => {
      ch.notify = resolve;
    });
  }

  return ch.buffer[index];
}

export function getBuffer(sessionId: string): SessionEvent[] {
  return channels.get(sessionId)?.buffer ?? [];
}
