import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { emit } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const msg = sqlite.row<any>("SELECT * FROM messages WHERE id = ?", id);
  if (!msg) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pesan tidak ditemukan." } }, { status: 404 });
  const { emoji } = (await req.json().catch(() => ({}))) as any;
  const allowed = ["❤️", "😂", "😮", "😢", "🙏", "🔥", "👍", "💯", "👏", "😆"];
  if (!allowed.includes(emoji)) return NextResponse.json({ error: { code: "VALIDATION", message: "Reaksi tidak didukung." } }, { status: 422 });
  const existing = sqlite.row<any>("SELECT id FROM message_reactions WHERE messageId = ? AND userId = ? AND emoji = ?", id, user.id, emoji);
  if (existing) {
    sqlite.run("DELETE FROM message_reactions WHERE id = ?", existing.id);
  } else {
    sqlite.run("INSERT INTO message_reactions (id, messageId, userId, emoji, createdAt) VALUES (?,?,?,?,?)", newId("r"), id, user.id, emoji, nowMs());
  }
  const reactions = sqlite.rows<{ emoji: string }>("SELECT emoji FROM message_reactions WHERE messageId = ?", id).map((r) => r.emoji);
  emit("message:reaction", { messageId: id, reactions });
  return NextResponse.json({ reactions });
}
