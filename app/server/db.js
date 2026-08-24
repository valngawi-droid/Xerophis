'use strict';
/**
 * Xerophis — storage layer.
 * SQLite (node:sqlite) adapter. All accessors are async so a Postgres
 * adapter (DATABASE_URL, see .env.example / deploy/) can drop in later
 * without touching the API layer.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'xerophis.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT,
  display_name  TEXT    NOT NULL,
  phone         TEXT    NOT NULL DEFAULT '',
  about         TEXT    NOT NULL DEFAULT 'Hey there! I am using Xerophis.',
  avatar_text   TEXT    NOT NULL,
  avatar_color  TEXT    NOT NULL DEFAULT '#7a1216',
  is_bot        INTEGER NOT NULL DEFAULT 0,
  is_official   INTEGER NOT NULL DEFAULT 0,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL CHECK (type IN ('private','group')),
  title      TEXT,
  about      TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL DEFAULT 'member',
  favorite        INTEGER NOT NULL DEFAULT 0,
  muted           INTEGER NOT NULL DEFAULT 0,
  last_read_id    INTEGER NOT NULL DEFAULT 0,
  joined_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id),
  body            TEXT    NOT NULL,
  kind            TEXT    NOT NULL DEFAULT 'text' CHECK (kind IN ('text','system')),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

/* ---------- migrations (DB lama yang dibuat sebelum fitur admin) ---------- */
{
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!cols.includes('is_admin')) db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  if (!cols.includes('role')) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'");
  if (!cols.includes('verified')) db.exec('ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('title')) db.exec("ALTER TABLE users ADD COLUMN title TEXT NOT NULL DEFAULT ''");
  if (!cols.includes('blocked')) db.exec('ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('flagged')) db.exec('ALTER TABLE users ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('admin_pin')) db.exec('ALTER TABLE users ADD COLUMN admin_pin TEXT');
  if (!cols.includes('crm_note')) db.exec("ALTER TABLE users ADD COLUMN crm_note TEXT NOT NULL DEFAULT ''");
  if (!cols.includes('agent_status')) db.exec("ALTER TABLE users ADD COLUMN agent_status TEXT NOT NULL DEFAULT 'offline'");
  const ccols = db.prepare('PRAGMA table_info(conversations)').all().map((c) => c.name);
  if (!ccols.includes('assigned_to')) db.exec('ALTER TABLE conversations ADD COLUMN assigned_to INTEGER');
  if (!ccols.includes('tag')) db.exec("ALTER TABLE conversations ADD COLUMN tag TEXT NOT NULL DEFAULT ''");
  const mcols = db.prepare('PRAGMA table_info(messages)').all().map((c) => c.name);
  if (!mcols.includes('pinned')) db.exec('ALTER TABLE messages ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
  if (!mcols.includes('broadcast_id')) db.exec('ALTER TABLE messages ADD COLUMN broadcast_id INTEGER');
  if (!mcols.includes('buttons')) db.exec("ALTER TABLE messages ADD COLUMN buttons TEXT");
  const ucols2 = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!ucols2.includes('custom_fields')) db.exec("ALTER TABLE users ADD COLUMN custom_fields TEXT NOT NULL DEFAULT '{}'");
}
db.exec(`
CREATE TABLE IF NOT EXISTS transactions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id   INTEGER,
  amount     INTEGER NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS csat_ratings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  agent_id        INTEGER,
  user_id         INTEGER,
  rating          INTEGER NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
`);
db.exec(`
CREATE TABLE IF NOT EXISTS admin_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER,
  action     TEXT NOT NULL,
  target     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS admin_notes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  admin_id        INTEGER,
  body            TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS word_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS auto_rules (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  reply   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quick_replies (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS broadcasts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER,
  text       TEXT NOT NULL,
  target     TEXT NOT NULL DEFAULT 'all',
  status     TEXT NOT NULL DEFAULT 'sent',
  send_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS kv (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
`);
/* jika belum ada admin sama sekali (DB lama), angkat akun demo */
if (db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 1').get().n === 0) {
  db.exec("UPDATE users SET is_admin = 1 WHERE lower(username) = 'xerophisuser'");
}
/* upgrade role untuk DB lama: admin lama jadi 'super' */
db.exec("UPDATE users SET role = 'super' WHERE is_admin = 1 AND role = 'member'");

/* ============================================================
   OWNER PRIVILEGE — otomatisasi title "Developer Xerophis"
   Akun pall / noval / vall selalu owner + verified + title.
   ============================================================ */
const OWNER_USERNAMES = ['pall', 'noval', 'vall'];
function ensureOwners() {
  for (const u of OWNER_USERNAMES) {
    db.prepare(`UPDATE users SET role = 'owner', is_admin = 1, verified = 1, title = 'Developer Xerophis'
      WHERE lower(username) = ? AND (role != 'owner' OR verified != 1 OR title != 'Developer Xerophis')`).run(u);
  }
}
ensureOwners();

/* ---------- helpers ---------- */
const USER_FIELDS = 'id, username, display_name, phone, about, avatar_text, avatar_color, is_bot, is_official, is_admin, role, verified, title, blocked, flagged, agent_status, created_at';
const USER_FIELDS_U = USER_FIELDS.split(', ').map((c) => `u.${c}`).join(', ');

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    phone: row.phone,
    about: row.about,
    avatarText: row.avatar_text,
    avatarColor: row.avatar_color,
    isBot: !!row.is_bot,
    isOfficial: !!row.is_official,
    isAdmin: !!row.is_admin,
    role: row.role || 'member',
    verified: !!row.verified,
    title: row.title || '',
    blocked: !!row.blocked,
    flagged: !!row.flagged,
    agentStatus: row.agent_status || 'offline',
    createdAt: row.created_at,
  };
}

async function getUserById(id) {
  return publicUser(db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`).get(id));
}
async function getUserByUsername(username) {
  return publicUser(db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE lower(username) = lower(?)`).get(username));
}
async function createUser({ username, passwordHash, displayName, phone, about, avatarText, avatarColor, isBot, isOfficial, isAdmin }) {
  const info = db.prepare(
    `INSERT INTO users (username, password_hash, display_name, phone, about, avatar_text, avatar_color, is_bot, is_official, is_admin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(username, passwordHash, displayName, phone || '', about || 'Hey there! I am using Xerophis.',
        avatarText || (displayName || username).slice(0, 2).toUpperCase(),
        avatarColor || '#7a1216', isBot ? 1 : 0, isOfficial ? 1 : 0, isAdmin ? 1 : 0);
  return getUserById(Number(info.lastInsertRowid));
}
async function createSession(userId, token) {
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
}
async function getUserByToken(token) {
  const row = db.prepare(`SELECT ${USER_FIELDS_U} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).get(token);
  return publicUser(row);
}
async function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

async function createConversation({ type, title, about, createdBy, memberIds, roles }) {
  const info = db.prepare('INSERT INTO conversations (type, title, about, created_by) VALUES (?, ?, ?, ?)')
    .run(type, title || null, about || '', createdBy || null);
  const convId = Number(info.lastInsertRowid);
  const ins = db.prepare('INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, ?)');
  for (const uid of memberIds) ins.run(convId, uid, (roles && roles[uid]) || 'member');
  return convId;
}

function findPrivateConversation(userA, userB) {
  const rows = db.prepare(`
    SELECT c.id, c.type FROM conversations c
    JOIN conversation_members m ON m.conversation_id = c.id
    WHERE c.type = 'private'
    GROUP BY c.id
    HAVING SUM(m.user_id IN (?, ?)) = COUNT(m.user_id) AND COUNT(m.user_id) = ?
  `).all(userA, userB, userB ? 2 : 1);
  return rows[0] ? rows[0].id : null;
}

async function listConversationsFor(userId) {
  const rows = db.prepare(`
    SELECT c.id, c.type, c.title, c.about, m.favorite, m.muted, m.last_read_id,
           (SELECT body FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_body,
           (SELECT id FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_id,
           (SELECT sender_id FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_sender,
           (SELECT kind FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_kind,
           (SELECT created_at FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_at,
           (SELECT COUNT(*) FROM messages ms WHERE ms.conversation_id = c.id AND ms.id > m.last_read_id AND ms.sender_id != ?) AS unread
      FROM conversations c
      JOIN conversation_members m ON m.conversation_id = c.id
     WHERE m.user_id = ?
     ORDER BY COALESCE(last_id, 0) DESC, c.id DESC
  `).all(userId, userId);

  const out = [];
  for (const r of rows) {
    const members = db.prepare(`SELECT ${USER_FIELDS_U} FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ?`).all(r.id);
    let title = r.title;
    let avatarText = null; let avatarColor = null; let counterpart = null;
    if (r.type === 'private') {
      counterpart = members.find((u) => u.id !== userId) || null;
      if (counterpart) { title = counterpart.display_name; avatarText = counterpart.avatar_text; avatarColor = counterpart.avatar_color; }
      else { title = 'Anda'; const me = members.find((u) => u.id === userId); avatarText = me ? me.avatar_text : '•'; avatarColor = me ? me.avatar_color : '#7a1216'; }
    } else {
      const g = db.prepare('SELECT * FROM conversations WHERE id = ?').get(r.id);
      title = g.title;
      avatarText = (title || 'G').slice(0, 2).toUpperCase();
      avatarColor = '#5c0f13';
    }
    out.push({
      id: r.id, type: r.type, title,
      avatarText, avatarColor,
      memberCount: members.length,
      favorite: !!r.favorite, muted: !!r.muted,
      unread: r.unread,
      counterpart,
      lastMessage: r.last_id ? { id: r.last_id, body: r.last_body, senderId: r.last_sender, kind: r.last_kind, createdAt: r.last_at } : null,
    });
  }
  return out;
}

async function getConversation(id) {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) || null;
}
async function getMembers(conversationId) {
  const rows = db.prepare(`SELECT ${USER_FIELDS_U}, cm.role, cm.last_read_id FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ?`).all(conversationId);
  return rows.map((r) => ({ ...publicUser(r), role: r.role, lastReadId: r.last_read_id }));
}
async function isMember(conversationId, userId) {
  return !!db.prepare('SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?').get(conversationId, userId);
}
async function setLastRead(conversationId, userId, messageId) {
  db.prepare('UPDATE conversation_members SET last_read_id = MAX(last_read_id, ?) WHERE conversation_id = ? AND user_id = ?')
    .run(messageId, conversationId, userId);
}
async function setFavorite(conversationId, userId, favorite) {
  db.prepare('UPDATE conversation_members SET favorite = ? WHERE conversation_id = ? AND user_id = ?').run(favorite ? 1 : 0, conversationId, userId);
}

const parseButtons = (s) => { try { const b = JSON.parse(s || 'null'); return Array.isArray(b) ? b : null; } catch { return null; } };

async function insertMessage({ conversationId, senderId, body, kind, buttons }) {
  const info = db.prepare('INSERT INTO messages (conversation_id, sender_id, body, kind, buttons) VALUES (?, ?, ?, ?, ?)')
    .run(conversationId, senderId, body, kind || 'text', buttons && buttons.length ? JSON.stringify(buttons) : null);
  return getMessage(Number(info.lastInsertRowid));
}
async function getMessage(id) {
  const row = db.prepare(`SELECT m.*, u.display_name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`).get(id);
  if (!row) return null;
  return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, senderName: row.sender_name, body: row.body, kind: row.kind, buttons: parseButtons(row.buttons), createdAt: row.created_at };
}
async function listMessages(conversationId, limit = 200) {
  const rows = db.prepare(`SELECT m.*, u.display_name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? ORDER BY m.id DESC LIMIT ?`).all(conversationId, limit);
  return rows.reverse().map((r) => ({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, senderName: r.sender_name, body: r.body, kind: r.kind, buttons: parseButtons(r.buttons), createdAt: r.created_at }));
}
async function deleteMessage(id) {
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}
async function searchUsers(q, excludeId) {
  const rows = db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id != ? AND (lower(username) LIKE ? OR lower(display_name) LIKE ?) ORDER BY display_name LIMIT 30`)
    .all(excludeId, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
  return rows.map(publicUser);
}
async function allUsers(excludeId) {
  const rows = db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id != ? ORDER BY display_name LIMIT 50`).all(excludeId);
  return rows.map(publicUser);
}

/* ============================================================
   ADMIN (panel tersembunyi — role gate di server/admin.js)
   ============================================================ */
async function stats() {
  return {
    users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    bots: db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_bot = 1').get().n,
    admins: db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 1').get().n,
    conversations: db.prepare('SELECT COUNT(*) AS n FROM conversations').get().n,
    messages: db.prepare('SELECT COUNT(*) AS n FROM messages').get().n,
    sessions: db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n,
  };
}
async function adminListUsers(q) {
  const like = `%${String(q || '').toLowerCase()}%`;
  const rows = db.prepare(`SELECT ${USER_FIELDS}, custom_fields FROM users
    WHERE lower(username) LIKE ? OR lower(display_name) LIKE ?
    ORDER BY is_admin DESC, display_name LIMIT 100`).all(like, like);
  return rows.map((r) => { let cf = {}; try { cf = JSON.parse(r.custom_fields || '{}'); } catch {} return { ...publicUser(r), customFields: cf }; });
}
async function adminUpdateUser(id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of [['displayName', 'display_name'], ['about', 'about'], ['phone', 'phone'], ['crmNote', 'crm_note'], ['title', 'title'], ['role', 'role'], ['agentStatus', 'agent_status'], ['adminPin', 'admin_pin'], ['customFields', 'custom_fields']]) {
    if (patch[k] !== undefined) { sets.push(`${col} = ?`); params.push(patch[k] === null ? null : String(patch[k])); }
  }
  for (const [k, col] of [['isAdmin', 'is_admin'], ['isBot', 'is_bot'], ['verified', 'verified'], ['blocked', 'blocked'], ['flagged', 'flagged']]) {
    if (patch[k] !== undefined) { sets.push(`${col} = ?`); params.push(patch[k] ? 1 : 0); }
  }
  if (!sets.length) return getUserById(id);
  params.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getUserById(id);
}
function adminDeleteUser(id) {
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM messages WHERE sender_id = ?').run(id);
    db.prepare('DELETE FROM conversation_members WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    db.exec(`DELETE FROM messages WHERE conversation_id IN
      (SELECT c.id FROM conversations c LEFT JOIN conversation_members cm ON cm.conversation_id = c.id WHERE cm.conversation_id IS NULL)`);
    db.exec(`DELETE FROM conversations WHERE id NOT IN (SELECT conversation_id FROM conversation_members)`);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
async function adminListConversations() {
  const rows = db.prepare(`
    SELECT c.id, c.type, c.title,
      (SELECT COUNT(*) FROM conversation_members cm WHERE cm.conversation_id = c.id) AS members,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS msgs
    FROM conversations c ORDER BY c.id DESC LIMIT 200`).all();
  const out = [];
  for (const r of rows) {
    let label = r.title;
    if (r.type === 'private') {
      const names = db.prepare(`SELECT u.display_name AS n FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ?`).all(r.id).map((x) => x.n);
      label = names.length === 1 ? `${names[0]} (catatan)` : names.join(' & ');
    }
    out.push({ ...r, label });
  }
  return out;
}
function adminDeleteConversation(id) {
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
    db.prepare('DELETE FROM conversation_members WHERE conversation_id = ?').run(id);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
async function adminRecentMessages(limit = 60) {
  const rows = db.prepare(`
    SELECT m.id, m.body, m.kind, m.created_at, m.conversation_id, m.sender_id,
           u.display_name AS sender_name, c.type AS conv_type, c.title AS conv_title
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    JOIN conversations c ON c.id = m.conversation_id
    ORDER BY m.id DESC LIMIT ?`).all(limit);
  return rows;
}
async function allHumanUsers() {
  return db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE is_bot = 0`).all().map(publicUser);
}
function logAdmin(adminId, action, target = '') {
  db.prepare('INSERT INTO admin_logs (admin_id, action, target) VALUES (?, ?, ?)').run(adminId, action, target);
}
async function listAdminLogs(limit = 100) {
  const rows = db.prepare(`SELECT l.*, u.display_name AS admin_name FROM admin_logs l LEFT JOIN users u ON u.id = l.admin_id ORDER BY l.id DESC LIMIT ?`).all(limit);
  return rows;
}

/* ---------- inbox: assign / tag / notes / pin ---------- */
function assignConversation(conversationId, adminId) {
  db.prepare('UPDATE conversations SET assigned_to = ? WHERE id = ?').run(adminId || null, conversationId);
}
function setConversationTag(conversationId, tag) {
  db.prepare('UPDATE conversations SET tag = ? WHERE id = ?').run(String(tag || ''), conversationId);
}
function addNote(conversationId, adminId, body) {
  const info = db.prepare('INSERT INTO admin_notes (conversation_id, admin_id, body) VALUES (?, ?, ?)').run(conversationId, adminId, body);
  return db.prepare('SELECT n.*, u.display_name AS admin_name FROM admin_notes n LEFT JOIN users u ON u.id = n.admin_id WHERE n.id = ?').get(Number(info.lastInsertRowid));
}
function listNotes(conversationId) {
  return db.prepare('SELECT n.*, u.display_name AS admin_name FROM admin_notes n LEFT JOIN users u ON u.id = n.admin_id WHERE n.conversation_id = ? ORDER BY n.id DESC').all(conversationId);
}
function deleteNote(id) { db.prepare('DELETE FROM admin_notes WHERE id = ?').run(id); }
function setPinned(messageId, pinned) {
  db.prepare('UPDATE messages SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, messageId);
  return getMessage(messageId);
}
function lastPinned(conversationId) {
  return db.prepare('SELECT id, body, sender_id FROM messages WHERE conversation_id = ? AND pinned = 1 ORDER BY id DESC LIMIT 1').get(conversationId) || null;
}

/* ---------- moderasi: filter kata, block, flag ---------- */
function listFilters() { return db.prepare('SELECT * FROM word_filters ORDER BY id').all(); }
function addFilter(word) { db.prepare('INSERT OR IGNORE INTO word_filters (word) VALUES (?)').run(String(word).toLowerCase()); }
function deleteFilter(id) { db.prepare('DELETE FROM word_filters WHERE id = ?').run(id); }
function censorText(text) {
  const words = db.prepare('SELECT word FROM word_filters').all().map((r) => r.word).filter(Boolean);
  let out = text;
  for (const w of words) {
    if (!w) continue;
    out = out.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '♥');
  }
  return out;
}
function setUserBlocked(id, blocked) { db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(blocked ? 1 : 0, id); }
function setUserFlagged(id, flagged) { db.prepare('UPDATE users SET flagged = ? WHERE id = ?').run(flagged ? 1 : 0, id); }
function countRecentMessages(userId, seconds = 60) {
  return db.prepare(`SELECT COUNT(*) AS n FROM messages WHERE sender_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now',?)`)
    .get(userId, `-${seconds} seconds`).n;
}

/* ---------- otomasi: auto-reply & quick replies ---------- */
function listAutoRules() { return db.prepare('SELECT * FROM auto_rules ORDER BY id').all(); }
function addAutoRule(keyword, reply) {
  const info = db.prepare('INSERT INTO auto_rules (keyword, reply) VALUES (?, ?)').run(String(keyword).toLowerCase(), reply);
  return Number(info.lastInsertRowid);
}
function deleteAutoRule(id) { db.prepare('DELETE FROM auto_rules WHERE id = ?').run(id); }
function matchAutoRule(text) {
  const t = String(text).toLowerCase();
  return db.prepare('SELECT * FROM auto_rules').all().find((r) => r.keyword && t.includes(r.keyword)) || null;
}
function listQuickReplies() { return db.prepare('SELECT * FROM quick_replies ORDER BY id').all(); }
function addQuickReply(title, body) { db.prepare('INSERT INTO quick_replies (title, body) VALUES (?, ?)').run(title, body); }
function deleteQuickReply(id) { db.prepare('DELETE FROM quick_replies WHERE id = ?').run(id); }

/* ---------- broadcast terjadwal ---------- */
function createBroadcast(adminId, text, target, sendAt) {
  const info = db.prepare('INSERT INTO broadcasts (admin_id, text, target, status, send_at) VALUES (?, ?, ?, ?, ?)')
    .run(adminId, text, target || 'all', sendAt ? 'scheduled' : 'sent', sendAt || null);
  return Number(info.lastInsertRowid);
}
function dueBroadcasts() {
  return db.prepare(`SELECT * FROM broadcasts WHERE status = 'scheduled' AND send_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now')`).all();
}
function markBroadcast(id, status) { db.prepare('UPDATE broadcasts SET status = ? WHERE id = ?').run(status, id); }
function listBroadcasts() {
  return db.prepare(`
    SELECT b.*, u.display_name AS admin_name,
      (SELECT COUNT(*) FROM messages m WHERE m.broadcast_id = b.id) AS sent_count,
      (SELECT COUNT(*) FROM messages m
         JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id != m.sender_id AND cm.last_read_id >= m.id
        WHERE m.broadcast_id = b.id) AS read_count
    FROM broadcasts b LEFT JOIN users u ON u.id = b.admin_id ORDER BY b.id DESC LIMIT 50`).all();
}

/* ---------- kv (webhook, announcement) ---------- */
function kvGet(k) { const r = db.prepare('SELECT v FROM kv WHERE k = ?').get(k); return r ? r.v : null; }
function kvSet(k, v) { db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, v); }

/* ---------- sesi ---------- */
function listSessions() {
  return db.prepare(`SELECT s.token, s.created_at, u.id AS user_id, u.display_name, u.username
    FROM sessions s JOIN users u ON u.id = s.user_id ORDER BY s.created_at DESC LIMIT 100`).all();
}
function listSessionsFor(userId) {
  return db.prepare('SELECT token, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

/* ---------- analitik ---------- */
function analytics() {
  const perHour = Array(24).fill(0);
  for (const r of db.prepare(`SELECT CAST(strftime('%H', created_at) AS INTEGER) AS h, COUNT(*) AS n FROM messages GROUP BY h`).all()) perHour[r.h] = r.n;
  const agents = db.prepare(`
    SELECT u.id, u.display_name, u.role, u.agent_status,
      (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.kind = 'text') AS messages_sent,
      (SELECT COUNT(*) FROM conversations c WHERE c.assigned_to = u.id) AS assigned
    FROM users u WHERE u.is_admin = 1 OR u.is_bot = 1 ORDER BY messages_sent DESC`).all();
  const tagCounts = db.prepare(`SELECT tag, COUNT(*) AS n FROM conversations WHERE tag != '' GROUP BY tag`).all();
  const revenue = db.prepare('SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM transactions').get();
  const csat = db.prepare(`SELECT u.display_name AS agent, ROUND(AVG(r.rating),1) AS avg, COUNT(*) AS n
    FROM csat_ratings r LEFT JOIN users u ON u.id = r.agent_id GROUP BY r.agent_id`).all();
  return { perHour, agents, tagCounts, revenue, csat, response: responseStats() };
}
/* kecepatan respon agen: rata-rata jeda (menit) antara pesan masuk & balasan admin */
function responseStats() {
  const rows = db.prepare(`
    SELECT m.conversation_id AS c, m.sender_id AS s, u.is_admin AS adm, m.created_at AS t
    FROM messages m JOIN users u ON u.id = m.sender_id ORDER BY m.id ASC LIMIT 2000`).all();
  const acc = {}; const lastIn = {};
  for (const r of rows) {
    if (!r.adm) { lastIn[r.c] = Date.parse(r.t); continue; }
    if (lastIn[r.c]) {
      const dt = (Date.parse(r.t) - lastIn[r.c]) / 60000;
      if (dt >= 0) { (acc[r.s] = acc[r.s] || { sum: 0, n: 0 }); acc[r.s].sum += dt; acc[r.s].n += 1; }
      lastIn[r.c] = null;
    }
  }
  const out = [];
  for (const [id, v] of Object.entries(acc)) {
    const u = db.prepare('SELECT display_name FROM users WHERE id = ?').get(Number(id));
    out.push({ agent: u?.display_name || `#${id}`, avgMin: Math.round((v.sum / v.n) * 10) / 10, n: v.n });
  }
  return out;
}
/* segmentasi: pengguna yang punya percakapan ber-tag */
function usersInTag(tag) {
  return db.prepare(`SELECT DISTINCT cm.user_id AS id FROM conversation_members cm
    JOIN conversations c ON c.id = cm.conversation_id WHERE c.tag = ? AND c.tag != ''`).all(tag).map((r) => r.id);
}
/* ---------- keuangan & CSAT ---------- */
function addTransaction(userId, adminId, amount, note) {
  const info = db.prepare('INSERT INTO transactions (user_id, admin_id, amount, note) VALUES (?, ?, ?, ?)')
    .run(userId, adminId, Number(amount), note || '');
  return Number(info.lastInsertRowid);
}
function listTransactions(userId) {
  return db.prepare(`SELECT t.*, u.display_name AS admin_name FROM transactions t LEFT JOIN users u ON u.id = t.admin_id
    WHERE ? = 0 OR t.user_id = ? ORDER BY t.id DESC LIMIT 100`).all(userId || 0, userId || 0);
}
function recordRating(conversationId, agentId, userId, rating) {
  db.prepare('INSERT INTO csat_ratings (conversation_id, agent_id, user_id, rating) VALUES (?, ?, ?, ?)')
    .run(conversationId, agentId || null, userId, rating);
}

/* ---------- CSV kontak ---------- */
function usersCSV() {
  const rows = db.prepare(`SELECT ${USER_FIELDS} FROM users ORDER BY id`).all().map(publicUser);
  const head = 'id,username,display_name,phone,about,role,verified,blocked,created_at';
  const lines = rows.map((u) => [u.id, u.username, u.displayName, u.phone, u.about, u.role, u.verified ? 1 : 0, u.blocked ? 1 : 0, u.createdAt]
    .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  return [head, ...lines].join('\n');
}
function importUsersCSV(csv, passwordHash) {
  const lines = String(csv).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const head = lines.shift()?.split(',').map((h) => h.replace(/"/g, '').trim());
  if (!head || !head.includes('username') || !head.includes('display_name')) throw new Error('CSV butuh kolom username,display_name');
  let created = 0, skipped = 0;
  for (const line of lines) {
    const cells = [...line.matchAll(/"([^"]*)"|([^,]+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
    const get = (c) => cells[head.indexOf(c)] || '';
    const username = get('username').trim();
    if (!username || db.prepare('SELECT 1 FROM users WHERE lower(username) = lower(?)').get(username)) { skipped++; continue; }
    const dn = get('display_name').trim() || username;
    db.prepare(`INSERT INTO users (username, password_hash, display_name, phone, about, avatar_text, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(username, passwordHash, dn, get('phone'), get('about') || 'Hey there! I am using Xerophis.', dn.slice(0, 2).toUpperCase(), '#7a1216');
    created++;
  }
  return { created, skipped };
}

module.exports = {
  db, DB_PATH, OWNER_USERNAMES, ensureOwners,
  getUserById, getUserByUsername, createUser, createSession, getUserByToken, deleteSession,
  createConversation, findPrivateConversation, listConversationsFor, getConversation, getMembers,
  isMember, setLastRead, setFavorite, insertMessage, getMessage, listMessages, deleteMessage,
  searchUsers, allUsers,
  stats, adminListUsers, adminUpdateUser, adminDeleteUser, adminListConversations,
  adminDeleteConversation, adminRecentMessages, allHumanUsers, logAdmin, listAdminLogs,
  assignConversation, setConversationTag, addNote, listNotes, deleteNote, setPinned, lastPinned,
  listFilters, addFilter, deleteFilter, censorText, setUserBlocked, setUserFlagged, countRecentMessages,
  listAutoRules, addAutoRule, deleteAutoRule, matchAutoRule,
  listQuickReplies, addQuickReply, deleteQuickReply,
  createBroadcast, dueBroadcasts, markBroadcast, listBroadcasts,
  kvGet, kvSet, listSessions, listSessionsFor, analytics, usersCSV, importUsersCSV,
  addTransaction, listTransactions, recordRating, usersInTag,
};
