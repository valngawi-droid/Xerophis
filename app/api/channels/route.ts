import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { isTitle, isUsername } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const channels = sqlite.rows<any>("SELECT * FROM channels ORDER BY subscriberCount DESC").map((c) => ({
    id: c.id,
    name: c.name,
    username: c.username,
    description: c.description,
    avatar: c.avatar ?? "#FF1111",
    subscriberCount: c.subscriberCount,
    subscribed: !!sqlite.row<any>("SELECT 1 FROM channel_subscribers WHERE channelId=? AND userId=?", c.id, user.id),
  }));
  return NextResponse.json({ channels });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!isTitle(body.name)) return NextResponse.json({ error: { code: "VALIDATION", message: "Nama channel tidak valid." } }, { status: 422 });
  const uname = String(body.username ?? "").toLowerCase();
  if (uname && !isUsername(uname)) return NextResponse.json({ error: { code: "VALIDATION", message: "Username tidak valid." } }, { status: 422 });
  if (uname && sqlite.row("SELECT id FROM channels WHERE username = ?", uname)) {
    return NextResponse.json({ error: { code: "TAKEN", message: "Username channel sudah dipakai." } }, { status: 409 });
  }
  const id = newId("conv");
  const now = nowMs();
  sqlite.run("INSERT INTO channels (id, name, username, description, avatar, ownerId, subscriberCount, createdAt) VALUES (?,?,?,?,?,?,1,?)", id, body.name.trim(), uname || null, String(body.description ?? "").slice(0, 500), body.avatar ?? "#FF1111", user.id, now);
  sqlite.run("INSERT INTO channel_subscribers (id, channelId, userId, subscribedAt) VALUES (?,?,?,?)", newId("cs"), id, user.id, now);
  sqlite.run("INSERT INTO conversations (id, type, title, description, avatar, ownerId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)", id, "channel", body.name.trim(), String(body.description ?? "").slice(0, 500), body.avatar ?? "#FF1111", user.id, now, now);
  sqlite.run("INSERT INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,'owner',?)", newId("cm"), id, user.id, now);
  return NextResponse.json({ channel: { id, name: body.name.trim() } }, { status: 201 });
}
