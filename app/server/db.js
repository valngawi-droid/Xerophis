'use strict';
/**
 * Xerophis — storage layer (async, engine-agnostic).
 * DB_DRIVER=sqlite (default, node:sqlite) | postgres (pg via DATABASE_URL).
 */
const path = require('node:path');
const fs = require('node:fs');

const DRIVER = process.env.DB_DRIVER || 'sqlite';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'xerophis.db');

let db;
if (DRIVER === 'postgres') {
  db = require('./pgwrap').open(process.env.DATABASE_URL || 'postgres://xerophis:xerophis@localhost:5432/xerophis');
} else {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = require('./sqlwrap').open(DB_PATH);
}

const SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT,
  display_name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', about TEXT NOT NULL DEFAULT 'Hey there! I am using Xerophis.',
  avatar_text TEXT NOT NULL, avatar_color TEXT NOT NULL DEFAULT '#7a1216', avatar_url TEXT, is_bot INTEGER NOT NULL DEFAULT 0,
  is_official INTEGER NOT NULL DEFAULT 0, is_admin INTEGER NOT NULL DEFAULT 0, role TEXT NOT NULL DEFAULT 'member',
  verified INTEGER NOT NULL DEFAULT 0, title TEXT NOT NULL DEFAULT '', blocked INTEGER NOT NULL DEFAULT 0,
  flagged INTEGER NOT NULL DEFAULT 0, agent_status TEXT NOT NULL DEFAULT 'offline', custom_fields TEXT NOT NULL DEFAULT '{}',
  shift_start TEXT NOT NULL DEFAULT '', shift_end TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, device TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL CHECK (type IN ('private','group')), title TEXT, about TEXT NOT NULL DEFAULT '', created_by INTEGER REFERENCES users(id), assigned_to INTEGER, tag TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS conversation_members (conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'member', favorite INTEGER NOT NULL DEFAULT 0, muted INTEGER NOT NULL DEFAULT 0, last_read_id INTEGER NOT NULL DEFAULT 0, joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (conversation_id, user_id));
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, sender_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','system')), pinned INTEGER NOT NULL DEFAULT 0, broadcast_id INTEGER, buttons TEXT, media_id INTEGER, reply_to INTEGER, forwarded INTEGER NOT NULL DEFAULT 0, edited INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS admin_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER, action TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS admin_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, admin_id INTEGER, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS word_filters (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS auto_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, keyword TEXT NOT NULL, reply TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS quick_replies (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS broadcasts (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER, text TEXT NOT NULL, target TEXT NOT NULL DEFAULT 'all', status TEXT NOT NULL DEFAULT 'sent', send_at TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS message_stars (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (user_id, message_id));
CREATE TABLE IF NOT EXISTS statuses (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS status_views (status_id INTEGER NOT NULL REFERENCES statuses(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (status_id, user_id));
CREATE TABLE IF NOT EXISTS channels (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, about TEXT NOT NULL DEFAULT '', created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS channel_followers (channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, last_read_post INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (channel_id, user_id));
CREATE TABLE IF NOT EXISTS channel_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE, author_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS communities (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, about TEXT NOT NULL DEFAULT '', created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS community_members (community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (community_id, user_id));
CREATE TABLE IF NOT EXISTS community_groups (community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, PRIMARY KEY (community_id, conversation_id));
CREATE TABLE IF NOT EXISTS calls (id INTEGER PRIMARY KEY AUTOINCREMENT, caller_id INTEGER NOT NULL REFERENCES users(id), callee_id INTEGER NOT NULL REFERENCES users(id), kind TEXT NOT NULL DEFAULT 'voice', status TEXT NOT NULL DEFAULT 'offered', started_at TEXT, ended_at TEXT, duration_sec INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS message_reactions (message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, emoji TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (message_id, user_id));
CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, admin_id INTEGER, amount INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS csat_ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, agent_id INTEGER, user_id INTEGER, rating INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS user_blocks (blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), PRIMARY KEY (blocker_id, blocked_id));
`;

const ready = (async () => {
  if (db.engine === 'postgres') {
    await db.exec(require('./pgwrap').PG_DDL);
  } else {
    await db.exec(SQLITE_DDL);
    const cols = (await db.prepare('PRAGMA table_info(users)').all()).map((c) => c.name);
    const alters = [
      ['is_admin', "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"],
      ['role', "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'"],
      ['verified', 'ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0'],
      ['title', "ALTER TABLE users ADD COLUMN title TEXT NOT NULL DEFAULT ''"],
      ['blocked', 'ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0'],
      ['flagged', 'ALTER TABLE users ADD COLUMN flagged INTEGER NOT NULL DEFAULT 0'],
      ['admin_pin', 'ALTER TABLE users ADD COLUMN admin_pin TEXT'],
      ['crm_note', "ALTER TABLE users ADD COLUMN crm_note TEXT NOT NULL DEFAULT ''"],
      ['agent_status', "ALTER TABLE users ADD COLUMN agent_status TEXT NOT NULL DEFAULT 'offline'"],
      ['custom_fields', "ALTER TABLE users ADD COLUMN custom_fields TEXT NOT NULL DEFAULT '{}'"],
      ['shift_start', "ALTER TABLE users ADD COLUMN shift_start TEXT NOT NULL DEFAULT ''"],
      ['shift_end', "ALTER TABLE users ADD COLUMN shift_end TEXT NOT NULL DEFAULT ''"],
    ];
    for (const [c, sql] of alters) if (!cols.includes(c)) await db.exec(sql);
    const ccols = (await db.prepare('PRAGMA table_info(conversations)').all()).map((c) => c.name);
    if (!ccols.includes('assigned_to')) await db.exec('ALTER TABLE conversations ADD COLUMN assigned_to INTEGER');
    if (!ccols.includes('tag')) await db.exec("ALTER TABLE conversations ADD COLUMN tag TEXT NOT NULL DEFAULT ''");
    const mcols = (await db.prepare('PRAGMA table_info(messages)').all()).map((c) => c.name);
    if (!mcols.includes('pinned')) await db.exec('ALTER TABLE messages ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0');
    if (!mcols.includes('broadcast_id')) await db.exec('ALTER TABLE messages ADD COLUMN broadcast_id INTEGER');
    if (!mcols.includes('buttons')) await db.exec('ALTER TABLE messages ADD COLUMN buttons TEXT');
    if (!mcols.includes('media_id')) await db.exec('ALTER TABLE messages ADD COLUMN media_id INTEGER');
    if (!mcols.includes('reply_to')) await db.exec('ALTER TABLE messages ADD COLUMN reply_to INTEGER');
    if (!mcols.includes('forwarded')) await db.exec('ALTER TABLE messages ADD COLUMN forwarded INTEGER NOT NULL DEFAULT 0');
  if (!mcols.includes('edited')) await db.exec('ALTER TABLE messages ADD COLUMN edited INTEGER NOT NULL DEFAULT 0');
    if (!mcols.includes('enc')) await db.exec('ALTER TABLE messages ADD COLUMN enc INTEGER NOT NULL DEFAULT 0');
  }
  const ucols3 = db.engine === 'sqlite' ? (await db.prepare('PRAGMA table_info(users)').all()).map((c) => c.name) : [];
  if (db.engine === 'sqlite') {
    if (!ucols3.includes('email')) await db.exec('ALTER TABLE users ADD COLUMN email TEXT');
    if (!ucols3.includes('pubkey')) await db.exec('ALTER TABLE users ADD COLUMN pubkey TEXT');
  }
  const scols = db.engine === 'sqlite' ? (await db.prepare('PRAGMA table_info(sessions)').all()).map((c) => c.name) : [];
  if (db.engine === 'sqlite' && !scols.includes('device')) await db.exec("ALTER TABLE sessions ADD COLUMN device TEXT NOT NULL DEFAULT ''");
  if (db.engine === 'sqlite' && !ucols3.includes('avatar_url')) await db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
  await db.exec(`
CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY ${db.engine === 'postgres' ? 'GENERATED BY DEFAULT AS IDENTITY' : 'AUTOINCREMENT'},
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS push_subs (
  id INTEGER PRIMARY KEY ${db.engine === 'postgres' ? 'GENERATED BY DEFAULT AS IDENTITY' : 'AUTOINCREMENT'},
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  sub_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users(lower(email)) WHERE email IS NOT NULL;
`);
  if ((await db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 1').get()).n === 0) {
    await db.prepare("UPDATE users SET is_admin = 1 WHERE lower(username) = 'xerophisuser'").run();
  }
  await db.prepare("UPDATE users SET role = 'super' WHERE is_admin = 1 AND role = 'member'").run();
})();

/* ============================================================
   OWNER PRIVILEGE — otomatisasi title "Developer Xerophis"
   ============================================================ */
const OWNER_USERNAMES = ['pall', 'noval', 'vall'];
async function ensureOwners() {
  for (const u of OWNER_USERNAMES) {
    await db.prepare(`UPDATE users SET role = 'owner', is_admin = 1, verified = 1, title = 'Developer Xerophis'
      WHERE lower(username) = ? AND (role != 'owner' OR verified != 1 OR title != 'Developer Xerophis')`).run(u);
  }
}

/* ---------- helpers ---------- */
const USER_FIELDS = 'id, username, display_name, phone, about, avatar_text, avatar_color, avatar_url, is_bot, is_official, is_admin, role, verified, title, blocked, flagged, agent_status, created_at';
const USER_FIELDS_U = USER_FIELDS.split(', ').map((c) => `u.${c}`).join(', ');

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id, username: row.username, displayName: row.display_name, phone: row.phone, about: row.about,
    avatarText: row.avatar_text, avatarColor: row.avatar_color, avatarUrl: row.avatar_url || null, isBot: !!row.is_bot, isOfficial: !!row.is_official,
    isAdmin: !!row.is_admin, role: row.role || 'member', verified: !!row.verified, title: row.title || '',
    blocked: !!row.blocked, flagged: !!row.flagged, agentStatus: row.agent_status || 'offline', createdAt: row.created_at,
  };
}

async function getUserById(id) { return publicUser(await db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`).get(id)); }
async function getUserByUsername(username) { return publicUser(await db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE lower(username) = lower(?)`).get(username)); }
async function createUser({ username, passwordHash, displayName, phone, about, avatarText, avatarColor, isBot, isOfficial, isAdmin }) {
  const info = await db.prepare(
    `INSERT INTO users (username, password_hash, display_name, phone, about, avatar_text, avatar_color, is_bot, is_official, is_admin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(username, passwordHash, displayName, phone || '', about || 'Hey there! I am using Xerophis.',
      avatarText || (displayName || username).slice(0, 2).toUpperCase(), avatarColor || '#7a1216', isBot ? 1 : 0, isOfficial ? 1 : 0, isAdmin ? 1 : 0);
  return getUserById(Number(info.lastInsertRowid));
}
async function createSession(userId, token, device = '') { await db.prepare('INSERT INTO sessions (token, user_id, device) VALUES (?, ?, ?)').run(token, userId, device); }
async function getUserByToken(token) {
  const row = await db.prepare(`SELECT ${USER_FIELDS_U} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).get(token);
  return publicUser(row);
}
async function deleteSession(token) { await db.prepare('DELETE FROM sessions WHERE token = ?').run(token); }

async function createConversation({ type, title, about, createdBy, memberIds, roles }) {
  const info = await db.prepare('INSERT INTO conversations (type, title, about, created_by) VALUES (?, ?, ?, ?)')
    .run(type, title || null, about || '', createdBy || null);
  const convId = Number(info.lastInsertRowid);
  for (const uid of memberIds) await db.prepare('INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, ?)').run(convId, uid, (roles && roles[uid]) || 'member');
  return convId;
}

async function findPrivateConversation(userA, userB) {
  const rows = await db.prepare(`
    SELECT c.id, c.type FROM conversations c
    JOIN conversation_members m ON m.conversation_id = c.id
    WHERE c.type = 'private'
    GROUP BY c.id, c.type
    HAVING SUM(CASE WHEN m.user_id IN (?, ?) THEN 1 ELSE 0 END) = COUNT(m.user_id) AND COUNT(m.user_id) = ?
  `).all(userA, userB, userB ? 2 : 1);
  return rows[0] ? rows[0].id : null;
}

async function listConversationsFor(userId) {
  const rows = await db.prepare(`
    SELECT c.id, c.type, c.title, c.about, m.favorite, m.muted, m.last_read_id,
           (SELECT body FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_body,
           (SELECT id FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_id,
           (SELECT sender_id FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_sender,
           (SELECT kind FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_kind,
           (SELECT created_at FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_at,
           (SELECT enc FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1) AS last_enc,
           (SELECT COUNT(*) FROM messages ms WHERE ms.conversation_id = c.id AND ms.id > m.last_read_id AND ms.sender_id != ?) AS unread
      FROM conversations c
      JOIN conversation_members m ON m.conversation_id = c.id
     WHERE m.user_id = ?
     ORDER BY COALESCE((SELECT id FROM messages ms WHERE ms.conversation_id = c.id ORDER BY ms.id DESC LIMIT 1), 0) DESC, c.id DESC
  `).all(userId, userId);

  const out = [];
  for (const r of rows) {
    const members = (await db.prepare(`SELECT ${USER_FIELDS_U} FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ?`).all(r.id)).map(publicUser);
    let title = r.title; let avatarText = null; let avatarColor = null; let counterpart = null;
    if (r.type === 'private') {
      counterpart = members.find((u) => u.id !== userId) || null;
      if (counterpart) { title = counterpart.displayName; avatarText = counterpart.avatarText; avatarColor = counterpart.avatarColor; }
      else { title = 'Anda'; const me = members.find((u) => u.id === userId); avatarText = me ? me.avatarText : '•'; avatarColor = me ? me.avatarColor : '#7a1216'; }
    } else {
      const g = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(r.id);
      title = g.title;
      avatarText = (title || 'G').slice(0, 2).toUpperCase();
      avatarColor = '#5c0f13';
    }
    out.push({
      id: r.id, type: r.type, title, avatarText, avatarColor, memberCount: members.length,
      favorite: !!r.favorite, muted: !!r.muted, unread: r.unread, counterpart,
      lastMessage: r.last_id ? { id: r.last_id, body: r.last_body, senderId: r.last_sender, kind: r.last_kind, enc: !!r.last_enc, createdAt: r.last_at } : null,
    });
  }
  return out;
}

async function getConversation(id) { return (await db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)) || null; }
async function getMembers(conversationId) {
  const rows = await db.prepare(`SELECT ${USER_FIELDS_U}, cm.role, cm.last_read_id FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ?`).all(conversationId);
  return rows.map((r) => ({ ...publicUser(r), role: r.role, lastReadId: r.last_read_id }));
}
async function isMember(conversationId, userId) {
  return !!(await db.prepare('SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?').get(conversationId, userId));
}
async function setLastRead(conversationId, userId, messageId) {
  await db.prepare('UPDATE conversation_members SET last_read_id = CASE WHEN ? > last_read_id THEN ? ELSE last_read_id END WHERE conversation_id = ? AND user_id = ?').run(messageId, messageId, conversationId, userId);
}
async function setFavorite(conversationId, userId, favorite) {
  await db.prepare('UPDATE conversation_members SET favorite = ? WHERE conversation_id = ? AND user_id = ?').run(favorite ? 1 : 0, conversationId, userId);
}
async function setMuted(conversationId, userId, muted) {
  await db.prepare('UPDATE conversation_members SET muted = ? WHERE conversation_id = ? AND user_id = ?').run(muted ? 1 : 0, conversationId, userId);
}
async function getMuted(conversationId, userId) {
  const r = await db.prepare('SELECT muted FROM conversation_members WHERE conversation_id = ? AND user_id = ?').get(conversationId, userId);
  return !!r?.muted;
}

const parseButtons = (s) => { try { const b = JSON.parse(s || 'null'); return Array.isArray(b) ? b : null; } catch { return null; } };

async function reactionsMapFor(ids) {
  if (!ids.length) return {};
  const rows = await db.prepare(`SELECT r.message_id, r.emoji, u.display_name AS name FROM message_reactions r JOIN users u ON u.id = r.user_id
    WHERE r.message_id IN (${ids.map(() => '?').join(',')}) ORDER BY r.created_at`).all(...ids);
  const map = {};
  for (const r of rows) (map[r.message_id] = map[r.message_id] || []).push({ emoji: r.emoji, name: r.name });
  return map;
}
const msgShape = (r, reactions) => ({
  id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, senderName: r.sender_name,
  body: r.body, kind: r.kind, buttons: parseButtons(r.buttons), mediaId: r.media_id || null, mediaMime: r.media_mime || null,
  replyTo: r.reply_to || null, forwarded: !!r.forwarded, pinned: !!r.pinned, enc: !!r.enc, edited: !!r.edited,
  reactions: reactions?.[r.id] || [], createdAt: r.created_at,
});
async function insertMessage({ conversationId, senderId, body, kind, buttons, mediaId, replyTo, forwarded, enc }) {
  const info = await db.prepare('INSERT INTO messages (conversation_id, sender_id, body, kind, buttons, media_id, reply_to, forwarded, enc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(conversationId, senderId, body, kind || 'text', buttons && buttons.length ? JSON.stringify(buttons) : null, mediaId || null, replyTo || null, forwarded ? 1 : 0, enc ? 1 : 0);
  return getMessage(Number(info.lastInsertRowid));
}
async function getMessage(id) {
  const row = await db.prepare(`SELECT m.*, u.display_name AS sender_name, md.mime AS media_mime FROM messages m JOIN users u ON u.id = m.sender_id LEFT JOIN media md ON md.id = m.media_id WHERE m.id = ?`).get(id);
  if (!row) return null;
  return msgShape(row, await reactionsMapFor([row.id]));
}
async function listMessages(conversationId, limit = 200) {
  const rows = await db.prepare(`SELECT m.*, u.display_name AS sender_name, md.mime AS media_mime FROM messages m JOIN users u ON u.id = m.sender_id LEFT JOIN media md ON md.id = m.media_id
    WHERE m.conversation_id = ? ORDER BY m.id DESC LIMIT ?`).all(conversationId, limit);
  const ordered = rows.reverse();
  const reactions = await reactionsMapFor(ordered.map((r) => r.id));
  return ordered.map((r) => msgShape(r, reactions));
}
async function deleteMessage(id) { await db.prepare('DELETE FROM messages WHERE id = ?').run(id); }
async function searchUsers(q, excludeId) {
  const rows = await db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id != ? AND (lower(username) LIKE ? OR lower(display_name) LIKE ?) ORDER BY display_name LIMIT 30`)
    .all(excludeId, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
  return rows.map(publicUser);
}
async function allUsers(excludeId) {
  const rows = await db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id != ? ORDER BY display_name LIMIT 50`).all(excludeId);
  return rows.map(publicUser);
}

/* ---------- admin ---------- */
async function stats() {
  return {
    users: (await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n,
    bots: (await db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_bot = 1').get()).n,
    admins: (await db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 1').get()).n,
    conversations: (await db.prepare('SELECT COUNT(*) AS n FROM conversations').get()).n,
    messages: (await db.prepare('SELECT COUNT(*) AS n FROM messages').get()).n,
    sessions: (await db.prepare('SELECT COUNT(*) AS n FROM sessions').get()).n,
  };
}
async function adminListUsers(q) {
  const like = `%${String(q || '').toLowerCase()}%`;
  const rows = await db.prepare(`SELECT ${USER_FIELDS}, custom_fields, shift_start, shift_end FROM users
    WHERE lower(username) LIKE ? OR lower(display_name) LIKE ?
    ORDER BY is_admin DESC, display_name LIMIT 100`).all(like, like);
  return rows.map((r) => { let cf = {}; try { cf = JSON.parse(r.custom_fields || '{}'); } catch {} return { ...publicUser(r), customFields: cf, shiftStart: r.shift_start || '', shiftEnd: r.shift_end || '' }; });
}
async function adminUpdateUser(id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of [['displayName', 'display_name'], ['about', 'about'], ['phone', 'phone'], ['crmNote', 'crm_note'], ['title', 'title'], ['role', 'role'], ['agentStatus', 'agent_status'], ['adminPin', 'admin_pin'], ['customFields', 'custom_fields'], ['shiftStart', 'shift_start'], ['shiftEnd', 'shift_end']]) {
    if (patch[k] !== undefined) { sets.push(`${col} = ?`); params.push(patch[k] === null ? null : String(patch[k])); }
  }
  for (const [k, col] of [['isAdmin', 'is_admin'], ['isBot', 'is_bot'], ['verified', 'verified'], ['blocked', 'blocked'], ['flagged', 'flagged']]) {
    if (patch[k] !== undefined) { sets.push(`${col} = ?`); params.push(patch[k] ? 1 : 0); }
  }
  if (!sets.length) return getUserById(id);
  params.push(id);
  await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getUserById(id);
}
async function adminDeleteUser(id) {
  await db.tx(async (q) => {
    await q.run('DELETE FROM messages WHERE sender_id = ?', id);
    await q.run('DELETE FROM conversation_members WHERE user_id = ?', id);
    await q.run('DELETE FROM sessions WHERE user_id = ?', id);
    await q.run('DELETE FROM users WHERE id = ?', id);
    await q.run(`DELETE FROM messages WHERE conversation_id IN
      (SELECT c.id FROM conversations c LEFT JOIN conversation_members cm ON cm.conversation_id = c.id WHERE cm.conversation_id IS NULL)`);
    await q.run(`DELETE FROM conversations WHERE id NOT IN (SELECT conversation_id FROM conversation_members)`);
  });
}
async function adminListConversations() {
  const rows = await db.prepare(`
    SELECT c.id, c.type, c.title,
      (SELECT COUNT(*) FROM conversation_members cm WHERE cm.conversation_id = c.id) AS members,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS msgs
    FROM conversations c ORDER BY c.id DESC LIMIT 200`).all();
  const out = [];
  for (const r of rows) {
    let label = r.title;
    if (r.type === 'private') {
      const names = (await db.prepare(`SELECT u.display_name AS n FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ?`).all(r.id)).map((x) => x.n);
      label = names.length === 1 ? `${names[0]} (catatan)` : names.join(' & ');
    }
    out.push({ ...r, label });
  }
  return out;
}
async function adminDeleteConversation(id) {
  await db.tx(async (q) => {
    await q.run('DELETE FROM messages WHERE conversation_id = ?', id);
    await q.run('DELETE FROM conversation_members WHERE conversation_id = ?', id);
    await q.run('DELETE FROM conversations WHERE id = ?', id);
  });
}
async function adminRecentMessages(limit = 60) {
  return db.prepare(`
    SELECT m.id, m.body, m.kind, m.created_at, m.conversation_id, m.sender_id,
           u.display_name AS sender_name, c.type AS conv_type, c.title AS conv_title
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    JOIN conversations c ON c.id = m.conversation_id
    ORDER BY m.id DESC LIMIT ?`).all(limit);
}
async function allHumanUsers() {
  return (await db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE is_bot = 0`).all()).map(publicUser);
}
async function logAdmin(adminId, action, target = '') {
  await db.prepare('INSERT INTO admin_logs (admin_id, action, target) VALUES (?, ?, ?)').run(adminId, action, target);
}
async function listAdminLogs(limit = 100) {
  return db.prepare(`SELECT l.*, u.display_name AS admin_name FROM admin_logs l LEFT JOIN users u ON u.id = l.admin_id ORDER BY l.id DESC LIMIT ?`).all(limit);
}

/* ---------- inbox ---------- */
async function assignConversation(conversationId, adminId) {
  await db.prepare('UPDATE conversations SET assigned_to = ? WHERE id = ?').run(adminId || null, conversationId);
}
async function setConversationTag(conversationId, tag) {
  await db.prepare('UPDATE conversations SET tag = ? WHERE id = ?').run(String(tag || ''), conversationId);
}
async function addNote(conversationId, adminId, body) {
  const info = await db.prepare('INSERT INTO admin_notes (conversation_id, admin_id, body) VALUES (?, ?, ?)').run(conversationId, adminId, body);
  return db.prepare('SELECT n.*, u.display_name AS admin_name FROM admin_notes n LEFT JOIN users u ON u.id = n.admin_id WHERE n.id = ?').get(Number(info.lastInsertRowid));
}
async function listNotes(conversationId) {
  return db.prepare('SELECT n.*, u.display_name AS admin_name FROM admin_notes n LEFT JOIN users u ON u.id = n.admin_id WHERE n.conversation_id = ? ORDER BY n.id DESC').all(conversationId);
}
async function deleteNote(id) { await db.prepare('DELETE FROM admin_notes WHERE id = ?').run(id); }
async function setPinned(messageId, pinned) {
  await db.prepare('UPDATE messages SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, messageId);
  return getMessage(messageId);
}
async function lastPinned(conversationId) {
  return (await db.prepare('SELECT id, body, sender_id FROM messages WHERE conversation_id = ? AND pinned = 1 ORDER BY id DESC LIMIT 1').get(conversationId)) || null;
}

/* ---------- moderasi ---------- */
async function listFilters() { return db.prepare('SELECT * FROM word_filters ORDER BY id').all(); }
async function addFilter(word) { await db.prepare('INSERT OR IGNORE INTO word_filters (word) VALUES (?)').run(String(word).toLowerCase()); }
async function deleteFilter(id) { await db.prepare('DELETE FROM word_filters WHERE id = ?').run(id); }
async function censorText(text) {
  const words = (await db.prepare('SELECT word FROM word_filters').all()).map((r) => r.word).filter(Boolean);
  let out = text;
  for (const w of words) {
    if (!w) continue;
    out = out.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '♥');
  }
  if ((await kvGet('block_links')) === '1') out = out.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, '♥');
  return out;
}
async function setUserBlocked(id, blocked) { await db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(blocked ? 1 : 0, id); }
async function setUserFlagged(id, flagged) { await db.prepare('UPDATE users SET flagged = ? WHERE id = ?').run(flagged ? 1 : 0, id); }
async function countRecentMessages(userId, seconds = 60) {
  return (await db.prepare(`SELECT COUNT(*) AS n FROM messages WHERE sender_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now',?)`).get(userId, `-${seconds} seconds`)).n;
}
async function sameBodySpread(userId, body, minutes = 5) {
  return (await db.prepare(`SELECT COUNT(DISTINCT conversation_id) AS n FROM messages
    WHERE sender_id = ? AND body = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now',?)`).get(userId, body, `-${minutes} minutes`)).n;
}

/* ---------- otomasi ---------- */
async function listAutoRules() { return db.prepare('SELECT * FROM auto_rules ORDER BY id').all(); }
async function addAutoRule(keyword, reply) {
  const info = await db.prepare('INSERT INTO auto_rules (keyword, reply) VALUES (?, ?)').run(String(keyword).toLowerCase(), reply);
  return Number(info.lastInsertRowid);
}
async function deleteAutoRule(id) { await db.prepare('DELETE FROM auto_rules WHERE id = ?').run(id); }
async function matchAutoRule(text) {
  const t = String(text).toLowerCase();
  return (await db.prepare('SELECT * FROM auto_rules').all()).find((r) => r.keyword && t.includes(r.keyword)) || null;
}
async function listQuickReplies() { return db.prepare('SELECT * FROM quick_replies ORDER BY id').all(); }
async function addQuickReply(title, body) { await db.prepare('INSERT INTO quick_replies (title, body) VALUES (?, ?)').run(title, body); }
async function deleteQuickReply(id) { await db.prepare('DELETE FROM quick_replies WHERE id = ?').run(id); }

/* ---------- broadcast ---------- */
async function createBroadcast(adminId, text, target, sendAt) {
  const info = await db.prepare('INSERT INTO broadcasts (admin_id, text, target, status, send_at) VALUES (?, ?, ?, ?, ?)')
    .run(adminId, text, target || 'all', sendAt ? 'scheduled' : 'sent', sendAt || null);
  return Number(info.lastInsertRowid);
}
async function dueBroadcasts() {
  return db.prepare(`SELECT * FROM broadcasts WHERE status = 'scheduled' AND send_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now')`).all();
}
async function markBroadcast(id, status) { await db.prepare('UPDATE broadcasts SET status = ? WHERE id = ?').run(status, id); }
async function listBroadcasts() {
  return db.prepare(`
    SELECT b.*, u.display_name AS admin_name,
      (SELECT COUNT(*) FROM messages m WHERE m.broadcast_id = b.id) AS sent_count,
      (SELECT COUNT(*) FROM messages m
         JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id != m.sender_id AND cm.last_read_id >= m.id
        WHERE m.broadcast_id = b.id) AS read_count
    FROM broadcasts b LEFT JOIN users u ON u.id = b.admin_id ORDER BY b.id DESC LIMIT 50`).all();
}

/* ---------- kv ---------- */
async function kvGet(k) { const r = await db.prepare('SELECT v FROM kv WHERE k = ?').get(k); return r ? r.v : null; }
async function kvSet(k, v) { await db.prepare('INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, v); }

/* ---------- sesi ---------- */
async function listSessions() {
  return db.prepare(`SELECT s.token, s.created_at, u.id AS user_id, u.display_name, u.username
    FROM sessions s JOIN users u ON u.id = s.user_id ORDER BY s.created_at DESC LIMIT 100`).all();
}
async function listSessionsFor(userId) {
  return db.prepare('SELECT token, device, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

/* ---------- analitik ---------- */
async function analytics() {
  const perHour = Array(24).fill(0);
  for (const r of await db.prepare(`SELECT CAST(strftime('%H', created_at) AS INTEGER) AS h, COUNT(*) AS n FROM messages GROUP BY h`).all()) perHour[r.h] = r.n;
  const agents = await db.prepare(`
    SELECT u.id, u.display_name, u.role, u.agent_status,
      (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.kind = 'text') AS messages_sent,
      (SELECT COUNT(*) FROM conversations c WHERE c.assigned_to = u.id) AS assigned
    FROM users u WHERE u.is_admin = 1 OR u.is_bot = 1 ORDER BY messages_sent DESC`).all();
  const tagCounts = await db.prepare(`SELECT tag, COUNT(*) AS n FROM conversations WHERE tag != '' GROUP BY tag`).all();
  const revenue = await db.prepare('SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS n FROM transactions').get();
  const csat = await db.prepare(`SELECT u.display_name AS agent, ROUND(AVG(r.rating),1) AS avg, COUNT(*) AS n
    FROM csat_ratings r LEFT JOIN users u ON u.id = r.agent_id GROUP BY r.agent_id, u.display_name`).all();
  return { perHour, agents, tagCounts, revenue, csat, response: await responseStats() };
}
async function responseStats() {
  const rows = await db.prepare(`
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
    const u = await db.prepare('SELECT display_name FROM users WHERE id = ?').get(Number(id));
    out.push({ agent: u?.display_name || `#${id}`, avgMin: Math.round((v.sum / v.n) * 10) / 10, n: v.n });
  }
  return out;
}
async function usersInTag(tag) {
  return (await db.prepare(`SELECT DISTINCT cm.user_id AS id FROM conversation_members cm
    JOIN conversations c ON c.id = cm.conversation_id WHERE c.tag = ? AND c.tag != ''`).all(tag)).map((r) => r.id);
}

/* ---------- keuangan & CSAT ---------- */
async function addTransaction(userId, adminId, amount, note) {
  const info = await db.prepare('INSERT INTO transactions (user_id, admin_id, amount, note) VALUES (?, ?, ?, ?)').run(userId, adminId, Number(amount), note || '');
  return Number(info.lastInsertRowid);
}
async function listTransactions(userId) {
  return db.prepare(`SELECT t.*, u.display_name AS admin_name FROM transactions t LEFT JOIN users u ON u.id = t.admin_id
    WHERE CAST(? AS INTEGER) = 0 OR t.user_id = ? ORDER BY t.id DESC LIMIT 100`).all(userId || 0, userId || 0);
}
async function recordRating(conversationId, agentId, userId, rating) {
  await db.prepare('INSERT INTO csat_ratings (conversation_id, agent_id, user_id, rating) VALUES (?, ?, ?, ?)').run(conversationId, agentId || null, userId, rating);
}

/* ---------- starred ---------- */
async function toggleStar(userId, messageId, on) {
  if (on) await db.prepare('INSERT OR IGNORE INTO message_stars (user_id, message_id) VALUES (?, ?)').run(userId, messageId);
  else await db.prepare('DELETE FROM message_stars WHERE user_id = ? AND message_id = ?').run(userId, messageId);
}
async function isStarred(userId, messageId) {
  return !!(await db.prepare('SELECT 1 FROM message_stars WHERE user_id = ? AND message_id = ?').get(userId, messageId));
}
async function listStarred(userId) {
  return db.prepare(`SELECT s.message_id AS id, m.body, m.created_at, u.display_name AS sender_name, m.conversation_id, c.type AS conv_type, c.title AS conv_title
    FROM message_stars s
    JOIN messages m ON m.id = s.message_id
    JOIN users u ON u.id = m.sender_id
    JOIN conversations c ON c.id = m.conversation_id
    WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 100`).all(userId);
}

/* ---------- reactions ---------- */
async function setReaction(messageId, userId, emoji) {
  if (emoji) await db.prepare('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?) ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = excluded.emoji').run(messageId, userId, emoji);
  else await db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?').run(messageId, userId);
  return (await reactionsMapFor([messageId]))[messageId] || [];
}

/* ---------- media ---------- */
async function createMedia(filename, mime, size) {
  const info = await db.prepare('INSERT INTO media (filename, mime, size) VALUES (?, ?, ?)').run(filename, mime, size);
  return Number(info.lastInsertRowid);
}
async function mediaById(id) { return (await db.prepare('SELECT * FROM media WHERE id = ?').get(id)) || null; }

/* ---------- updates / status ---------- */
async function addStatus(userId, body) {
  const info = await db.prepare('INSERT INTO statuses (user_id, body) VALUES (?, ?)').run(userId, body);
  return db.prepare('SELECT * FROM statuses WHERE id = ?').get(Number(info.lastInsertRowid));
}
async function myStatuses(userId) { return db.prepare('SELECT * FROM statuses WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(userId); }
async function deleteStatus(id, userId) { await db.prepare('DELETE FROM statuses WHERE id = ? AND user_id = ?').run(id, userId); }
async function statusById(id) { return db.prepare('SELECT s.*, u.display_name AS user_name FROM statuses s JOIN users u ON u.id = s.user_id WHERE s.id = ?').get(id); }
async function markStatusViewed(statusId, userId) {
  await db.prepare('INSERT OR IGNORE INTO status_views (status_id, user_id) VALUES (?, ?)').run(statusId, userId);
}
async function updatesFeed(userId) {
  const mine = await myStatuses(userId);
  const contacts = (await db.prepare(`SELECT DISTINCT m2.user_id AS id FROM conversation_members m1
    JOIN conversation_members m2 ON m2.conversation_id = m1.conversation_id AND m2.user_id != ?
    WHERE m1.user_id = ?`).all(userId, userId)).map((r) => r.id);
  const rows = [];
  for (const cid of contacts) {
    const st = await db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM status_views v WHERE v.status_id = s.id AND v.user_id = ?) AS seen
      FROM statuses s WHERE s.user_id = ? ORDER BY s.id ASC`).all(userId, cid);
    if (!st.length) continue;
    const u = await getUserById(cid);
    rows.push({ user: u, statuses: st, unseen: st.filter((s) => !s.seen).length });
  }
  return { mine, contacts: rows };
}

/* ---------- channels ---------- */
async function listChannels(userId) {
  const rows = await db.prepare(`SELECT c.*, u.display_name AS owner_name,
    (SELECT COUNT(*) FROM channel_followers f WHERE f.channel_id = c.id) AS followers,
    (SELECT COUNT(*) FROM channel_posts p WHERE p.channel_id = c.id) AS posts,
    (SELECT f2.last_read_post FROM channel_followers f2 WHERE f2.channel_id = c.id AND f2.user_id = ?) AS last_read,
    (SELECT MAX(p2.id) FROM channel_posts p2 WHERE p2.channel_id = c.id) AS last_post_id
    FROM channels c JOIN users u ON u.id = c.created_by ORDER BY c.id DESC`).all(userId);
  return rows.map((r) => ({
    id: r.id, title: r.title, about: r.about, ownerName: r.owner_name, createdBy: r.created_by,
    followers: r.followers, posts: r.posts,
    following: r.last_read !== undefined && r.last_read !== null,
    unread: r.last_read != null && r.last_post_id ? Math.max(0, r.last_post_id - r.last_read) : 0,
  }));
}
async function followChannel(channelId, userId, on) {
  if (on) await db.prepare('INSERT OR IGNORE INTO channel_followers (channel_id, user_id) VALUES (?, ?)').run(channelId, userId);
  else await db.prepare('DELETE FROM channel_followers WHERE channel_id = ? AND user_id = ?').run(channelId, userId);
}
async function createChannel(title, about, userId) {
  const info = await db.prepare('INSERT INTO channels (title, about, created_by) VALUES (?, ?, ?)').run(title, about, userId);
  await db.prepare('INSERT OR IGNORE INTO channel_followers (channel_id, user_id) VALUES (?, ?)').run(Number(info.lastInsertRowid), userId);
  return Number(info.lastInsertRowid);
}
async function channelPosts(channelId, userId) {
  await db.prepare('UPDATE channel_followers SET last_read_post = (SELECT COALESCE(MAX(id),0) FROM channel_posts WHERE channel_id = ?) WHERE channel_id = ? AND user_id = ?')
    .run(channelId, channelId, userId);
  return db.prepare(`SELECT p.*, u.display_name AS author_name FROM channel_posts p JOIN users u ON u.id = p.author_id WHERE p.channel_id = ? ORDER BY p.id DESC LIMIT 100`).all(channelId);
}
async function addChannelPost(channelId, authorId, body) {
  const info = await db.prepare('INSERT INTO channel_posts (channel_id, author_id, body) VALUES (?, ?, ?)').run(channelId, authorId, body);
  return Number(info.lastInsertRowid);
}

/* ---------- communities ---------- */
async function listCommunities(userId) {
  return db.prepare(`SELECT c.*, u.display_name AS owner_name,
    (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS members,
    (SELECT COUNT(*) FROM community_groups cg WHERE cg.community_id = c.id) AS groups,
    (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.user_id = ?) AS joined
    FROM communities c JOIN users u ON u.id = c.created_by ORDER BY c.id DESC`).all(userId);
}
async function communityDetail(id) {
  const c = await db.prepare('SELECT * FROM communities WHERE id = ?').get(id);
  if (!c) return null;
  const groups = await db.prepare(`SELECT g.conversation_id AS id, cv.title, (SELECT COUNT(*) FROM conversation_members m WHERE m.conversation_id = g.conversation_id) AS members
    FROM community_groups g JOIN conversations cv ON cv.id = g.conversation_id WHERE g.community_id = ?`).all(id);
  const members = (await db.prepare(`SELECT u.display_name AS name FROM community_members m JOIN users u ON u.id = m.user_id WHERE m.community_id = ?`).all(id)).map((r) => r.name);
  return { ...c, groups, members };
}
async function createCommunity(title, about, userId, groupIds) {
  const info = await db.prepare('INSERT INTO communities (title, about, created_by) VALUES (?, ?, ?)').run(title, about, userId);
  const id = Number(info.lastInsertRowid);
  await db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)').run(id, userId);
  for (const g of groupIds || []) await db.prepare('INSERT OR IGNORE INTO community_groups (community_id, conversation_id) VALUES (?, ?)').run(id, g);
  return id;
}
async function joinCommunity(id, userId, on) {
  if (on) await db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)').run(id, userId);
  else await db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(id, userId);
}

/* ---------- calls ---------- */
async function createCall(callerId, calleeId, kind) {
  const info = await db.prepare('INSERT INTO calls (caller_id, callee_id, kind) VALUES (?, ?, ?)').run(callerId, calleeId, kind);
  return getCall(Number(info.lastInsertRowid));
}
async function getCall(id) {
  return (await db.prepare(`SELECT c.*, u1.display_name AS caller_name, u2.display_name AS callee_name
    FROM calls c JOIN users u1 ON u1.id = c.caller_id JOIN users u2 ON u2.id = c.callee_id WHERE c.id = ?`).get(id)) || null;
}
async function setCall(id, patch) {
  const sets = []; const params = [];
  for (const [k, col] of [['status', 'status'], ['durationSec', 'duration_sec']]) if (patch[k] !== undefined) { sets.push(`${col} = ?`); params.push(patch[k]); }
  if (patch.startedNow) sets.push("started_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  if (patch.endedNow) sets.push("ended_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  if (sets.length) { params.push(id); await db.prepare(`UPDATE calls SET ${sets.join(', ')} WHERE id = ?`).run(...params); }
  return getCall(id);
}
async function callHistory(userId) {
  return db.prepare(`SELECT c.*, u1.display_name AS caller_name, u2.display_name AS callee_name
    FROM calls c JOIN users u1 ON u1.id = c.caller_id JOIN users u2 ON u2.id = c.callee_id
    WHERE c.caller_id = ? OR c.callee_id = ? ORDER BY c.id DESC LIMIT 50`).all(userId, userId);
}
async function pendingCalls(userId) {
  return db.prepare(`SELECT c.*, u1.display_name AS caller_name FROM calls c JOIN users u1 ON u1.id = c.caller_id WHERE c.callee_id = ? AND c.status = 'offered' ORDER BY c.id DESC`).all(userId);
}

/* ---------- OTP email, keys E2EE, push ---------- */
async function getEmail(id) { const r = await db.prepare('SELECT email FROM users WHERE id = ?').get(id); return r?.email || null; }
async function getUserByEmail(email) {
  return publicUser(await db.prepare(`SELECT ${USER_FIELDS}, email, pubkey FROM users WHERE lower(email) = lower(?)`).get(email));
}
async function setUserPubkey(userId, pubkey) { await db.prepare('UPDATE users SET pubkey = ? WHERE id = ?').run(pubkey, userId); }
async function getPubkey(userId) { const r = await db.prepare('SELECT pubkey FROM users WHERE id = ?').get(userId); return r?.pubkey || null; }
async function addOtp(email, codeHash, expiresAt) {
  await db.prepare('DELETE FROM otp_codes WHERE email = lower(?)').run(email);
  await db.prepare('INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (lower(?), ?, ?)').run(email, codeHash, expiresAt);
}
async function takeOtp(email) {
  return db.prepare('SELECT * FROM otp_codes WHERE email = lower(?) ORDER BY id DESC LIMIT 1').get(email);
}
async function otpAttempts(id) { await db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(id); }
async function deleteOtp(id) { await db.prepare('DELETE FROM otp_codes WHERE id = ?').run(id); }
async function createUserWithEmail({ username, email, displayName }) {
  const info = await db.prepare(`INSERT INTO users (username, display_name, email, verified, avatar_text, avatar_color)
    VALUES (?, ?, lower(?), 1, ?, ?)`)
    .run(username, displayName, email, (displayName || username).slice(0, 2).toUpperCase(), '#7a1216');
  return getUserById(Number(info.lastInsertRowid));
}
async function addPushSub(userId, subJson) {
  const endpoint = subJson?.endpoint;
  if (!endpoint) throw new Error('Subscription tidak valid.');
  await db.prepare('INSERT INTO push_subs (user_id, endpoint, sub_json) VALUES (?, ?, ?) ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, sub_json = excluded.sub_json')
    .run(userId, endpoint, JSON.stringify(subJson));
}
async function listPushSubs(userId) { return db.prepare('SELECT * FROM push_subs WHERE user_id = ?').all(userId); }
async function deletePushSub(id) { await db.prepare('DELETE FROM push_subs WHERE id = ?').run(id); }
async function allPushSubs() { return db.prepare('SELECT s.*, u.display_name AS user_name FROM push_subs s JOIN users u ON u.id = s.user_id').all(); }

/* ---------- blokir personal ---------- */
async function setBlock(blockerId, blockedId, on) {
  if (on) await db.prepare('INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)').run(blockerId, blockedId);
  else await db.prepare('DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?').run(blockerId, blockedId);
}
async function isBlocking(blockerId, blockedId) {
  return !!(await db.prepare('SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?').get(blockerId, blockedId));
}
async function listBlocks(userId) {
  return (await db.prepare(`SELECT ${USER_FIELDS_U} FROM user_blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ?`).all(userId)).map(publicUser);
}
async function updateOwnProfile(userId, patch) {
  const sets = []; const params = [];
  for (const [k, col] of [['displayName', 'display_name'], ['about', 'about'], ['avatarText', 'avatar_text'], ['avatarColor', 'avatar_color'], ['avatarUrl', 'avatar_url']]) {
    if (patch[k] !== undefined) { sets.push(`${col} = ?`); params.push(String(patch[k])); }
  }
  if (!sets.length) return getUserById(userId);
  params.push(userId);
  await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return getUserById(userId);
}

/* ---------- CSV ---------- */
async function usersCSV() {
  const rows = (await db.prepare(`SELECT ${USER_FIELDS} FROM users ORDER BY id`).all()).map(publicUser);
  const head = 'id,username,display_name,phone,about,role,verified,blocked,created_at';
  const lines = rows.map((u) => [u.id, u.username, u.displayName, u.phone, u.about, u.role, u.verified ? 1 : 0, u.blocked ? 1 : 0, u.createdAt]
    .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  return [head, ...lines].join('\n');
}
async function importUsersCSV(csv, passwordHash) {
  const lines = String(csv).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const head = lines.shift()?.split(',').map((h) => h.replace(/"/g, '').trim());
  if (!head || !head.includes('username') || !head.includes('display_name')) throw new Error('CSV butuh kolom username,display_name');
  let created = 0, skipped = 0;
  for (const line of lines) {
    const cells = [...line.matchAll(/"([^"]*)"|([^,]+)/g)].map((m) => (m[1] !== undefined ? m[1] : m[2]));
    const get = (c) => cells[head.indexOf(c)] || '';
    const username = get('username').trim();
    if (!username || (await db.prepare('SELECT 1 FROM users WHERE lower(username) = lower(?)').get(username))) { skipped++; continue; }
    const dn = get('display_name').trim() || username;
    await db.prepare(`INSERT INTO users (username, password_hash, display_name, phone, about, avatar_text, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(username, passwordHash, dn, get('phone'), get('about') || 'Hey there! I am using Xerophis.', dn.slice(0, 2).toUpperCase(), '#7a1216');
    created++;
  }
  return { created, skipped };
}

module.exports = {
  db, DB_PATH, DRIVER, ready, OWNER_USERNAMES, ensureOwners,
  getUserById, getUserByUsername, createUser, createSession, getUserByToken, deleteSession,
  createConversation, findPrivateConversation, listConversationsFor, getConversation, getMembers,
  isMember, setLastRead, setFavorite, setMuted, getMuted, insertMessage, getMessage, listMessages, deleteMessage,
  searchUsers, allUsers,
  stats, adminListUsers, adminUpdateUser, adminDeleteUser, adminListConversations,
  adminDeleteConversation, adminRecentMessages, allHumanUsers, logAdmin, listAdminLogs,
  assignConversation, setConversationTag, addNote, listNotes, deleteNote, setPinned, lastPinned,
  listFilters, addFilter, deleteFilter, censorText, setUserBlocked, setUserFlagged, countRecentMessages, sameBodySpread,
  listAutoRules, addAutoRule, deleteAutoRule, matchAutoRule,
  listQuickReplies, addQuickReply, deleteQuickReply,
  createBroadcast, dueBroadcasts, markBroadcast, listBroadcasts,
  kvGet, kvSet, listSessions, listSessionsFor, analytics, usersCSV, importUsersCSV,
  addTransaction, listTransactions, recordRating, usersInTag,
  toggleStar, isStarred, listStarred, setReaction, createMedia, mediaById,
  addStatus, myStatuses, deleteStatus, statusById, markStatusViewed, updatesFeed,
  listChannels, followChannel, createChannel, channelPosts, addChannelPost,
  listCommunities, communityDetail, createCommunity, joinCommunity,
  createCall, getCall, setCall, callHistory, pendingCalls,
  getEmail, getUserByEmail, setUserPubkey, getPubkey, addOtp, takeOtp, otpAttempts, deleteOtp,
  setBlock, isBlocking, listBlocks, updateOwnProfile,
  createUserWithEmail, addPushSub, listPushSubs, deletePushSub, allPushSubs,
};
