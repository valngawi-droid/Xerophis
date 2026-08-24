'use strict';
/* Xerophis e2e — boots the real server (temp DB) and exercises the full slice. */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const WebSocket = require('ws');

const PORT = 3211;
const BASE = `http://127.0.0.1:${PORT}`;
const tmpDb = path.join(os.tmpdir(), `xerophis-test-${Date.now()}.db`);

let passed = 0;
function ok(cond, label) {
  if (!cond) { console.error(`  ✗ ${label}`); process.exit(1); }
  passed += 1; console.log(`  ✓ ${label}`);
}
const j = (r) => r.json();
async function api(p, { token, method = 'GET', body } = {}) {
  const r = await fetch(`${BASE}/api${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await j(r) };
}
function waitWS(ws, pred, ms = 6000) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('ws timeout')), ms);
    const h = (raw) => { const m = JSON.parse(raw.toString()); if (pred(m)) { clearTimeout(t); ws.off('message', h); res(m); } };
    ws.on('message', h);
  });
}

async function main() {
  const server = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), DB_PATH: tmpDb },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr.on('data', (d) => process.stderr.write(d));
  const alive = () => !server.killed && server.exitCode === null;

  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`${BASE}/api/health`); if (r.ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 250));
    if (!alive()) throw new Error('server died on boot');
  }

  console.log('• health');
  ok((await api('/health')).data.ok === true, 'GET /api/health ok');

  console.log('• auth');
  const bad = await api('/auth/login', { method: 'POST', body: { username: 'xerophisuser', password: 'wrong' } });
  ok(bad.status === 401, 'wrong password rejected (401)');
  const login = await api('/auth/login', { method: 'POST', body: { username: 'xerophisuser', password: 'xerophis' } });
  ok(login.status === 200 && login.data.token, 'demo login xerophisuser/xerophis');
  const A = login.data.token;
  const reg = await api('/auth/register', { method: 'POST', body: { username: 'tester2', password: 'secret2', displayName: 'Tester Dua' } });
  ok(reg.status === 201 && reg.data.user.displayName === 'Tester Dua', 'register tester2');
  const B = reg.data.token;
  ok((await api('/auth/register', { method: 'POST', body: { username: 'tester2', password: 'secret2', displayName: 'Dup' } })).status === 409, 'duplicate username 409');
  ok((await api('/auth/register', { method: 'POST', body: { username: 'tester2', password: 'x', displayName: 'Dup' } })).status === 400, 'short password 400');

  console.log('• seed & conversations');
  const convs = (await api('/conversations', { token: A })).data.conversations;
  ok(convs.length >= 6, `demo account has ${convs.length} seeded conversations`);
  const ngabers = convs.find((c) => c.title === 'Ngabers Project');
  const random = convs.find((c) => c.title === 'Random Group');
  ok(ngabers?.unread === 1, 'Ngabers unread = 1');
  ok(random?.unread === 5, 'Random Group unread = 5');

  console.log('• realtime messaging A<->B');
  const wsA = new WebSocket(`ws://127.0.0.1:${PORT}/ws?token=${A}`);
  const wsB = new WebSocket(`ws://127.0.0.1:${PORT}/ws?token=${B}`);
  await Promise.all([new Promise((r) => wsA.on('open', r)), new Promise((r) => wsB.on('open', r))]);
  ok(true, 'both sockets connected');

  const created = await api('/conversations', { token: B, method: 'POST', body: { type: 'private', username: 'xerophisuser' } });
  ok(created.status === 201, 'B opens private chat with A');
  const convId = created.data.conversationId;

  const gotMsg = waitWS(wsA, (m) => m.type === 'message:new' && m.conversationId === convId);
  const sentB = await api(`/conversations/${convId}/messages`, { token: B, method: 'POST', body: { body: 'halo boss 🔥' } });
  ok(sentB.status === 201, 'B sends message');
  const got = await gotMsg;
  ok(got.message.body === 'halo boss 🔥', 'A receives it over WebSocket');

  const readP = waitWS(wsB, (m) => m.type === 'read' && m.conversationId === convId);
  await api(`/conversations/${convId}/read`, { token: A, method: 'POST', body: { messageId: got.message.id } });
  const readEvt = await readP;
  ok(readEvt.messageId === got.message.id, 'B gets read receipt over WebSocket');

  const msgsA = (await api(`/conversations/${convId}/messages`, { token: B })).data.messages;
  ok(msgsA.some((m) => m.id === got.message.id && m.readBy.length === 1), 'readBy persisted for read receipt');

  console.log('• delete');
  const replyA = await api(`/conversations/${convId}/messages`, { token: A, method: 'POST', body: { body: 'oke sjap' } });
  const delForbidden = await api(`/messages/${replyA.data.message.id}`, { token: B, method: 'DELETE' });
  ok(delForbidden.status === 403, 'non-sender cannot delete (403)');
  const del = await api(`/messages/${replyA.data.message.id}`, { token: A, method: 'DELETE' });
  ok(del.status === 200, 'sender deletes own message');
  const after = (await api(`/conversations/${convId}/messages`, { token: A })).data.messages;
  ok(!after.some((m) => m.id === replyA.data.message.id), 'deleted message gone');

  console.log('• bot loop (typing → reply)');
  const devConv = convs.find((c) => c.counterpart?.username === 'xerophis');
  const typingP = waitWS(wsA, (m) => m.type === 'typing' && m.conversationId === devConv.id, 8000);
  const botP = waitWS(wsA, (m) => m.type === 'message:new' && m.conversationId === devConv.id && m.message.senderId !== login.data.user.id, 8000);
  await api(`/conversations/${devConv.id}/messages`, { token: A, method: 'POST', body: { body: 'halo dev!' } });
  await typingP; ok(true, 'bot emits typing indicator');
  const botMsg = await botP; ok(botMsg.message.body.length > 0, `bot replied: "${botMsg.message.body.slice(0, 40)}"`);

  console.log('• group creation');
  const grp = await api('/conversations', { token: A, method: 'POST', body: { type: 'group', title: 'Squad Merah', members: ['tester2'] } });
  ok(grp.status === 201, 'A creates group with B');
  const grpMsgs = (await api(`/conversations/${grp.data.conversationId}/messages`, { token: B })).data.messages;
  ok(grpMsgs.some((m) => m.kind === 'system'), 'system message seeded in group');

  console.log('• admin panel (kingpall)');
  ok((await api('/admin/stats', { token: B })).status === 403, 'non-admin ditolak (403)');
  const statsA = await api('/admin/stats', { token: A });
  ok(statsA.status === 200 && statsA.data.stats.users >= 8, `admin stats ok (${statsA.data.stats.users} pengguna)`);
  const createdU = await api('/admin/users', { token: A, method: 'POST', body: { username: 'anakbuah', password: 'rahasia', displayName: 'Anak Buah' } });
  ok(createdU.status === 201, 'admin membuat pengguna');
  const promoted = await api(`/admin/users/${createdU.data.user.id}`, { token: A, method: 'PATCH', body: { isAdmin: true } });
  ok(promoted.data.user.isAdmin === true, 'admin menaikkan role pengguna');
  const loginAB = await api('/auth/login', { method: 'POST', body: { username: 'anakbuah', password: 'rahasia' } });
  ok((await api('/admin/stats', { token: loginAB.data.token })).status === 200, 'role baru langsung berlaku');
  ok((await api(`/admin/users/${login.data.user.id}`, { token: A, method: 'PATCH', body: { isAdmin: false } })).status === 400, 'admin tak bisa menurunkan diri sendiri');
  const bc = await api('/admin/broadcast', { token: A, method: 'POST', body: { text: 'Uji siaran kingpall' } });
  ok(bc.data.count >= 3, `siaran terkirim ke ${bc.data.count} pengguna`);
  const convsAB = (await api('/conversations', { token: loginAB.data.token })).data.conversations;
  ok(convsAB.some((c) => c.counterpart?.username === 'xerophis' && (c.lastMessage?.body || '').includes('Uji siaran')), 'siaran sampai ke chat pengguna');
  const logs = (await api('/admin/logs', { token: A })).data.logs;
  ok(logs.some((l) => l.action === 'broadcast') && logs.some((l) => l.action === 'user.create'), 'log audit tercatat');
  ok((await api(`/admin/messages/${botMsg.message.id}`, { token: A, method: 'DELETE' })).status === 200, 'moderasi: admin hapus pesan orang lain');
  ok((await api(`/admin/conversations/${convId}`, { token: A, method: 'DELETE' })).status === 200, 'admin hapus percakapan');
  ok((await api(`/admin/users/${createdU.data.user.id}`, { token: A, method: 'DELETE' })).status === 200, 'admin hapus pengguna');
  const gone = await api('/auth/login', { method: 'POST', body: { username: 'anakbuah', password: 'rahasia' } });
  ok(gone.status === 401, 'pengguna terhapus tidak bisa login');

  wsA.close(); wsB.close();
  server.kill();
  fs.rmSync(tmpDb, { force: true });
  console.log(`\nALL ${passed} CHECKS PASSED`);
  process.exit(0);
}

main().catch((e) => { console.error('TEST FAIL:', e.message); process.exit(1); });
process.on('exit', () => { try { require('node:child_process').execSync('pkill -f "server/index.js" || true'); } catch {} });
