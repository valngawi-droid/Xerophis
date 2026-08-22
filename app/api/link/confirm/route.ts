import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, createSession } from "@/lib/auth";
import { confirmLink, expireLink } from "@/lib/link";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * The main account (the "phone") confirms a pairing code — entered manually
 * (8-digit) OR scanned from a QR (the QR encodes the pairing token). This is
 * what links a new device: creates a fresh session and issues a one-time grant
 * the initiator can adopt.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login dulu untuk menautkan perangkat." } }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  // Accept either an 8-digit code typed manually OR a token scanned from QR.
  const code = String(body.code ?? "").trim().toUpperCase();
  const scannedToken = String(body.token ?? "").trim();
  if (!code && !scannedToken) return NextResponse.json({ error: { code: "VALIDATION", message: "Masukkan kode atau scan QR pairing." } }, { status: 422 });

  let result;
  if (scannedToken) {
    // QR payload is the pairing token; look it up by token instead of code.
    const s = sqlite.row<any>("SELECT * FROM pairing_sessions WHERE token = ? AND status='pending' AND expiry > ?", scannedToken, nowMs());
    if (!s) return NextResponse.json({ error: { code: "INVALID", message: "QR tidak valid atau sudah kedaluwarsa." } }, { status: 400 });
    // Mark it confirmed for this account (same as confirmLink does).
    sqlite.run("UPDATE pairing_sessions SET status='confirmed', userId=?, confirmedAt=? WHERE id=?", user.id, nowMs(), s.id);
    result = { ok: true as const, session: s, code: s.code };
  } else {
    result = confirmLink(code, user);
  }
  if (!result.ok) {
    return NextResponse.json({ error: { code: "INVALID", message: result.message } }, { status: 400 });
  }

  // Create a brand-new session for the new (linked) device, belonging to this account.
  const initiatorLabel = result.session.initiatorLabel ?? "Perangkat tertaut";
  const deviceId = newId("s");
  const token = createSession(user.id, { device: initiatorLabel, browser: "Linked", location: result.session.initiatorIp ?? "", ip: result.session.initiatorIp ?? "" });
  // find the session id we just created (it's the newest for this user)
  const sRow = sqlite.row<any>(
    "SELECT id FROM sessions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
    user.id
  );
  sqlite.run("UPDATE pairing_sessions SET deviceId = ? WHERE id = ?", sRow?.id ?? "", result.session.id);
  sqlite.run(
    "INSERT INTO link_grants (id, pairingId, sessionToken, used, createdAt) VALUES (?,?,?,0,?)",
    newId("lg"),
    result.session.id,
    token,
    nowMs()
  );

  return NextResponse.json({ ok: true, device: initiatorLabel });
}
