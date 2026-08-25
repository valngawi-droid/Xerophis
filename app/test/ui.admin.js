'use strict';
/* Smoke admin: jelajahi semua tab King Panel + operasional inbox (jsdom). */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 3215;
const BASE = `http://127.0.0.1:${PORT}`;
const tmpDb = path.join(os.tmpdir(), `xero-adm-${Date.now()}.db`);
const errors = [];

async function main() {
  const server = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), DB_PATH: tmpDb },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', (d) => { const s = d.toString(); if (/TypeError|ReferenceError|SyntaxError|\[error\]|FATAL|UnhandledPromise/.test(s)) errors.push('server: ' + s.slice(0, 160)); });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`${BASE}/api/health`); if (r.ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  const login = await (await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'xerophisuser', password: 'xerophis' }) })).json();

  const { JSDOM } = require('jsdom');
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url: BASE + '/', pretendToBeVisual: true });
  const w = dom.window;
  global.window = w; global.document = w.document; global.location = w.location; global.localStorage = w.localStorage;
  try { Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true }); } catch {}
  const realFetch = global.fetch.bind(global);
  global.fetch = (input, init) => realFetch(new URL(String(input), BASE), init);
  global.WebSocket = require('ws').WebSocket;
  w.addEventListener('error', (e) => errors.push('window: ' + (e.message || e)));
  localStorage.setItem('xerophis.token', login.token);

  const pub = path.join(__dirname, '..', 'public');
  fs.copyFileSync(path.join(pub, 'e2ee.js'), path.join(pub, 'e2ee.smoke.mjs'));
  const appSrc = fs.readFileSync(path.join(pub, 'app.js'), 'utf8').replace("from '/e2ee.js'", "from './e2ee.smoke.mjs'");
  const appPath = path.join(pub, 'app.smoke.mjs');
  fs.writeFileSync(appPath, appSrc);
  await import(appPath);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(800);

  w.location.hash = '#/admin'; w.dispatchEvent(new w.Event('hashchange')); await sleep(800);
  const tabs = [...w.document.querySelectorAll('#adm-tabs .chip')];
  if (!tabs.length) errors.push('tab admin tidak render');
  for (const t of tabs) {
    t.click(); await sleep(700);
    const body = w.document.querySelector('#adm-body');
    if (!body || body.innerHTML.trim().length < 20) errors.push(`tab admin ${t.textContent} kosong`);
    else console.log('  ✓ tab admin:', t.textContent.trim());
  }

  // operasional inbox: buka percakapan pertama, balas
  w.location.hash = '#/admin'; w.dispatchEvent(new w.Event('hashchange')); await sleep(700);
  const chipInbox = [...w.document.querySelectorAll('#adm-tabs .chip')].find((c) => c.textContent.trim() === 'Inbox');
  if (chipInbox) {
    chipInbox.click(); await sleep(700);
    const row = w.document.querySelector('[data-open]');
    if (row) {
      row.click(); await sleep(800);
      const ibx = w.document.querySelector('#ibx');
      if (!ibx) errors.push('inbox viewer tidak terbuka');
      else {
        const reply = w.document.querySelector('#ibx-reply');
        if (reply) {
          reply.value = 'balasan smoke admin';
          w.document.querySelector('#ibx-send').click();
          await sleep(800);
          if (ibx.textContent.includes('balasan smoke admin')) console.log('  ✓ admin balas chat dari inbox');
          else errors.push('balasan admin tidak muncul di inbox');
        } else errors.push('composer inbox tidak ada');
      }
    } else errors.push('tidak ada baris inbox');
  }

  if (errors.length) {
    console.error('\nADMIN SMOKE GAGAL:');
    for (const e of errors.slice(0, 12)) console.error(' -', e);
    process.exit(1);
  }
  console.log('\nADMIN SMOKE OK');
  fs.rmSync(path.join(pub, 'e2ee.smoke.mjs'), { force: true });
  fs.rmSync(appPath, { force: true });
  server.kill(); fs.rmSync(tmpDb, { force: true });
  process.exit(0);
}
main().catch((e) => { console.error('ADMIN SMOKE FAIL:', e.message); process.exit(1); });
