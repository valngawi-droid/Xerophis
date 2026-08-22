import { NextRequest, NextResponse } from "next/server";
import { sqlite, verifyPassword } from "@/lib/db";
import { createSession, setSessionCookie, rateLimit } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "local";
  const rl = rateLimit(`login:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter}s.` } }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Body tidak valid." } }, { status: 400 });
  }
  const ident = (body.identifier ?? "").toString().trim();
  const password = (body.password ?? "").toString();
  if (!ident || !password) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Masukkan email/username dan password." } }, { status: 422 });
  }
  const user = sqlite.row<any>(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    ident,
    ident
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: { code: "INVALID", message: "Email/username atau password salah." } }, { status: 401 });
  }
  if (user.status === "suspended" || user.status === "banned") {
    return NextResponse.json({ error: { code: "SUSPENDED", message: "Akun ini sedang ditangguhkan." } }, { status: 403 });
  }
  const token = createSession(user.id, { device: "Web", browser: "Browser" });
  const res = NextResponse.json({
    user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, isVerified: !!user.isVerified },
  });
  setSessionCookie(res, token);
  return res;
}
