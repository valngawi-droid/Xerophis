import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

function relativeTimeLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const days = Math.floor((now.getTime() - ts) / 86400000);
  const hm = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `Hari ini, ${hm}`;
  if (days === 1) return `Kemarin, ${hm}`;
  return `${d.toLocaleDateString("id-ID", { weekday: "long" })}, ${hm}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const calls = sqlite.rows<any>(
    `SELECT cl.*, u.displayName, u.avatarUrl
       FROM calls cl JOIN users u ON u.id = CASE WHEN cl.callerId = ? THEN cl.receiverId ELSE cl.callerId END
      WHERE cl.callerId = ? OR cl.receiverId = ?
      ORDER BY cl.startedAt DESC LIMIT 60`,
    user.id, user.id, user.id
  ).map((c) => ({
    id: c.id,
    name: c.displayName,
    avatar: c.avatarUrl ?? c.displayName.slice(0, 1).toUpperCase(),
    avatarColor: c.avatarUrl ?? "#FF1111",
    kind: c.callerId === user.id ? (c.status === "missed" ? "missed" : "outgoing") : (c.status === "missed" ? "missed" : "incoming"),
    type: c.type,
    time: relativeTimeLabel(c.startedAt),
    status: c.status,
  }));
  return NextResponse.json({ calls });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const receiverId = String(body.receiverId ?? "");
  const type = body.type === "video" ? "video" : "audio";
  const status = body.status === "missed" ? "missed" : (body.status === "incoming" ? "incoming" : "outgoing");
  if (!receiverId) return NextResponse.json({ error: { code: "VALIDATION", message: "receiverId wajib." } }, { status: 422 });
  const now = nowMs();
  const id = newId("cl");
  sqlite.run("INSERT INTO calls (id, callerId, receiverId, conversationId, type, status, startedAt, endedAt) VALUES (?,?,?,?,?,?,?,?)", id, user.id, receiverId, body.conversationId ?? null, type, status, now, now);
  return NextResponse.json({ call: { id, type, status } }, { status: 201 });
}
