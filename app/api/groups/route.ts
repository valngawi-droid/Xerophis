import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { isTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const groups = sqlite.rows<any>(
    `SELECT c.*, (SELECT COUNT(*) FROM conversation_members WHERE conversationId=c.id) AS memberCount
       FROM conversations c
       JOIN conversation_members m ON m.conversationId=c.id
      WHERE c.type='group' AND m.userId=? ORDER BY c.updatedAt DESC`,
    user.id
  );
  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!isTitle(body.name)) return NextResponse.json({ error: { code: "VALIDATION", message: "Nama grup tidak valid." } }, { status: 422 });
  const id = newId("conv");
  const now = nowMs();
  sqlite.run("INSERT INTO conversations (id, type, title, description, avatar, ownerId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)", id, "group", body.name.trim(), String(body.description ?? "").slice(0, 500), body.avatar ?? "#FF1111", user.id, now, now);
  sqlite.run("INSERT INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'owner',?)", newId("cm"), id, user.id, now);
  for (const uid of (Array.isArray(body.memberIds) ? body.memberIds : []).filter((m: string) => m && m !== user.id).slice(0, 100)) {
    const target = sqlite.row<any>("SELECT id FROM users WHERE id = ?", uid);
    if (target) sqlite.run("INSERT OR IGNORE INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'member',?)", newId("cm"), id, uid, now);
  }
  return NextResponse.json({ group: { id, name: body.name.trim() } }, { status: 201 });
}
