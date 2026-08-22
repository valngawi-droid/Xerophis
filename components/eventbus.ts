"use client";

type Handler = (data: unknown, event: { type: string; ts: number }) => void;

const g = globalThis as unknown as { __eb?: Map<string, Set<Handler>> };
if (!g.__eb) g.__eb = new Map<string, Set<Handler>>();

export function onEvent(type: string, fn: Handler): () => void {
  let set = g.__eb!.get(type);
  if (!set) {
    set = new Set();
    g.__eb!.set(type, set);
  }
  set.add(fn);
  return () => set!.delete(fn);
}

export function dispatchEvent(type: string, data: unknown, ts: number) {
  const set = g.__eb!.get(type);
  if (set) for (const fn of set) fn(data, { type, ts });
  const all = g.__eb!.get("*");
  if (all) for (const fn of all) fn(data, { type, ts });
}
