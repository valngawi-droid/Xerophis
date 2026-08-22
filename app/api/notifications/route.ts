import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const notifications = sqlite.rows<any>(
    "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 60",
    user.id
  ).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: !!n.read,
    conversationId: n.conversationId,
    createdAt: n.createdAt,
  }));
  const unread = sqlite.row<{ c: number }>("SELECT COUNT(*) AS c FROM notifications WHERE userId = ? AND read = 0", user.id)?.c ?? 0;
  return NextResponse.json({ notifications, unread });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  sqlite.run("UPDATE notifications SET read = 1 WHERE userId = ?", user.id);
  return NextResponse.json({ ok: true });
}
