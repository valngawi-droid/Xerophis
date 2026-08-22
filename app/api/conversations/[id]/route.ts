import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const conv = sqlite.row<any>(
    `SELECT c.* FROM conversations c
       JOIN conversation_members m ON m.conversationId = c.id
      WHERE c.id = ? AND m.userId = ?`,
    id,
    user.id
  );
  if (!conv) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Percakapan tidak ditemukan." } }, { status: 404 });
  const members = sqlite.rows<any>(
    `SELECT u.id, u.displayName, u.username, u.avatarUrl, u.isOnline, u.isVerified, mm.role
       FROM conversation_members mm JOIN users u ON u.id = mm.userId
      WHERE mm.conversationId = ?`,
    id
  ).map((m) => ({
    id: m.id,
    displayName: m.displayName,
    username: m.username,
    avatar: m.avatarUrl ?? m.displayName.slice(0, 1).toUpperCase(),
    online: !!m.isOnline,
    verified: !!m.isVerified,
    role: m.role,
  }));
  return NextResponse.json({ conversation: { ...conv, members } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const me = sqlite.row<any>("SELECT role FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  if (!me) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Anda bukan anggota." } }, { status: 403 });
  // only owner/admin can change info for group/channel
  const isPrivileged = me.role === "owner" || me.role === "admin";
  const cols: string[] = [];
  const vals: unknown[] = [];
  if (body.title !== undefined && isPrivileged) { cols.push("title = ?"); vals.push(String(body.title).slice(0, 120)); }
  if (body.description !== undefined && isPrivileged) { cols.push("description = ?"); vals.push(String(body.description).slice(0, 500)); }
  if (body.avatar !== undefined && isPrivileged) { cols.push("avatar = ?"); vals.push(String(body.avatar).slice(0, 200)); }
  if (body.muted !== undefined) { cols.push("muted = ?"); vals.push(body.muted ? 1 : 0); }
  if (body.pinned !== undefined) { cols.push("pinned = ?"); vals.push(body.pinned ? 1 : 0); }
  if (body.wallpaper !== undefined && isPrivileged) { cols.push("wallpaper = ?"); vals.push(String(body.wallpaper).slice(0, 300)); }
  if (!cols.length) return NextResponse.json({ error: { code: "VALIDATION", message: "Tidak ada perubahan." } }, { status: 422 });
  cols.push("updatedAt = ?");
  vals.push(nowMs(), id);
  sqlite.run(`UPDATE conversations SET ${cols.join(", ")} WHERE id = ?`, ...vals);
  return NextResponse.json({ ok: true });
}
