import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscribe, emit } from "@/lib/realtime";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * SSE realtime stream. This is the reliable realtime channel used by the demo.
 * The server pushes message:new, typing, presence, notification, etc. to all
 * connected clients. A WebSocket server (`server/realtime-ws.ts`) is included
 * for production and emits through the same hub.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });

  // mark online
  sqlite.run("UPDATE users SET isOnline = 1, lastSeen = ? WHERE id = ?", nowMs(), user.id);
  emit("presence:update", { userId: user.id, online: true });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 25000);
      const unsubscribe = subscribe((e) => {
        try {
          const payload = e.data && typeof e.data === "object" ? (e.data as Record<string, unknown>) : {};
          controller.enqueue(encoder.encode(`event: ${e.type}\ndata: ${JSON.stringify({ ...payload, _userId: user.id })}\n\n`));
        } catch {
          /* closed */
        }
      });
      // initial hello so client knows it's connected
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ userId: user.id })}\n\n`));
      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        unsubscribe();
        sqlite.run("UPDATE users SET isOnline = 0 WHERE id = ?", user.id);
        emit("presence:update", { userId: user.id, online: false });
      });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Client -> server realtime events (typing etc.) are just fan-out into the hub. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = String(body.type ?? "");
  if (!type) return NextResponse.json({ error: { code: "VALIDATION", message: "type wajib." } }, { status: 422 });
  emit(type, { ...body.data, userId: user.id });
  return NextResponse.json({ ok: true });
}
