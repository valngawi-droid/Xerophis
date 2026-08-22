import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The new device adopts the one-time session token it received from the pairing
 * status endpoint. The server validates the token and sets the session cookie.
 * This runs while the new device has NO existing cookie, so the token itself is
 * the credential — it was issued specifically for this link and is single-use.
 */
export async function POST(req: NextRequest) {
  const { sessionToken } = await req.json().catch(() => ({}));
  if (!sessionToken || typeof sessionToken !== "string") {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "sessionToken wajib." } }, { status: 400 });
  }
  // Validate it's a real session token by looking at the hashed value.
  const { sqlite, hashToken, nowMs } = await import("@/lib/db");
  const s = sqlite.row<any>("SELECT * FROM sessions WHERE tokenHash = ? AND expiresAt > ?", hashToken(sessionToken), nowMs());
  if (!s) {
    return NextResponse.json({ error: { code: "INVALID", message: "Token sesi tidak valid atau kedaluwarsa." } }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, sessionToken);
  return res;
}
