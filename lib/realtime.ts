/**
 * Xerophis realtime hub.
 *
 * A single in-process pub/sub used by both the Server-Sent Events (SSE) route
 * (guaranteed to work over plain HTTP, ideal for the sandbox/demo preview) and
 * the optional WebSocket server (see `server/realtime-ws.ts` for production).
 *
 * The hub lives on globalThis so it survives Next.js dev hot-reloads.
 */

export type RealtimeEvent = {
  type: string;
  data: unknown;
  ts: number;
};

type Listener = (e: RealtimeEvent) => void;

const g = globalThis as unknown as {
  __rtListeners?: Set<Listener>;
  __rtLast?: number;
};

if (!g.__rtListeners) g.__rtListeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  g.__rtListeners!.add(listener);
  return () => g.__rtListeners!.delete(listener);
}

export function emit(type: string, data: unknown) {
  const evt: RealtimeEvent = { type, data, ts: Date.now() };
  for (const l of g.__rtListeners!) {
    try {
      l(evt);
    } catch {
      /* ignore listener errors */
    }
  }
}

export function listenerCount(): number {
  return g.__rtListeners?.size ?? 0;
}
