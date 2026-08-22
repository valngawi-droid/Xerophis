"use client";

import { useEffect, useRef } from "react";
import { onEvent } from "./eventbus";

/** Subscribe a React component to a realtime event type. */
export function useRealtimeEvent(type: string | string[], fn: (data: unknown, e: { type: string; ts: number }) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const types = Array.isArray(type) ? type : [type];
    const cleanups = types.map((t) =>
      onEvent(t, (data, e) => ref.current(data, e))
    );
    return () => cleanups.forEach((c) => c());
  }, [Array.isArray(type) ? type.join(",") : type]);
}
