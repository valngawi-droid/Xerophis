import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { listMessages } from "@/lib/repo";
import { isMessageText } from "@/lib/validate";
import { emit } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const member = sqlite.row<any>("SELECT 1 FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  if (!member) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Anda bukan anggota." } }, { status: 403 });
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 40), 100);
  const messages = listMessages(id, user.id, cursor, limit);
  const nextCursor = messages.length ? messages[0].id : null;
  return NextResponse.json({ messages, nextCursor });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const member = sqlite.row<any>("SELECT 1 FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  if (!member) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Anda bukan anggota." } }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "");
  const replyTo = body.replyTo ? String(body.replyTo) : null;
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 10) : [];
  const kind = body.kind === "image" || attachments.some((a: any) => a.type === "image") ? "image" : "text";

  if (!text.trim() && attachments.length === 0) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Pesan tidak boleh kosong." } }, { status: 422 });
  }
  if (text && !isMessageText(text)) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Pesan terlalu panjang." } }, { status: 422 });
  }
  const id2 = newId("m");
  const created = nowMs();
  sqlite.run(
    "INSERT INTO messages (id, conversationId, senderId, text, kind, replyTo, createdAt, status) VALUES (?,?,?,?,?,?,?,'sent')",
    id2, id, user.id, text.trim(), kind, replyTo, created
  );
  for (const a of attachments.slice(0, 10)) {
    sqlite.run("INSERT INTO message_attachments (id, messageId, type, url, name, size, mime, createdAt) VALUES (?,?,?,?,?,?,?,?)", newId("att"), id2, String(a.type ?? "file"), String(a.url ?? ""), String(a.name ?? ""), a.size ?? 0, a.mime ?? "", created);
  }
  sqlite.run("UPDATE conversations SET updatedAt = ? WHERE id = ?", created, id);
  const firstAtt = attachments[0] as { url?: string } | undefined;
  const message = {
    id: id2,
    conversationId: id,
    senderId: user.id,
    from: "me",
    senderName: user.displayName,
    text: text.trim(),
    kind,
    mediaUrl: firstAtt?.url ?? null,
    replyTo,
    status: "sent",
    time: new Date(created).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    date: new Date(created).toLocaleDateString("id-ID", { day: "numeric", month: "long" }),
    reactions: [],
  };
  emit("message:new", message);
  return NextResponse.json({ message }, { status: 201 });
}
