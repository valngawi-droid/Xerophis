import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAudit } from "../../core";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const u = sqlite.row<any>("SELECT * FROM users WHERE id = ?", id);
  if (!u) return NextResponse.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan." } }, { status: 404 });
  const sessions = sqlite.rows<any>("SELECT device, browser, location, lastActive, createdAt FROM sessions WHERE userId = ?", id);
  const reports = sqlite.row<{ c: number }>("SELECT COUNT(*) AS c FROM reports WHERE targetId = ? AND targetType='user'", id)?.c ?? 0;
  return NextResponse.json({
    user: { id: u.id, username: u.username, displayName: u.displayName, email: u.email, phone: u.phone, bio: u.bio, status: u.status, isVerified: !!u.isVerified, isOnline: !!u.isOnline, createdAt: u.createdAt, lastSeen: u.lastSeen },
    sessions,
    reports,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const u = sqlite.row<any>("SELECT id FROM users WHERE id = ?", id);
  if (!u) return NextResponse.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan." } }, { status: 404 });
  if (body.status && ["active", "suspended", "banned"].includes(body.status)) {
    sqlite.run("UPDATE users SET status = ?, updatedAt = ? WHERE id = ?", body.status, nowMs(), id);
    logAudit(auth.user.id, body.status === "banned" ? "USER_BANNED" : "USER_SUSPENDED", id, { status: body.status });
  }
  if (body.isVerified !== undefined) {
    sqlite.run("UPDATE users SET isVerified = ?, updatedAt = ? WHERE id = ?", body.isVerified ? 1 : 0, nowMs(), id);
    logAudit(auth.user.id, "USER_VERIFIED_CHANGED", id, { isVerified: !!body.isVerified });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const u = sqlite.row<any>("SELECT id FROM users WHERE id = ?", id);
  if (!u) return NextResponse.json({ error: { code: "NOT_FOUND", message: "User tidak ditemukan." } }, { status: 404 });
  if (id === auth.user.id) return NextResponse.json({ error: { code: "VALIDATION", message: "Tidak dapat menghapus akun sendiri." } }, { status: 422 });
  sqlite.run("DELETE FROM users WHERE id = ?", id);
  sqlite.run("DELETE FROM sessions WHERE userId = ?", id);
  logAudit(auth.user.id, "USER_DELETED", id, { username: u.username });
  return NextResponse.json({ ok: true });
}
