import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, nowMs } from "@/lib/db";
import { isTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const me = sqlite.row<any>("SELECT role FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  if (!me) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Bukan anggota." } }, { status: 403 });
  if (me.role !== "owner" && me.role !== "admin") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Hanya admin yang dapat mengubah grup." } }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const cols: string[] = [];
  const vals: unknown[] = [];
  if (body.name !== undefined && isTitle(body.name)) { cols.push("title=?"); vals.push(body.name.trim()); }
  if (body.description !== undefined) { cols.push("description=?"); vals.push(String(body.description).slice(0, 500)); }
  if (body.avatar !== undefined) { cols.push("avatar=?"); vals.push(String(body.avatar).slice(0, 200)); }
  if (!cols.length) return NextResponse.json({ error: { code: "VALIDATION", message: "Tidak ada perubahan." } }, { status: 422 });
  cols.push("updatedAt=?");
  vals.push(nowMs(), id);
  sqlite.run(`UPDATE conversations SET ${cols.join(", ")} WHERE id = ?`, ...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const me = sqlite.row<any>("SELECT role FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  if (!me) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Bukan anggota." } }, { status: 403 });
  if (me.role !== "owner") return NextResponse.json({ error: { code: "FORBIDDEN", message: "Hanya owner yang dapat menghapus grup." } }, { status: 403 });
  sqlite.run("DELETE FROM conversations WHERE id = ?", id);
  sqlite.run("DELETE FROM conversation_members WHERE conversationId = ?", id);
  sqlite.run("DELETE FROM messages WHERE conversationId = ?", id);
  return NextResponse.json({ ok: true });
}
