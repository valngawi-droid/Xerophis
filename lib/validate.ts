/** Server-side input validation. Never trust client-only validation. */

export function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isUsername(s: unknown): s is string {
  return typeof s === "string" && /^[a-z0-9_.]{3,24}$/i.test(s);
}

export function isDisplayName(s: unknown): s is string {
  return typeof s === "string" && s.trim().length >= 2 && s.trim().length <= 80;
}

export function isPassword(s: unknown): s is string {
  return typeof s === "string" && s.length >= 8 && s.length <= 128;
}

export function isPhone(s: unknown): s is string {
  return typeof s === "string" && /^\+?[0-9\s-]{6,20}$/.test(s);
}

export function isMessageText(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0 && s.trim().length <= 4000;
}

export function isTitle(s: unknown): s is string {
  return typeof s === "string" && s.trim().length >= 1 && s.trim().length <= 120;
}
