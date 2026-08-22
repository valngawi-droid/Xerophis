import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

/** List the devices/sessions linked to this account (WhatsApp-like). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const devices = sqlite.rows<any>(
    "SELECT id, device, browser, location, ip, lastActive, createdAt FROM sessions WHERE userId = ? ORDER BY lastActive DESC",
    user.id
  ).map((d) => ({
    id: d.id,
    device: d.device ?? "Perangkat",
    browser: d.browser ?? "Browser",
    location: d.location || (d.ip ? `IP ${d.ip}` : ""),
    lastActive: d.lastActive,
    createdAt: d.createdAt,
    current: false, // set below by comparing cookie
  }));
  return NextResponse.json({ devices });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.deviceId ?? "");
  if (!id) return NextResponse.json({ error: { code: "VALIDATION", message: "deviceId wajib." } }, { status: 422 });
  const d = sqlite.row<any>("SELECT id FROM sessions WHERE id = ? AND userId = ?", id, user.id);
  if (!d) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Perangkat tidak ditemukan." } }, { status: 404 });
  sqlite.run("DELETE FROM sessions WHERE id = ?", id);
  return NextResponse.json({ ok: true });
}
