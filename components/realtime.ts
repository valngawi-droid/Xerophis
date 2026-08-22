"use client";

import { useEffect, useRef } from "react";
import type { RealtimeEvent } from "@/lib/realtime";

/**
 * Client realtime hook.
 *
 * Uses Server-Sent Events relative to the current origin (reliable through the
 * sandbox preview proxy and over HTTP). In production a WebSocket server
 * (`server/realtime-ws.ts`) can be used; see README. The event shape is the
 * same, so swapping transport requires no UI changes.
 */
export function useRealtime(onEvent: (e: RealtimeEvent) => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let retry = 0;

    function connect() {
      if (closed) return;
      es = new EventSource("/api/realtime");
      es.onopen = () => {
        retry = 0;
      };
      es.onmessage = (ev) => {
        try {
          const e = JSON.parse(ev.data);
          cb.current?.({ type: "message", data: e, ts: Date.now() });
        } catch {
          /* ignore */
        }
      };
      // Events are sent with a named `event:` field, so add a catch-all by
      // listening to the generic handler through a custom listener list.
      const known = ["connected", "message:new", "message:update", "message:delete", "message:reaction", "message:read", "typing:start", "typing:stop", "presence:update", "conversation:update", "conversation:new", "notification:new", "channel:new"];
      for (const type of known) {
        es.addEventListener(type, (ev) => {
          try {
            const data = jsparse(ev.data);
            cb.current?.({ type, data, ts: Date.now() });
          } catch {
            /* ignore */
          }
        });
      }
      es.onerror = () => {
        es?.close();
        if (!closed) {
          retry = Math.min(8000, 1000 * 2 ** retry);
          setTimeout(connect, retry);
        }
      };
    }
    connect();
    return () => {
      closed = true;
      es?.close();
    };
  }, []);
}

function jsparse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Send a client->server realtime event (e.g. typing). */
export async function sendRealtime(type: string, data: unknown, debounceKey?: string) {
  const g = globalThis as any;
  if (!g.__rtSent) g.__rtSent = new Map<string, number>();
  const last = g.__rtSent.get(debounceKey ?? type) ?? 0;
  if (Date.now() - last < 1200) return; // debounce network churn
  g.__rtSent.set(debounceKey ?? type, Date.now());
  try {
    await fetch("/api/realtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
      credentials: "same-origin",
    });
  } catch {
    /* offline */
  }
}
