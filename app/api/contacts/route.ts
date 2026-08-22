import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const contacts = sqlite.rows<any>(
    `SELECT c.nickname, c.favorite, c.blocked, u.id, u.displayName, u.username, u.avatarUrl, u.isOnline, u.isVerified
       FROM contacts c JOIN users u ON u.id = c.contactId
      WHERE c.userId = ? AND u.id != ? ORDER BY c.favorite DESC, u.displayName`,
    user.id, user.id
  ).map((c) => ({
    id: c.id,
    name: c.nickname || c.displayName,
    username: c.username,
    avatar: c.avatarUrl ?? c.displayName.slice(0, 1).toUpperCase(),
    online: !!c.isOnline,
    verified: !!c.isVerified,
    favorite: !!c.favorite,
    blocked: !!c.blocked,
  }));
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const targetId = String(body.userId ?? "");
  if (!targetId || targetId === user.id) return NextResponse.json({ error: { code: "VALIDATION", message: "userId tidak valid." } }, { status: 422 });
  const target = sqlite.row<any>("SELECT id FROM users WHERE id = ?", targetId);
  if (!target) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pengguna tidak ditemukan." } }, { status: 404 });
  sqlite.run("INSERT OR IGNORE INTO contacts (id, userId, contactId, nickname, favorite, blocked, createdAt) VALUES (?,?,?,?,?,?,?)", `c${user.id}${targetId}`, user.id, targetId, null, 0, 0, Date.now());
  // block/unblock via blocked_users too
  if (body.blocked !== undefined) {
    if (body.blocked) {
      sqlite.run("INSERT OR IGNORE INTO blocked_users (id, userId, blockedId, createdAt) VALUES (?,?,?,?)", `b${user.id}${targetId}`, user.id, targetId, Date.now());
      sqlite.run("UPDATE contacts SET blocked = 1 WHERE userId = ? AND contactId = ?", user.id, targetId);
    } else {
      sqlite.run("DELETE FROM blocked_users WHERE userId = ? AND blockedId = ?", user.id, targetId);
      sqlite.run("UPDATE contacts SET blocked = 0 WHERE userId = ? AND contactId = ?", user.id, targetId);
    }
  }
  if (body.favorite !== undefined) {
    sqlite.run("UPDATE contacts SET favorite = ? WHERE userId = ? AND contactId = ?", body.favorite ? 1 : 0, user.id, targetId);
  }
  if (body.nickname !== undefined) {
    sqlite.run("UPDATE contacts SET nickname = ? WHERE userId = ? AND contactId = ?", String(body.nickname).slice(0, 60), user.id, targetId);
  }
  return NextResponse.json({ ok: true });
}
