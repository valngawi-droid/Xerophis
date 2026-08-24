'use strict';
/** Wrapper SQLite (node:sqlite) dengan antarmuka async seragam. */
const { DatabaseSync } = require('node:sqlite');

function open(dbPath) {
  const raw = new DatabaseSync(dbPath);
  raw.exec('PRAGMA journal_mode = WAL;');
  raw.exec('PRAGMA foreign_keys = ON;');
  return {
    engine: 'sqlite',
    exec: async (sql) => raw.exec(sql),
    prepare: (sql) => ({
      run: async (...p) => { const r = raw.prepare(sql).run(...p); return { changes: r.changes, lastInsertRowid: r.lastInsertRowid }; },
      get: async (...p) => raw.prepare(sql).get(...p),
      all: async (...p) => raw.prepare(sql).all(...p),
    }),
    tx: async (fn) => {
      raw.exec('BEGIN');
      try {
        const out = await fn({ run: async (sql, ...p) => raw.prepare(sql).run(...p) });
        raw.exec('COMMIT');
        return out;
      } catch (e) { raw.exec('ROLLBACK'); throw e; }
    },
    close: () => raw.close(),
  };
}
module.exports = { open };
