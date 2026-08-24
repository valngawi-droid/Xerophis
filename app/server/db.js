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

/* ---------- helpers ---------- */
const USER_FIELDS = 'id, username, display_name, phone, about, avatar_text, avatar_color, is_bot, is_official, created_at';
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
    createdAt: row.created_at,
  };
}

async function getUserById(id) {
  return publicUser(db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`).get(id));
}
async function getUserByUsername(username) {
  return publicUser(db.prepare(`SELECT ${USER_FIELDS} FROM users WHERE lower(username) = lower(?)`).get(username));
}
async function createUser({ username, passwordHash, displayName, phone, about, avatarText, avatarColor, isBot, isOfficial }) {
  const info = db.prepare(
    `INSERT INTO users (username, password_hash, display_name, phone, about, avatar_text, avatar_color, is_bot, is_official)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(username, passwordHash, displayName, phone || '', about || 'Hey there! I am using Xerophis.',
        avatarText || (displayName || username).slice(0, 2).toUpperCase(),
        avatarColor || '#7a1216', isBot ? 1 : 0, isOfficial ? 1 : 0);
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

async function insertMessage({ conversationId, senderId, body, kind }) {
  const info = db.prepare('INSERT INTO messages (conversation_id, sender_id, body, kind) VALUES (?, ?, ?, ?)')
    .run(conversationId, senderId, body, kind || 'text');
  return getMessage(Number(info.lastInsertRowid));
}
async function getMessage(id) {
  const row = db.prepare(`SELECT m.*, u.display_name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?`).get(id);
  if (!row) return null;
  return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, senderName: row.sender_name, body: row.body, kind: row.kind, createdAt: row.created_at };
}
async function listMessages(conversationId, limit = 200) {
  const rows = db.prepare(`SELECT m.*, u.display_name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? ORDER BY m.id DESC LIMIT ?`).all(conversationId, limit);
  return rows.reverse().map((r) => ({ id: r.id, conversationId: r.conversation_id, senderId: r.sender_id, senderName: r.sender_name, body: r.body, kind: r.kind, createdAt: r.created_at }));
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

module.exports = {
  db, DB_PATH,
  getUserById, getUserByUsername, createUser, createSession, getUserByToken, deleteSession,
  createConversation, findPrivateConversation, listConversationsFor, getConversation, getMembers,
  isMember, setLastRead, setFavorite, insertMessage, getMessage, listMessages, deleteMessage,
  searchUsers, allUsers,
};
