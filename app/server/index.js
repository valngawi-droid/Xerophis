'use strict';
/** Xerophis — entrypoint: Express + WebSocket + static SPA. */
/* muat .env sebelum require lain (SMTP_URL dll) */
(() => {
  const fs = require('node:fs'); const p = require('node:path');
  try {
    const f = p.join(__dirname, '..', '.env');
    if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
})();
const path = require('node:path');
const express = require('express');
const dbx = require('./db');
const hub = require('./wsHub');
const auth = require('./auth');
const api = require('./api');
const ring = require('./ring');
const adminMod = require('./admin');
const { seed } = require('./seed');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Xerophis', version: '0.1.0' }));
app.get('/api/announce', async (req, res) => res.json({ text: await dbx.kvGet('announcement') || '' }));
app.use('/api/auth', auth.router);
app.use('/api/admin', adminMod.router);
app.use('/api', api);

app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  ring.push(err);
  res.status(500).json({ error: 'Terjadi kesalahan internal.' });
});

seed().catch((e) => { console.error('[seed] failed:', e.message); ring.push(e); }).finally(async () => {
  await dbx.ready;
  const seedMod = require('./seed');
  await seedMod.ensureOwnerAccounts();
  await seedMod.seedExtras();
  adminMod.startScheduler();
  const server = app.listen(PORT, HOST, () => {
    hub.attach(server);
    console.log(`[xerophis] listening on http://${HOST}:${PORT}`);
  });
});
