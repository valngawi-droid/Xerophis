import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { listConversationsFor } from "@/lib/repo";
import { isTitle, isUsername } from "@/lib/validate";
import { emit } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  return NextResponse.json({ conversations: listConversationsFor(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = String(body.type ?? "direct");
  const now = nowMs();
  const id = newId("conv");

  if (type === "direct") {
    const targetId = String(body.targetId ?? "");
    const target = sqlite.row<any>("SELECT id, displayName, avatarUrl FROM users WHERE id = ?", targetId);
    if (!target) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pengguna tidak ditemukan." } }, { status: 404 });
    // idempotent direct chat
    const existing = sqlite.row<any>(
      `SELECT c.id FROM conversations c
        WHERE c.type = 'direct'
          AND (SELECT COUNT(*) FROM conversation_members WHERE conversationId = c.id AND userId IN (?,?)) = 2
        LIMIT 1`,
      user.id,
      targetId
    );
    if (existing) return NextResponse.json({ conversation: { id: existing.id } });
    sqlite.run("INSERT INTO conversations (id, type, title, avatar, ownerId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?)", id, "direct", target.displayName, target.avatarUrl ?? "#FF1111", user.id, now, now);
    for (const uid of [user.id, targetId]) sqlite.run("INSERT INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'member',?)", newId("cm"), id, uid, now);
    return NextResponse.json({ conversation: { id } }, { status: 201 });
  }

  if (type === "group") {
    if (!isTitle(body.name)) return NextResponse.json({ error: { code: "VALIDATION", message: "Nama grup tidak valid." } }, { status: 422 });
    const memberIds = Array.isArray(body.memberIds) ? body.memberIds.filter((m: string) => m && m !== user.id).slice(0, 100) : [];
    sqlite.run("INSERT INTO conversations (id, type, title, description, avatar, ownerId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)", id, "group", body.name.trim(), String(body.description ?? "").slice(0, 500), body.avatar ?? "#FF1111", user.id, now, now);
    sqlite.run("INSERT INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'owner',?)", newId("cm"), id, user.id, now);
    for (const uid of memberIds) sqlite.run("INSERT OR IGNORE INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'member',?)", newId("cm"), id, uid, now);
    emit("conversation:new", { conversationId: id, type: "group" });
    return NextResponse.json({ conversation: { id } }, { status: 201 });
  }

  if (type === "channel") {
    if (!isTitle(body.name)) return NextResponse.json({ error: { code: "VALIDATION", message: "Nama channel tidak valid." } }, { status: 422 });
    const uname = String(body.username ?? "").toLowerCase();
    if (uname && !isUsername(uname)) return NextResponse.json({ error: { code: "VALIDATION", message: "Username channel tidak valid." } }, { status: 422 });
    sqlite.run("INSERT INTO conversations (id, type, title, description, avatar, ownerId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)", id, "channel", body.name.trim(), String(body.description ?? "").slice(0, 500), body.avatar ?? "#FF1111", user.id, now, now);
    sqlite.run("INSERT INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'owner',?)", newId("cm"), id, user.id, now);
    sqlite.run("INSERT INTO channels (id, name, username, description, avatar, ownerId, subscriberCount, createdAt) VALUES (?,?,?,?,?,?,1,?)", id, body.name.trim(), uname || null, String(body.description ?? ""), body.avatar ?? "#FF1111", user.id, now);
    sqlite.run("INSERT INTO channel_subscribers (id, channelId, userId, subscribedAt) VALUES (?,?,?,?)", newId("cs"), id, user.id, now);
    emit("channel:new", { channelId: id, name: body.name });
    return NextResponse.json({ conversation: { id, type: "channel" } }, { status: 201 });
  }

  return NextResponse.json({ error: { code: "VALIDATION", message: "Tipe percakapan tidak dikenal." } }, { status: 422 });
}
