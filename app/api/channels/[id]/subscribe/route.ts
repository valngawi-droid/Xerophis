import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const chan = sqlite.row<any>("SELECT id FROM channels WHERE id = ?", id);
  if (!chan) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Channel tidak ditemukan." } }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const subscribe = body.action !== "unsubscribe";
  if (subscribe) {
    sqlite.run("INSERT OR IGNORE INTO channel_subscribers (id, channelId, userId, subscribedAt) VALUES (?,?,?,?)", newId("cs"), id, user.id, nowMs());
    sqlite.run("INSERT OR IGNORE INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'member',?)", newId("cm"), id, user.id, nowMs());
  } else {
    sqlite.run("DELETE FROM channel_subscribers WHERE channelId = ? AND userId = ?", id, user.id);
    sqlite.run("DELETE FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  }
  const count = sqlite.row<{ c: number }>("SELECT COUNT(*) AS c FROM channel_subscribers WHERE channelId = ?", id)?.c ?? 0;
  sqlite.run("UPDATE channels SET subscriberCount = ? WHERE id = ?", count, id);
  return NextResponse.json({ ok: true, subscribed: subscribe, subscriberCount: count });
}
