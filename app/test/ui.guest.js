'use strict';
/* Smoke guest: tanpa token -> layar login -> daftar via OTP email lewat UI. */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 3216;
const BASE = `http://127.0.0.1:${PORT}`;
const tmpDb = path.join(os.tmpdir(), `xero-guest-${Date.now()}.db`);
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

  const pub = path.join(__dirname, '..', 'public');
  fs.copyFileSync(path.join(pub, 'e2ee.js'), path.join(pub, 'e2ee.smoke.mjs'));
  const appSrc = fs.readFileSync(path.join(pub, 'app.js'), 'utf8').replace("from '/e2ee.js'", "from './e2ee.smoke.mjs'");
  const appPath = path.join(pub, 'app.smoke.mjs');
  fs.writeFileSync(appPath, appSrc);
  await import(appPath);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(800);

  if (!w.document.querySelector('#f-otp-toggle')) errors.push('layar login / tombol OTP tidak render');
  else {
    console.log('  ✓ layar login render (guest)');
    w.document.querySelector('#f-otp-toggle').click(); await sleep(200);
    const email = w.document.querySelector('#f-email');
    if (!email) errors.push('form OTP tidak muncul');
    else {
      email.value = 'smoke@contoh.id';
      w.document.querySelector('#f-otp-req').click();
      await sleep(900);
      const code = w.document.querySelector('#f-code');
      if (!code || !/^\d{6}$/.test(code.value || '')) errors.push('devCode OTP tidak terisi otomatis');
      else {
        console.log('  ✓ OTP diminta & devCode terisi');
        w.document.querySelector('#f-otp-ver').click();
        await sleep(1200);
        const onboarding = w.document.querySelector('#view')?.textContent || '';
        if (location.hash.startsWith('#/') && !location.hash.includes('login') && onboarding.includes('Xerophis Lounge')) {
          console.log('  ✓ login OTP via UI + onboarding (Lounge) langsung isi');
        } else errors.push(`setelah verify OTP hash=${location.hash} view=${onboarding.slice(0, 60)}`);
      }
    }
  }

  if (errors.length) {
    console.error('\nGUEST SMOKE GAGAL:');
    for (const e of errors.slice(0, 12)) console.error(' -', e);
    process.exit(1);
  }
  console.log('\nGUEST SMOKE OK');
  fs.rmSync(path.join(pub, 'e2ee.smoke.mjs'), { force: true });
  fs.rmSync(appPath, { force: true });
  server.kill(); fs.rmSync(tmpDb, { force: true });
  process.exit(0);
}
main().catch((e) => { console.error('GUEST SMOKE FAIL:', e.message); process.exit(1); });
