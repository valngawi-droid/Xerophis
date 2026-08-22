import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sqlite, hashToken, nowMs, newId } from "./db";

export const SESSION_COOKIE = "xerophis_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------------------------------------------------------------------------
// Rate limiting (in-process, simple token bucket)
// ---------------------------------------------------------------------------
type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __rate?: Map<string, Bucket> };
if (!g.__rate) g.__rate = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 12, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const store = g.__rate!;
  const now = nowMs();
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count++;
  return { ok: true, retryAfter: 0 };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isVerified: number;
  isOnline: number;
  lastSeen: number | null;
  createdAt: number;
  role: string;
};

export function createSession(userId: string, extra?: { device?: string; browser?: string; location?: string; ip?: string }) {
  const token = newId("tok") + ":" + newId("");
  sqlite.run(
    "INSERT INTO sessions (id, userId, tokenHash, device, browser, location, ip, createdAt, lastActive, expiresAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
    newId("s"),
    userId,
    hashToken(token),
    extra?.device ?? "Web",
    extra?.browser ?? "Browser",
    extra?.location ?? "",
    extra?.ip ?? "",
    nowMs(),
    nowMs(),
    nowMs() + SESSION_TTL_MS
  );
  return token;
}

export function destroySession(token: string) {
  const tokenHash = hashToken(token);
  sqlite.run("DELETE FROM sessions WHERE tokenHash = ?", tokenHash);
}

export function destroySessionsForUser(userId: string, exceptToken?: string) {
  if (exceptToken) {
    sqlite.run("DELETE FROM sessions WHERE userId = ? AND tokenHash != ?", userId, hashToken(exceptToken));
  } else {
    sqlite.run("DELETE FROM sessions WHERE userId = ?", userId);
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = sqlite.row<any>(
    `SELECT * FROM sessions WHERE tokenHash = ? AND expiresAt > ?`,
    tokenHash,
    nowMs()
  );
  if (!session) return null;
  const user = sqlite.row<SessionUser>(
    `SELECT id, email, phone, username, displayName, bio, avatarUrl, isVerified, isOnline, lastSeen, createdAt, 'user' AS role FROM users WHERE id = ?`,
    session.userId
  );
  if (!user) return null;
  // graceful last-active update (throttled to every 60s)
  if (nowMs() - (session.lastActive ?? 0) > 60_000) {
    sqlite.run("UPDATE sessions SET lastActive = ? WHERE id = ?", nowMs(), session.id);
  }
  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && user.username === "xerophis" && user.role === "user" && user.isVerified === 1;
}

export function publicUser(u: SessionUser) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    avatar: u.avatarUrl ?? (u.displayName.slice(0, 1).toUpperCase() || "X"),
    avatarColor: u.avatarUrl,
    isVerified: !!u.isVerified,
    online: !!u.isOnline,
    lastSeen: u.lastSeen,
  };
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export async function deny(message: string, code = "UNAUTHORIZED", status = 401) {
  return NextResponse.json({ error: { code, message } }, { status });
}
