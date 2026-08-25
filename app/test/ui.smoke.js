'use strict';
/* Smoke test UI: jalankan app.js di jsdom melawan server asli, jelajahi semua layar,
   tangkap error runtime client. */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 3213;
const BASE = `http://127.0.0.1:${PORT}`;
const tmpDb = path.join(os.tmpdir(), `xero-ui-${Date.now()}.db`);
const errors = [];

async function main() {
  const server = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), DB_PATH: tmpDb },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', (d) => { const s = d.toString(); if (/Error|error/.test(s)) errors.push('server: ' + s.slice(0, 120)); });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`${BASE}/api/health`); if (r.ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  const login = await (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'xerophisuser', password: 'xerophis' }) })).json();

  const { JSDOM } = require('jsdom');
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url: BASE + '/', pretendToBeVisual: true });
  const w = dom.window;
  global.window = w;
  global.document = w.document;
  global.location = w.location;
  global.localStorage = w.localStorage;
  try { Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true }); } catch {}
  const realFetch = global.fetch.bind(global);
  global.fetch = (input, init) => realFetch(new URL(String(input), BASE), init);
  global.WebSocket = require('ws').WebSocket;
  w.addEventListener('error', (e) => errors.push('window: ' + (e.message || e)));

  localStorage.setItem('xerophis.token', login.token);

  // salin sebagai .mjs biar ESM jalan; betulkan specifier e2ee
  const pub = path.join(__dirname, '..', 'public');
  fs.copyFileSync(path.join(pub, 'e2ee.js'), path.join(pub, 'e2ee.smoke.mjs'));
  const appSrc = fs.readFileSync(path.join(pub, 'app.js'), 'utf8').replace("from '/e2ee.js'", "from './e2ee.smoke.mjs'");
  const appPath = path.join(pub, 'app.smoke.mjs');
  fs.writeFileSync(appPath, appSrc);

  await import(appPath);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(900); // boot + render main

  const routes = ['#/', '#/updates', '#/communities', '#/calls', '#/settings', '#/newchat', '#/chat/2', '#/admin', '#/'];
  for (const r of routes) {
    w.location.hash = r;
    w.dispatchEvent(new w.Event('hashchange'));
    await sleep(600);
    const view = w.document.querySelector('#view');
    if (!view || view.innerHTML.trim().length < 40) errors.push(`route ${r}: view kosong`);
    else console.log('  ✓ layar', r, `(${view.innerHTML.length} byte)`);
  }
  // interaksi kecil: ketik pencarian (auto-refresh ringan tidak boleh error)
  const search = w.document.querySelector('#m-search');
  if (search) {
    search.value = 'nga';
    search.dispatchEvent(new w.Event('input', { bubbles: true }));
    await sleep(1300); // beberapa siklus refresh 1 detik
    console.log('  ✓ pencarian + auto-refresh 1 detik tanpa error');
  }

  if (errors.length) {
    console.error('\nUI SMOKE GAGAL:');
    for (const e of errors.slice(0, 12)) console.error(' -', e);
    process.exit(1);
  }
  console.log('\nUI SMOKE OK — semua layar render tanpa error runtime');
  fs.rmSync(path.join(pub, 'e2ee.smoke.mjs'), { force: true });
  fs.rmSync(appPath, { force: true });
  server.kill();
  fs.rmSync(tmpDb, { force: true });
  process.exit(0);
}
main().catch((e) => { console.error('SMOKE FAIL:', e.message); process.exit(1); });
