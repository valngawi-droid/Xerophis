import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { scryptSync, randomUUID, randomBytes } from "node:crypto";
import { BRAND } from "./brand";
export { BRAND };

/**
 * Xerophis database layer.
 *
 * Uses SQLite (built into Node via `node:sqlite`) as the default persistent
 * store — a real relational database persisted to a file on disk, so data
 * survives server restarts and is never held only in memory.
 *
 * The schema and repository helpers are intentionally kept in clean modules so
 * the persistence provider can be swapped to PostgreSQL (see prisma/schema.prisma
 * and docker-compose.yml) for VPS production without touching business logic.
 *
 * Passwords are never stored in plaintext: they are hashed with scrypt + salt.
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  displayName TEXT NOT NULL,
  avatarUrl TEXT,
  bio TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  isVerified INTEGER DEFAULT 0,
  isOnline INTEGER DEFAULT 0,
  lastSeen INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT UNIQUE NOT NULL,
  device TEXT,
  browser TEXT,
  location TEXT,
  ip TEXT,
  createdAt INTEGER NOT NULL,
  lastActive INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct', -- direct | group | channel
  title TEXT,
  description TEXT,
  avatar TEXT,
  ownerId TEXT,
  muted INTEGER DEFAULT 0,
  pinned INTEGER DEFAULT 0,
  wallpaper TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- owner | admin | member
  joinedAt INTEGER NOT NULL,
  UNIQUE(conversationId, userId)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  senderId TEXT NOT NULL,
  text TEXT DEFAULT '',
  kind TEXT DEFAULT 'text', -- text | image | video | audio | system
  replyTo TEXT,
  createdAt INTEGER NOT NULL,
  editedAt INTEGER,
  deletedAt INTEGER,
  status TEXT DEFAULT 'sent', -- sent | delivered | read
  UNIQUE(id, conversationId)
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  userId TEXT NOT NULL,
  emoji TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  UNIQUE(messageId, userId, emoji)
);

CREATE TABLE IF NOT EXISTS message_attachments (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbUrl TEXT,
  name TEXT,
  size INTEGER,
  mime TEXT,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS starred_messages (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  messageId TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pinned_messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  messageId TEXT NOT NULL,
  pinnedBy TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar TEXT,
  ownerId TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS community_members (
  id TEXT PRIMARY KEY,
  communityId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joinedAt INTEGER NOT NULL,
  UNIQUE(communityId, userId)
);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  description TEXT DEFAULT '',
  avatar TEXT,
  ownerId TEXT NOT NULL,
  subscriberCount INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS channel_subscribers (
  id TEXT PRIMARY KEY,
  channelId TEXT NOT NULL,
  userId TEXT NOT NULL,
  subscribedAt INTEGER NOT NULL,
  UNIQUE(channelId, userId)
);

CREATE TABLE IF NOT EXISTS statuses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  content TEXT DEFAULT '',
  mediaUrl TEXT,
  kind TEXT DEFAULT 'text',
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS status_viewers (
  id TEXT PRIMARY KEY,
  statusId TEXT NOT NULL,
  userId TEXT NOT NULL,
  viewedAt INTEGER NOT NULL,
  UNIQUE(statusId, userId)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  read INTEGER DEFAULT 0,
  conversationId TEXT,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  contactId TEXT NOT NULL,
  nickname TEXT,
  favorite INTEGER DEFAULT 0,
  blocked INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL,
  UNIQUE(userId, contactId)
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  blockedId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  UNIQUE(userId, blockedId)
);

CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  callerId TEXT NOT NULL,
  receiverId TEXT NOT NULL,
  conversationId TEXT,
  type TEXT NOT NULL, -- audio | video
  status TEXT NOT NULL, -- incoming | outgoing | missed | connected
  startedAt INTEGER NOT NULL,
  endedAt INTEGER
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  userId TEXT PRIMARY KEY,
  lastSeen TEXT DEFAULT 'Everyone',
  profilePhoto TEXT DEFAULT 'Everyone',
  about TEXT DEFAULT 'Everyone',
  status TEXT DEFAULT 'Contacts',
  online TEXT DEFAULT 'Everyone',
  readReceipts INTEGER DEFAULT 1,
  groupAdd TEXT DEFAULT 'Contacts',
  liveLocation TEXT DEFAULT 'Nobody',
  disappearing INTEGER DEFAULT 0,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_settings (
  userId TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  wallpaper TEXT DEFAULT '',
  enterToSend INTEGER DEFAULT 1,
  mediaVisibility TEXT DEFAULT 'Default',
  fontSize TEXT DEFAULT 'medium',
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_settings (
  userId TEXT PRIMARY KEY,
  messageSound INTEGER DEFAULT 1,
  messageVibration INTEGER DEFAULT 1,
  popup INTEGER DEFAULT 1,
  groupSound INTEGER DEFAULT 1,
  groupVibration INTEGER DEFAULT 1,
  callRingtone INTEGER DEFAULT 1,
  callVibration INTEGER DEFAULT 1,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporterId TEXT NOT NULL,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- pending | reviewing | resolved | dismissed
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  uploaderId TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  name TEXT,
  size INTEGER,
  mime TEXT,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  adminId TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  metadata TEXT DEFAULT '',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  event TEXT NOT NULL,
  meta TEXT DEFAULT '',
  createdAt INTEGER NOT NULL
);

-- Device linking (WhatsApp-style "Linked devices" pairing via an 8-digit code).
CREATE TABLE IF NOT EXISTS pairing_sessions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,        -- secret the initiator polls with
  code TEXT NOT NULL,                -- 8-digit code shown to the user
  initiatorLabel TEXT,               -- e.g. "Chrome di Windows"
  initiatorIp TEXT,
  status TEXT DEFAULT 'pending',     -- pending | confirmed | expired | cancelled
  deviceId TEXT,                     -- session id created on confirm
  userId TEXT,                       -- owner set on confirm
  createdAt INTEGER NOT NULL,
  expiry INTEGER NOT NULL,
  confirmedAt INTEGER
);

-- One-time grant that hands a fresh session token to the newly linked device.
CREATE TABLE IF NOT EXISTS link_grants (
  id TEXT PRIMARY KEY,
  pairingId TEXT UNIQUE NOT NULL,
  sessionToken TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(tokenHash);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversationId, createdAt);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_members_conv ON conversation_members(conversationId);
CREATE INDEX IF NOT EXISTS idx_members_user ON conversation_members(userId);
CREATE INDEX IF NOT EXISTS idx_react_msg ON message_reactions(messageId);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(userId, read);
CREATE INDEX IF NOT EXISTS idx_status_user ON statuses(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_channel_sub ON channel_subscribers(channelId);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_pairing_status ON pairing_sessions(status, expiry);
CREATE INDEX IF NOT EXISTS idx_pairing_token ON pairing_sessions(token);
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now() {
  return Date.now();
}

function pg(name: string) {
  return db.prepare(name);
}

// Singleton handle across Next.js dev hot-reloads
const g = globalThis as unknown as { __xerophisDb?: DatabaseSync; __xerophisInited?: boolean };

let db: DatabaseSync;

if (!g.__xerophisDb) {
  const dir = process.env.DATA_DIR ?? join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const dbPath = process.env.DATABASE_FILE ?? join(dir, "xerophis.db");
  g.__xerophisDb = new DatabaseSync(dbPath);
}
db = g.__xerophisDb;

export function initDb() {
  if (g.__xerophisInited) return;
  db.exec("PRAGMA journal_mode=WAL;");
  db.exec(SCHEMA);
  seedIfEmpty();
  g.__xerophisInited = true;
}

export function getDb() {
  initDb();
  return db;
}

export function rows<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T[] {
  initDb();
  return pg(sql).all(...args) as T[];
}

export function row<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T | undefined {
  initDb();
  return pg(sql).get(...args) as T | undefined;
}

export function run(sql: string, ...args: unknown[]) {
  initDb();
  pg(sql).run(...args);
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt + salt) & token utils
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hex] = parts;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqualHex(candidate, hex);
  } catch {
    return false;
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function newId(prefix = ""): string {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function hashToken(token: string): string {
  return scryptSync(token, "xerophis-session-fix-salt", 32).toString("hex");
}

export function nowMs() {
  return now();
}

export const sqlite = {
  rows,
  row,
  run,
  hashPassword,
  verifyPassword,
  newId,
  hashToken,
  nowMs,
  db: () => getDb(),
};

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

import { seed } from "./seed";
function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number } | undefined)?.c ?? 0;
  if (count === 0) {
    seed(db);
  }
}
