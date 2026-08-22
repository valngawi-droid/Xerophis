import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { sqlite, nowMs, newId } from "@/lib/db";
import { isDisplayName, isUsername, isPhone } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const settings = {
    privacy: sqlite.row("SELECT * FROM privacy_settings WHERE userId = ?", user.id),
    chat: sqlite.row("SELECT * FROM chat_settings WHERE userId = ?", user.id),
    notifications: sqlite.row("SELECT * FROM notification_settings WHERE userId = ?", user.id),
  };
  const stats = sqlite.row<any>(
    `SELECT
       (SELECT COUNT(*) FROM conversations c JOIN conversation_members m ON m.conversationId=c.id WHERE m.userId=?) AS chats,
       (SELECT COUNT(*) FROM messages WHERE senderId=?) AS messages`,
    user.id,
    user.id
  );
  return NextResponse.json({ user: publicUser(user), settings, stats });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const errors: string[] = [];
  const updates: Record<string, unknown> = {};
  if (body.displayName !== undefined) {
    if (isDisplayName(body.displayName)) updates.displayName = body.displayName.trim();
    else errors.push("nama tampilan tidak valid");
  }
  if (body.username !== undefined) {
    if (isUsername(body.username)) {
      const taken = sqlite.row("SELECT id FROM users WHERE username = ? AND id != ?", body.username, user.id);
      if (taken) errors.push("username sudah dipakai");
      else updates.username = body.username;
    } else errors.push("username tidak valid");
  }
  if (body.bio !== undefined) updates.bio = String(body.bio).slice(0, 160);
  if (body.phone !== undefined) {
    if (body.phone === "" || isPhone(body.phone)) updates.phone = body.phone || null;
    else errors.push("nomor tidak valid");
  }
  if (body.avatarUrl !== undefined) {
    const av = String(body.avatarUrl).slice(0, 512);
    // allow bundled brand/3D avatars or uploaded assets under /api/upload or /avatars
    const isSafe = /^\/avatars\//.test(av) || /^\/api\/upload\//.test(av) || /^\/profile\//.test(av) || /^\/public\//.test(av) || av === "" || av === "#FF1111";
    if (isSafe) updates.avatarUrl = av;
    else errors.push("avatarUrl tidak valid");
  }
  if (errors.length) return NextResponse.json({ error: { code: "VALIDATION", message: errors.join("; ") } }, { status: 422 });
  if (Object.keys(updates).length) {
    const set = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    sqlite.run(`UPDATE users SET ${set}, updatedAt = ? WHERE id = ?`, ...Object.values(updates), nowMs(), user.id);
  }
  const fresh = await getCurrentUser();
  return NextResponse.json({ user: publicUser(fresh!) });
}
