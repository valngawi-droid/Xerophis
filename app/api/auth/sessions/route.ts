import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE, destroySessionsForUser } from "@/lib/auth";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const sessions = sqlite.rows<any>(
    `SELECT id, device, browser, location, ip, lastActive, createdAt FROM sessions WHERE userId = ? ORDER BY lastActive DESC`,
    user.id
  ).map((s) => ({
    id: s.id,
    device: s.device,
    browser: s.browser,
    location: s.location,
    lastActive: s.lastActive,
    createdAt: s.createdAt,
  }));
  return NextResponse.json({ sessions });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  destroySessionsForUser(user.id, token);
  sqlite.run("INSERT INTO security_events (id, userId, event, meta, createdAt) VALUES (?,?,?,?,?)", `se${nowMs()}`, user.id, "LOGOUT_ALL", "{}", nowMs());
  return NextResponse.json({ ok: true });
}
