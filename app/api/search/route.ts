import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const q = ((req.nextUrl.searchParams.get("q") ?? "").trim()).toLowerCase();
  if (!q) return NextResponse.json({ results: { users: [], conversations: [], messages: [], groups: [], communities: [], channels: [] } });
  const like = `%${q}%`;
  const cap = 20;

  const users = sqlite.rows<any>("SELECT id, displayName, username, avatarUrl FROM users WHERE username LIKE ? OR displayName LIKE ? LIMIT ?", like, like, cap)
    .map((u) => ({ id: u.id, name: u.displayName, sub: `@${u.username}`, avatar: u.avatarUrl ?? u.displayName.slice(0, 1).toUpperCase() }));

  const conversations = sqlite.rows<any>(
    `SELECT c.id, c.title, c.type, c.avatar
       FROM conversations c JOIN conversation_members m ON m.conversationId=c.id
      WHERE m.userId = ? AND c.title LIKE ? LIMIT ?`,
    user.id, like, cap
  ).map((c) => ({ id: c.id, name: c.title, sub: c.type, avatar: c.avatar ?? "X" }));

  const groups = sqlite.rows<any>(
    `SELECT c.id, c.title, c.avatar FROM conversations c
      WHERE c.type='group' AND c.title LIKE ? LIMIT ?`, like, cap
  ).map((c) => ({ id: c.id, name: c.title, avatar: c.avatar ?? "X" }));

  const communities = sqlite.rows<any>("SELECT id, name, avatar FROM communities WHERE name LIKE ? LIMIT ?", like, cap)
    .map((c) => ({ id: c.id, name: c.name, avatar: c.avatar ?? "X" }));

  const channels = sqlite.rows<any>("SELECT id, name, avatar FROM channels WHERE name LIKE ? OR username LIKE ? LIMIT ?", like, like, cap)
    .map((c) => ({ id: c.id, name: c.name, avatar: c.avatar ?? "X" }));

  // filter by type
  const type = req.nextUrl.searchParams.get("type");
  let messages: unknown[] = [];
  if (!type || type === "messages") {
    messages = sqlite.rows<any>(
      `SELECT m.id, m.text, m.conversationId, m.createdAt FROM messages m
        JOIN conversation_members mm ON mm.conversationId = m.conversationId
       WHERE mm.userId = ? AND m.text LIKE ? AND m.deletedAt IS NULL
       ORDER BY m.createdAt DESC LIMIT ?`,
      user.id, like, cap
    ).map((m) => ({ id: m.id, text: m.text, conversationId: m.conversationId, time: new Date(m.createdAt).getTime() }));
  }

  return NextResponse.json({ results: { users, conversations, messages, groups, communities, channels } });
}
