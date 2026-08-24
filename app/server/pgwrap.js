'use strict';
/** Wrapper Postgres (pg) dengan antarmuka async seragam ala SQLite. */
const pg = require('pg');
const { Pool } = pg;
pg.types.setTypeParser(20, (v) => Number(v));    // int8 (COUNT dll) -> number
pg.types.setTypeParser(1700, (v) => Number(v)); // numeric (AVG/ROUND) -> number

const ID_TABLES = new Set(['users', 'conversations', 'messages', 'statuses', 'channels', 'channel_posts',
  'communities', 'transactions', 'calls', 'admin_notes', 'broadcasts', 'quick_replies', 'auto_rules', 'word_filters', 'media']);

function convert(sql) { // ? -> $n di luar string literal
  let n = 0, out = '', inS = false;
  for (const ch of sql) {
    if (ch === "'") inS = !inS;
    if (ch === '?' && !inS) { n++; out += `$${n}`; } else out += ch;
  }
  return out;
}
function normalize(sql) {
  let s = sql.trim();
  let orIgnore = false;
  if (/^insert\s+or\s+ignore/i.test(s)) { s = s.replace(/^insert\s+or\s+ignore/i, 'INSERT'); orIgnore = true; }
  if (orIgnore && !/on\s+conflict/i.test(s)) s += ' ON CONFLICT DO NOTHING';
  return s;
}

function open(url) {
  const pool = new Pool({ connectionString: url, max: 10 });

  const q = async (sql, params = []) => {
    const s = normalize(sql);
    if (/^insert/i.test(s) && !/returning/i.test(s)) {
      const m = s.match(/^insert\s+into\s+("?)(\w+)\1/i);
      if (m && ID_TABLES.has(m[2])) {
        try { return await pool.query(convert(`${s} RETURNING id`), params); }
        catch (e) { if (e.code !== '42703') throw e; }
      }
    }
    return pool.query(convert(s), params);
  };

  return {
    engine: 'postgres',
    pool,
    exec: async (sql) => { await pool.query(sql); }, // simple protocol, multi-statement
    prepare: (sql) => ({
      run: async (...p) => { const r = await q(sql, p); return { changes: r.rowCount, lastInsertRowid: r.rows?.[0]?.id }; },
      get: async (...p) => { const r = await q(sql, p); return r.rows[0]; },
      all: async (...p) => { const r = await q(sql, p); return r.rows; },
    }),
    tx: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn({ run: async (sql, ...p) => client.query(convert(normalize(sql)), p) });
        await client.query('COMMIT');
        return out;
      } catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    },
    close: () => pool.end(),
  };
}

/* ---------- skema & fungsi kompatibilitas SQLite ---------- */
const PG_DDL = `
CREATE OR REPLACE FUNCTION strftime(fmt text, ts text DEFAULT NULL, mod text DEFAULT NULL) RETURNS text AS $$
DECLARE
  t timestamptz; m text[]; n numeric;
BEGIN
  t := now() AT TIME ZONE 'UTC';
  IF ts IS NOT NULL AND ts <> 'now' THEN
    t := to_timestamp(ts, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  END IF;
  IF mod IS NOT NULL THEN
    m := regexp_match(mod, '(-?\\d+)\\s*(seconds|minutes|hours|days)');
    IF m IS NOT NULL THEN t := t + (m[1] || ' ' || m[2])::interval; END IF;
  END IF;
  IF fmt = '%H' THEN RETURN to_char(t, 'HH24');
  ELSE RETURN to_char(t, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT 'Hey there! I am using Xerophis.',
  avatar_text TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#7a1216',
  is_bot INTEGER NOT NULL DEFAULT 0,
  is_official INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member',
  verified INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  blocked INTEGER NOT NULL DEFAULT 0,
  flagged INTEGER NOT NULL DEFAULT 0,
  agent_status TEXT NOT NULL DEFAULT 'offline',
  admin_pin TEXT,
  crm_note TEXT NOT NULL DEFAULT '',
  custom_fields TEXT NOT NULL DEFAULT '{}',
  shift_start TEXT NOT NULL DEFAULT '',
  shift_end TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  about TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id),
  assigned_to INTEGER,
  tag TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  favorite INTEGER NOT NULL DEFAULT 0,
  muted INTEGER NOT NULL DEFAULT 0,
  last_read_id INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now'),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  pinned INTEGER NOT NULL DEFAULT 0,
  broadcast_id INTEGER,
  buttons TEXT,
  media_id INTEGER,
  reply_to INTEGER,
  forwarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY, admin_id INTEGER, action TEXT NOT NULL, target TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS admin_notes (
  id SERIAL PRIMARY KEY, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  admin_id INTEGER, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS word_filters (id SERIAL PRIMARY KEY, word TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS auto_rules (id SERIAL PRIMARY KEY, keyword TEXT NOT NULL, reply TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS quick_replies (id SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY, admin_id INTEGER, text TEXT NOT NULL, target TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'sent', send_at TEXT, created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS message_stars (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now'),
  PRIMARY KEY (user_id, message_id)
);
CREATE TABLE IF NOT EXISTS statuses (
  id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS status_views (
  status_id INTEGER NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seen_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now'),
  PRIMARY KEY (status_id, user_id)
);
CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY, title TEXT NOT NULL, about TEXT NOT NULL DEFAULT '',
  created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS channel_followers (
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_post INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (channel_id, user_id)
);
CREATE TABLE IF NOT EXISTS channel_posts (
  id SERIAL PRIMARY KEY, channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY, title TEXT NOT NULL, about TEXT NOT NULL DEFAULT '',
  created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS community_members (
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (community_id, user_id)
);
CREATE TABLE IF NOT EXISTS community_groups (
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  PRIMARY KEY (community_id, conversation_id)
);
CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY, caller_id INTEGER NOT NULL REFERENCES users(id), callee_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL DEFAULT 'voice', status TEXT NOT NULL DEFAULT 'offered', started_at TEXT, ended_at TEXT,
  duration_sec INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY, filename TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now'),
  PRIMARY KEY (message_id, user_id)
);
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id INTEGER, amount INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
CREATE TABLE IF NOT EXISTS csat_ratings (
  id SERIAL PRIMARY KEY, conversation_id INTEGER NOT NULL, agent_id INTEGER, user_id INTEGER,
  rating INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
`;

module.exports = { open, PG_DDL };
