import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const status = sqlite.row<any>("SELECT * FROM statuses WHERE id = ?", id);
  if (!status) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Status tidak ditemukan." } }, { status: 404 });
  sqlite.run("INSERT OR IGNORE INTO status_viewers (id, statusId, userId, viewedAt) VALUES (?,?,?,?)", `sv${nowMs()}${Math.random().toString(36).slice(2, 6)}`, id, user.id, nowMs());
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const status = sqlite.row<any>("SELECT * FROM statuses WHERE id = ?", id);
  if (!status) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Status tidak ditemukan." } }, { status: 404 });
  if (status.userId !== user.id) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Hanya pembuat status." } }, { status: 403 });
  sqlite.run("DELETE FROM statuses WHERE id = ?", id);
  sqlite.run("DELETE FROM status_viewers WHERE statusId = ?", id);
  return NextResponse.json({ ok: true });
}
