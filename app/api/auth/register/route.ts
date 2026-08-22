import { NextRequest, NextResponse } from "next/server";
import { sqlite, hashPassword, newId, nowMs } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { isEmail, isUsername, isPassword, isDisplayName, isPhone } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Body tidak valid." } }, { status: 400 });
  }
  const { displayName, username, email, password, phone } = body;
  const errors: string[] = [];
  if (!isDisplayName(displayName)) errors.push("nama tampilan tidak valid (min. 2 karakter)");
  if (!isUsername(username)) errors.push("username tidak valid (3-24 karakter huruf/angka/._)");
  if (!isPassword(password)) errors.push("password minimal 8 karakter");
  if (email && !isEmail(email)) errors.push("email tidak valid");
  if (phone && !isPhone(phone)) errors.push("nomor telepon tidak valid");
  if (errors.length) {
    return NextResponse.json({ error: { code: "VALIDATION", message: errors.join("; ") } }, { status: 422 });
  }
  const existingU = sqlite.row("SELECT id FROM users WHERE username = ? OR email = ?", username, email ?? null);
  if (existingU) {
    return NextResponse.json({ error: { code: "TAKEN", message: "Username atau email sudah terpakai." } }, { status: 409 });
  }
  const id = newId("u");
  const now = nowMs();
  sqlite.run(
    "INSERT INTO users (id, email, phone, username, passwordHash, displayName, avatarUrl, bio, status, isVerified, isOnline, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?, 'active', 1, 1, ?, ?)",
    id,
    email ?? null,
    phone ?? null,
    username,
    hashPassword(password),
    displayName,
    "#FF1111",
    "Hey there! I am using Xerophis.",
    now,
    now
  );
  const token = createSession(id, { device: "Web", browser: "Browser" });
  const res = NextResponse.json({
    user: { id, username, displayName, email: email ?? null, isVerified: true },
  }, { status: 201 });
  setSessionCookie(res, token);
  return res;
}
