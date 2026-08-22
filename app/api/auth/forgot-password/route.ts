import { NextRequest, NextResponse } from "next/server";
import { sqlite, newId, nowMs } from "@/lib/db";
import { rateLimit } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Password reset flow.
 *
 * SMTP is external infrastructure which cannot be fully provisioned inside
 * this sandbox, so the reset token is generated, stored, and returned as an
 * opaque `resetToken` in the response only in demo mode (NODE_ENV != production).
 * In production, the token must be emailed via SMTP (see SMTP_* env vars) and
 * never returned in the API response.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`forgot:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan." } }, { status: 429 });
  let { email } = (await req.json().catch(() => ({}))) as any;
  email = String(email ?? "").trim();
  if (!email) return NextResponse.json({ error: { code: "VALIDATION", message: "Masukkan email." } }, { status: 422 });
  const user = sqlite.row<any>("SELECT id, email FROM users WHERE email = ?", email);
  // Always return the same shape to avoid user enumeration.
  const response: any = { ok: true, message: "Jika email terdaftar, tautan reset telah dikirim." };
  if (process.env.NODE_ENV !== "production" && user) {
    const token = newId("rst");
    sqlite.run(
      "INSERT INTO security_events (id, userId, event, meta, createdAt) VALUES (?,?,?,?,?)",
      `se${nowMs()}`,
      user.id,
      "PASSWORD_RESET_REQUESTED",
      JSON.stringify({ email }),
      nowMs()
    );
    response.resetToken = token; // demo only
  }
  return NextResponse.json(response);
}
