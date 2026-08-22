import { NextRequest, NextResponse } from "next/server";
import { sqlite, hashPassword, newId, nowMs } from "@/lib/db";
import { isPassword } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password, resetToken } = (await req.json().catch(() => ({}))) as any;
  if (!isPassword(password)) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Password minimal 8 karakter." } }, { status: 422 });
  }
  if (!email) return NextResponse.json({ error: { code: "VALIDATION", message: "Email tidak valid." } }, { status: 422 });
  const user = sqlite.row<any>("SELECT id, email FROM users WHERE email = ?", email);
  if (!user) return NextResponse.json({ error: { code: "INVALID", message: "Permintaan reset tidak valid." } }, { status: 401 });
  sqlite.run("UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?", hashPassword(password), nowMs(), user.id);
  sqlite.run("DELETE FROM sessions WHERE userId = ?", user.id);
  sqlite.run("INSERT INTO security_events (id, userId, event, meta, createdAt) VALUES (?,?,?,?,?)", `se${newId()}`, user.id, "PASSWORD_RESET", "{}", nowMs());
  return NextResponse.json({ ok: true, message: "Password berhasil direset. Silakan login." });
}
