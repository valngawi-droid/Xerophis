import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const now = nowMs();
  const statuses = sqlite.rows<any>(
    `SELECT s.*, u.displayName, u.avatarUrl FROM statuses s JOIN users u ON u.id = s.userId WHERE s.expiresAt > ? ORDER BY s.createdAt DESC`,
    now
  ).map((s) => ({
    id: s.id,
    userId: s.userId,
    name: s.displayName,
    avatar: s.avatarUrl ?? s.displayName.slice(0, 1).toUpperCase(),
    avatarColor: s.avatarUrl ?? "#FF1111",
    content: s.content,
    kind: s.kind,
    mediaUrl: s.mediaUrl,
    createdAt: s.createdAt,
    mine: s.userId === user.id,
    viewers: sqlite.row<{ c: number }>("SELECT COUNT(*) AS c FROM status_viewers WHERE statusId = ?", s.id)?.c ?? 0,
  }));
  return NextResponse.json({ statuses });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").slice(0, 500);
  if (!content.trim() && !body.mediaUrl) return NextResponse.json({ error: { code: "VALIDATION", message: "Status tidak boleh kosong." } }, { status: 422 });
  const id = newId("st");
  const now = nowMs();
  const expires = now + 24 * 60 * 60 * 1000; // 24h by default
  sqlite.run("INSERT INTO statuses (id, userId, content, mediaUrl, kind, expiresAt, createdAt) VALUES (?,?,?,?,?,?,?)", id, user.id, content.trim(), body.mediaUrl ? String(body.mediaUrl) : null, body.mediaUrl ? "media" : "text", expires, now);
  return NextResponse.json({ status: { id, content: content.trim() } }, { status: 201 });
}
