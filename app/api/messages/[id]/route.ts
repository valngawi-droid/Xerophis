import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { emit } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const msg = sqlite.row<any>("SELECT * FROM messages WHERE id = ?", id);
  if (!msg) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pesan tidak ditemukan." } }, { status: 404 });
  const isOwner = msg.senderId === user.id;
  const body = await req.json().catch(() => ({}));
  const modRole = isAdminForConv(user.id, msg.conversationId);
  if (body.text !== undefined) {
    if (!isOwner) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Hanya pemilik pesan yang dapat mengedit." } }, { status: 403 });
    sqlite.run("UPDATE messages SET text = ?, editedAt = ? WHERE id = ?", String(body.text).slice(0, 4000), nowMs(), id);
    emit("message:update", { id, text: String(body.text) });
  }
  // only for delete
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const msg = sqlite.row<any>("SELECT * FROM messages WHERE id = ?", id);
  if (!msg) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pesan tidak ditemukan." } }, { status: 404 });
  const isOwner = msg.senderId === user.id;
  const modRole = isAdminForConv(user.id, msg.conversationId);
  if (!isOwner && !modRole) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Tidak diizinkan menghapus pesan ini." } }, { status: 403 });
  sqlite.run("UPDATE messages SET deletedAt = ? WHERE id = ?", nowMs(), id);
  emit("message:delete", { id, conversationId: msg.conversationId });
  return NextResponse.json({ ok: true });
}

function isAdminForConv(userId: string, convId: string): string | null {
  const m = sqlite.row<any>("SELECT role FROM conversation_members WHERE conversationId = ? AND userId = ?", convId, userId);
  return m && (m.role === "owner" || m.role === "admin") ? m.role : null;
}
