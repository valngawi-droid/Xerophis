import { NextRequest, NextResponse } from "next/server";
import { getLink, expireLink } from "@/lib/link";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

/** The initiator polls with its secret token until the pairing is confirmed. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "token wajib." } }, { status: 400 });
  const s = getLink(token);
  if (!s) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Sesi pairing tidak ditemukan." } }, { status: 404 });

  if (s.status === "pending" && s.expiry < nowMs()) {
    expireLink(token);
    return NextResponse.json({ status: "expired" });
  }

  if (s.status === "confirmed") {
    // Hand the one-time session token to the initiator exactly once.
    const grant = sqlite.row<any>("SELECT * FROM link_grants WHERE pairingId = ? AND used = 0", s.id);
    if (grant) {
      sqlite.run("UPDATE link_grants SET used = 1 WHERE id = ?", grant.id);
      return NextResponse.json({ status: "confirmed", sessionToken: grant.sessionToken, label: s.initiatorLabel, hasSession: true });
    }
    return NextResponse.json({ status: "confirmed", hasSession: false });
  }

  return NextResponse.json({ status: s.status });
}
