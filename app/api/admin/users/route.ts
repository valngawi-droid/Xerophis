import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAudit } from "../core";
import { sqlite, newId, nowMs, hashPassword } from "@/lib/db";
import { isEmail, isUsername, isPassword, isDisplayName } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const q = ((req.nextUrl.searchParams.get("q") ?? "").trim()).toLowerCase();
  const status = req.nextUrl.searchParams.get("status");
  const like = `%${q}%`;
  const conds = ["1=1"];
  const vals: unknown[] = [];
  if (q) { conds.push("(username LIKE ? OR displayName LIKE ? OR email LIKE ?)"); vals.push(like, like, like); }
  if (status) { conds.push("status = ?"); vals.push(status); }
  const users = sqlite.rows<any>(`SELECT * FROM users WHERE ${conds.join(" AND ")} ORDER BY createdAt DESC LIMIT 100`, ...vals)
    .map((u) => ({
      id: u.id, username: u.username, displayName: u.displayName, email: u.email, avatar: u.avatarUrl ?? u.displayName.slice(0, 1).toUpperCase(),
      isVerified: !!u.isVerified, isOnline: !!u.isOnline, status: u.status, createdAt: u.createdAt, lastSeen: u.lastSeen,
    }));
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => ({}));
  const { displayName, username, email, password } = body;
  const errors: string[] = [];
  if (!isDisplayName(displayName)) errors.push("nama tidak valid");
  if (!isUsername(username)) errors.push("username tidak valid");
  if (email && !isEmail(email)) errors.push("email tidak valid");
  if (!isPassword(password)) errors.push("password minimal 8 karakter");
  if (errors.length) return NextResponse.json({ error: { code: "VALIDATION", message: errors.join("; ") } }, { status: 422 });
  const taken = sqlite.row("SELECT id FROM users WHERE username = ? OR email = ?", username, email);
  if (taken) return NextResponse.json({ error: { code: "TAKEN", message: "Username/email sudah dipakai." } }, { status: 409 });
  const id = newId("u");
  const now = nowMs();
  sqlite.run("INSERT INTO users (id, email, username, passwordHash, displayName, avatarUrl, bio, status, isVerified, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,'active',1,?,?)", id, email ?? null, username, hashPassword(password), displayName, "#FF1111", "Hey there! I am using Xerophis.", now, now);
  logAudit(auth.user.id, "USER_CREATED", id, { username });
  return NextResponse.json({ user: { id } }, { status: 201 });
}
