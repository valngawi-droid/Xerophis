import { sqlite, newId, nowMs } from "./db";

/**
 * Device-linking helpers (WhatsApp-style "Linked devices").
 *
 * Flow:
 *   1. A brand-new device (web or Android) calls `initLink()` -> receives a
 *      `token` (secret) and an 8-digit `code`.
 *   2. The user enters the code on their phone/main account, which calls
 *      `confirmLink(code)`. That marks the pairing confirmed for the main user.
 *   3. The new device polls `getLink(token)`. When status becomes `confirmed`
 *      it takes the returned session token and uses it as its own login.
 */

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function genCode(): string {
  // 8 digits, skipping ambiguous 0/O and 1/I
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export function initLink(extra?: { label?: string; ip?: string }) {
  const now = nowMs();
  const token = newId("link");
  const code = genCode();
  const expiry = now + CODE_TTL_MS;
  sqlite.run(
    "INSERT INTO pairing_sessions (id, token, code, initiatorLabel, initiatorIp, status, createdAt, expiry) VALUES (?,?,?,?,?,'pending',?,?)",
    newId("pl"),
    token,
    code,
    extra?.label ?? "Perangkat baru",
    extra?.ip ?? "",
    now,
    expiry
  );
  return { token, code, expiry };
}

export function getLink(token: string) {
  return sqlite.row<any>("SELECT * FROM pairing_sessions WHERE token = ?", token);
}

export function confirmLink(code: string, user: { id: string }) {
  const now = nowMs();
  const upper = code.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const session = sqlite.row<any>(
    "SELECT * FROM pairing_sessions WHERE code = ? AND status = 'pending' AND expiry > ? ORDER BY createdAt DESC LIMIT 1",
    upper,
    now
  );
  if (!session) {
    return { ok: false as const, reason: "invalid", message: "Kode tidak valid atau sudah kedaluwarsa." };
  }
  sqlite.run(
    "UPDATE pairing_sessions SET status = 'confirmed', userId = ?, confirmedAt = ? WHERE id = ?",
    user.id,
    now,
    session.id
  );
  return { ok: true as const, session, code: upper };
}

export function expireLink(token: string) {
  sqlite.run("UPDATE pairing_sessions SET status = 'expired' WHERE token = ?", token);
}

export function expireStaleLinks() {
  sqlite.run("UPDATE pairing_sessions SET status = 'expired' WHERE status = 'pending' AND expiry < ?", nowMs());
}

export function formatCode(code: string): string {
  return code.replace(/(.{4})/g, "$1 ").trim();
}
