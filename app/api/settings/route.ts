import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  return NextResponse.json({
    privacy: sqlite.row("SELECT * FROM privacy_settings WHERE userId = ?", user.id),
    chat: sqlite.row("SELECT * FROM chat_settings WHERE userId = ?", user.id),
    notifications: sqlite.row("SELECT * FROM notification_settings WHERE userId = ?", user.id),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { section, values } = body;
  const now = nowMs();
  if (section === "privacy") {
    const v = sanitize(values, { lastSeen: "Everyone", profilePhoto: "Everyone", about: "Everyone", status: "Contacts", online: "Everyone", readReceipts: 1, groupAdd: "Contacts", liveLocation: "Nobody", disappearing: 0 });
    sqlite.run(
      `INSERT INTO privacy_settings (userId, lastSeen, profilePhoto, about, status, online, readReceipts, groupAdd, liveLocation, disappearing, updatedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(userId) DO UPDATE SET lastSeen=excluded.lastSeen, profilePhoto=excluded.profilePhoto, about=excluded.about, status=excluded.status, online=excluded.online, readReceipts=excluded.readReceipts, groupAdd=excluded.groupAdd, liveLocation=excluded.liveLocation, disappearing=excluded.disappearing, updatedAt=excluded.updatedAt`,
      user.id, v.lastSeen, v.profilePhoto, v.about, v.status, v.online, v.readReceipts ? 1 : 0, v.groupAdd, v.liveLocation, v.disappearing, now
    );
  } else if (section === "chat") {
    const v = sanitize(values, { theme: "dark", wallpaper: "", enterToSend: 1, mediaVisibility: "Default", fontSize: "medium" });
    sqlite.run(
      `INSERT INTO chat_settings (userId, theme, wallpaper, enterToSend, mediaVisibility, fontSize, updatedAt)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(userId) DO UPDATE SET theme=excluded.theme, wallpaper=excluded.wallpaper, enterToSend=excluded.enterToSend, mediaVisibility=excluded.mediaVisibility, fontSize=excluded.fontSize, updatedAt=excluded.updatedAt`,
      user.id, v.theme, v.wallpaper, v.enterToSend ? 1 : 0, v.mediaVisibility, v.fontSize, now
    );
  } else if (section === "notifications") {
    const v = sanitize(values, { messageSound: 1, messageVibration: 1, popup: 1, groupSound: 1, groupVibration: 1, callRingtone: 1, callVibration: 1 });
    sqlite.run(
      `INSERT INTO notification_settings (userId, messageSound, messageVibration, popup, groupSound, groupVibration, callRingtone, callVibration, updatedAt)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(userId) DO UPDATE SET messageSound=excluded.messageSound, messageVibration=excluded.messageVibration, popup=excluded.popup, groupSound=excluded.groupSound, groupVibration=excluded.groupVibration, callRingtone=excluded.callRingtone, callVibration=excluded.callVibration, updatedAt=excluded.updatedAt`,
      user.id, v.messageSound ? 1 : 0, v.messageVibration ? 1 : 0, v.popup ? 1 : 0, v.groupSound ? 1 : 0, v.groupVibration ? 1 : 0, v.callRingtone ? 1 : 0, v.callVibration ? 1 : 0, now
    );
  } else {
    return NextResponse.json({ error: { code: "VALIDATION", message: "section tidak dikenal." } }, { status: 422 });
  }
  return NextResponse.json({ ok: true, section });
}

function sanitize(values: Record<string, unknown>, defaults: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  if (!values || typeof values !== "object") return out;
  for (const k of Object.keys(defaults)) {
    if (values[k] !== undefined) out[k] = values[k];
  }
  return out;
}
