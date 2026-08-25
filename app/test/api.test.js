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
const USE_PG = process.env.DB_DRIVER === 'postgres';

let ep = null;
async function startPG() {
  const mod = require('embedded-postgres');
  const C = mod.default || mod;
  fs.rmSync('/tmp/xero-epg', { recursive: true, force: true });
  ep = new C({ databaseDir: '/tmp/xero-epg', port: 55432, user: 'postgres', password: 'xero', persistent: false });
  await ep.initialise();
  await ep.start();
  await ep.createDatabase('xerophis_test').catch(() => {});
  return 'postgres://postgres:xero@127.0.0.1:55432/xerophis_test';
}

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
  const pgUrl = USE_PG ? await startPG() : null;
  if (pgUrl) console.log('• mode: PostgreSQL (embedded)');
  const server = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), DB_PATH: tmpDb, ...(pgUrl ? { DB_DRIVER: 'postgres', DATABASE_URL: pgUrl } : {}) },
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

  console.log('• owner privilege & hierarchy');
  const pallLogin = await api('/auth/login', { method: 'POST', body: { username: 'pall', password: 'pall' } });
  ok(pallLogin.status === 200 && pallLogin.data.user.role === 'owner' && pallLogin.data.user.title === 'Developer Xerophis' && pallLogin.data.user.verified, 'pall = owner + title Developer Xerophis + verified');
  const O = pallLogin.data.token;
  ok((await api(`/admin/users/${reg.data.user.id}`, { token: A, method: 'PATCH', body: { role: 'moderator' } })).status === 403, 'super tidak bisa ubah role (owner-only)');
  ok((await api(`/admin/users/${reg.data.user.id}`, { token: O, method: 'PATCH', body: { role: 'moderator' } })).status === 200, 'owner bisa ubah role');

  console.log('• permission per role + 2FA PIN');
  const agen = await api('/admin/users', { token: O, method: 'POST', body: { username: 'agen1', password: 'agen1', isAdmin: true } });
  const agenLogin = await api('/auth/login', { method: 'POST', body: { username: 'agen1', password: 'agen1' } });
  ok(agenLogin.data.user.role === 'agent', 'akses admin otomatis role agent');
  const AG = agenLogin.data.token;
  ok((await api('/admin/conversations', { token: AG })).status === 200, 'agent boleh inbox');
  ok((await api('/admin/users', { token: AG, method: 'POST', body: { username: 'x1', password: 'x1x1' } })).status === 403, 'agent tidak bisa create user');
  ok((await api(`/admin/users/${agen.data.user.id}`, { token: O, method: 'PATCH', body: { adminPin: '4321' } })).status === 200, 'owner set PIN 2FA agen');
  ok((await api('/admin/stats', { token: AG })).status === 401, 'tanpa PIN = 401 PIN_REQUIRED');
  const r2 = await fetch(`${BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${AG}`, 'x-admin-pin': '4321' } });
  ok(r2.status === 200, 'dengan PIN = 200');

  console.log('• moderasi: filter kata, block, spam-flag');
  await api('/admin/filters', { token: A, method: 'POST', body: { word: 'bodoh' } });
  const warga = await api('/auth/register', { method: 'POST', body: { username: 'warga1', password: 'warga1' } });
  const W = warga.data.token;
  const nc = await api('/conversations', { token: W, method: 'POST', body: { type: 'private', username: 'xerophisuser' } });
  const ncid = nc.data.conversationId;
  const sentCensor = await api(`/conversations/${ncid}/messages`, { token: W, method: 'POST', body: { body: 'kamu bodoh banget' } });
  ok(sentCensor.data.message.body.includes('♥') && !sentCensor.data.message.body.includes('bodoh'), 'kata terlarang disensor ♥');
  ok((await api(`/admin/users/${reg.data.user.id}`, { token: O, method: 'PATCH', body: { blocked: true } })).status === 200, 'owner blokir pengguna');
  ok((await api('/auth/login', { method: 'POST', body: { username: 'tester2', password: 'secret2' } })).status === 403, 'login terblokir 403');
  ok((await api(`/conversations/${ncid}/messages`, { token: B, method: 'POST', body: { body: 'coba kirim' } })).status === 403, 'kirim pesan terblokir 403');
  await api(`/admin/users/${reg.data.user.id}`, { token: O, method: 'PATCH', body: { blocked: false } });

  console.log('• inbox: pin, notes, tag, handover');
  const pinR = await api(`/admin/messages/${sentCensor.data.message.id}/pin`, { token: A, method: 'POST', body: { pinned: true } });
  ok(pinR.status === 200, 'admin sematkan pesan');
  const metaP = await api(`/conversations/${ncid}`, { token: A });
  ok(metaP.data.conversation.pinned?.id === sentCensor.data.message.id, 'klien melihat banner pinned');
  await api(`/admin/conversations/${ncid}/notes`, { token: A, method: 'POST', body: { body: 'Prospek panas, follow up besok' } });
  await api(`/admin/conversations/${ncid}/tag`, { token: A, method: 'POST', body: { tag: 'Prospek' } });
  await api(`/admin/conversations/${ncid}/assign`, { token: A, method: 'POST', body: { adminId: login.data.user.id } });
  const inboxList = (await api('/admin/conversations', { token: A })).data.conversations;
  const ncm = inboxList.find((c) => c.id === ncid);
  ok(ncm?.tag === 'Prospek' && ncm?.assignedTo === login.data.user.id, 'tag + handover tersimpan');
  const notesR = (await api(`/admin/conversations/${ncid}/notes`, { token: A })).data.notes;
  ok(notesR.length === 1 && notesR[0].body.includes('Prospek panas'), 'catatan internal tersimpan');

  console.log('• otomasi: auto-reply & quick replies');
  await api('/admin/autorules', { token: O, method: 'POST', body: { keyword: 'harga', reply: 'Mulai Rp100k ya kak 🔥' } });
  const devConv2 = (await api('/conversations', { token: A })).data.conversations.find((c) => c.counterpart?.username === 'xerophis');
  const ruleP = waitWS(wsA, (m) => m.type === 'message:new' && m.conversationId === devConv2.id && m.message.body.includes('Rp100k'), 8000);
  await api(`/conversations/${devConv2.id}/messages`, { token: A, method: 'POST', body: { body: 'boleh info harga?' } });
  await ruleP; ok(true, 'auto-reply keyword jalan di bot');
  await api('/admin/quickreplies', { token: O, method: 'POST', body: { title: 'Sapaan', body: 'Halo kak, ada yang bisa dibantu? 🔥' } });
  ok((await api('/quick', { token: A })).data.quick.length === 1, 'quick reply tersedia di composer admin');

  console.log('• siaran terjadwal + laporan + pengumuman');
  await api('/admin/broadcast', { token: A, method: 'POST', body: { text: 'Siaran terjadwal uji', sendAt: new Date(Date.now() + 1000).toISOString() } });
  const annR = await api('/admin/announce', { token: O, method: 'POST', body: { text: 'Maintenance 23.00 WIB' } });
  ok(annR.status === 200 && (await fetch(`${BASE}/api/announce`).then((r) => r.json())).text.includes('Maintenance'), 'banner pengumuman aktif');
  await new Promise((r) => setTimeout(r, 12000));
  const bcast = (await api('/admin/broadcasts', { token: A })).data.broadcasts;
  const sched = bcast.find((b) => b.text === 'Siaran terjadwal uji');
  ok(sched?.status === 'sent' && sched.sent_count >= 3, `siaran terjadwal terkirim (${sched?.sent_count}, dibaca ${sched?.read_count})`);
  await api('/admin/announce', { token: O, method: 'POST', body: { text: '' } });

  console.log('• analitik, backup, CSV, sesi, sistem');
  const an = (await api('/admin/analytics', { token: A })).data.analytics;
  ok(an.perHour.length === 24 && an.agents.length >= 2, 'analitik traffic & kinerja agen');
  const bk = (await api('/admin/backup', { token: O })).data;
  ok(bk.users.length >= 8 && Array.isArray(bk.messages), 'backup JSON lengkap');
  const csv = await fetch(`${BASE}/api/admin/export/users.csv`, { headers: { Authorization: `Bearer ${O}` } }).then((r) => r.text());
  ok(csv.startsWith('id,username'), 'ekspor CSV kontak');
  const imp = await api('/admin/import/users', { token: A, method: 'POST', body: { csv: 'username,display_name,phone,about\nbudi,Budi Santoso,+62,hai' } });
  ok(imp.data.created === 1, 'impor CSV membuat pengguna');
  ok((await api('/auth/login', { method: 'POST', body: { username: 'budi', password: 'xerophis' } })).status === 200, 'user impor bisa login');
  const sess = (await api('/admin/sessions', { token: O })).data.sessions;
  ok(sess.length >= 4, 'daftar sesi multi-device');
  await api(`/admin/sessions/${encodeURIComponent(AG)}`, { token: O, method: 'DELETE' });
  ok((await fetch(`${BASE}/api/me`, { headers: { Authorization: `Bearer ${AG}` } })).status === 401, 'sesi agen dicabut');
  const sys = (await api('/admin/system', { token: O })).data.system;
  ok(sys.memory.rss > 0 && Array.isArray(sys.errors) && sys.dbSize > 0, 'inspector: memori/uptime/DB/error log');

  console.log('• interactive builder, CSAT, revenue, segmentasi');
  const irep = await api(`/admin/conversations/${ncid}/reply`, { token: A, method: 'POST', body: { body: 'Silakan pilih:', buttons: [{ label: 'Beli Sekarang' }, { label: 'Katalog' }] } });
  ok(irep.status === 201 && irep.data.message.buttons.length === 2, 'pesan interaktif + 2 tombol CTA');
  const imsgs = (await api(`/admin/conversations/${ncid}/messages`, { token: A })).data.messages;
  ok(imsgs.some((m) => m.id === irep.data.message.id && m.buttons?.length === 2), 'tombol tersimpan & ter-serialisasi');
  const csatSend = await api(`/admin/conversations/${ncid}/csat`, { token: A, method: 'POST' });
  ok(csatSend.status === 201 && csatSend.data.message.buttons.length === 5, 'survei CSAT 5 rating');
  ok((await api(`/conversations/${ncid}/rating`, { token: W, method: 'POST', body: { rating: 5 } })).status === 200, 'pengguna kirim rating');
  ok((await api(`/conversations/${ncid}/rating`, { token: W, method: 'POST', body: { rating: 9 } })).status === 400, 'rating divalidasi 1-5');
  ok((await api('/admin/transactions', { token: A, method: 'POST', body: { userId: warga.data.user.id, amount: 150000, note: 'Paket premium' } })).status === 201, 'revenue: catat transaksi');
  await api(`/admin/users/${warga.data.user.id}`, { token: A, method: 'PATCH', body: { customFields: { alamat: 'Bandung', ttl: '1999-01-01' } } });
  const uW = (await api('/admin/users?q=warga1', { token: A })).data.users;
  ok(uW[0]?.customFields?.alamat === 'Bandung', 'custom contact fields di CRM');
  const segAll = await api('/admin/broadcast', { token: A, method: 'POST', body: { text: 'segmen semua' } });
  const segTag = await api('/admin/broadcast', { token: A, method: 'POST', body: { text: 'segmen prospek', target: 'tag:Prospek' } });
  ok(segTag.data.count >= 1 && segTag.data.count < segAll.data.count, `segmentasi audiens (${segTag.data.count} < ${segAll.data.count})`);
  const an2 = (await api('/admin/analytics', { token: A })).data.analytics;
  ok(an2.revenue.total >= 150000, 'analitik revenue total');
  ok(an2.csat.length >= 1 && Number(an2.csat[0].avg) === 5, 'analitik CSAT rata-rata 5');

  console.log('• batch-3: starred, jam kerja, anti-phising, rotasi, backup, shift');
  const starR = await api(`/messages/${sentCensor.data.message.id}/star`, { token: A, method: 'POST', body: {} });
  ok(starR.data.starred === true, 'pesan dibintangi');
  ok((await api('/stars', { token: A })).data.stars.some((s) => s.id === sentCensor.data.message.id), 'daftar pesan berbintang');
  const fmtHM = (x) => `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
  await api('/admin/settings', { token: O, method: 'POST', body: { businessHours: { enabled: true, start: fmtHM(new Date(Date.now() + 2 * 36e5)), end: fmtHM(new Date(Date.now() + 3 * 36e5)), reply: 'OUT-OF-HOURS-REPLY' } } });
  const oohP = waitWS(wsA, (m) => m.type === 'message:new' && m.conversationId === devConv2.id && m.message.body === 'OUT-OF-HOURS-REPLY', 8000);
  await api(`/conversations/${devConv2.id}/messages`, { token: A, method: 'POST', body: { body: 'tes jam kerja' } });
  await oohP; ok(true, 'auto-reply luar jam kerja jalan');
  await api('/admin/settings', { token: O, method: 'POST', body: { businessHours: { enabled: false }, blockLinks: true } });
  const phish = await api(`/conversations/${ncid}/messages`, { token: W, method: 'POST', body: { body: 'klik http://evil.example/phish sekarang' } });
  ok(phish.data.message.body.includes('♥') && !phish.data.message.body.includes('http'), 'tautan phising disensor');
  await api('/admin/settings', { token: O, method: 'POST', body: { blockLinks: false, rotationPool: ['rehan', 'husni'] } });
  await api('/admin/broadcast', { token: A, method: 'POST', body: { text: 'rotasi uji' } });
  const rotMsgs = (await api('/admin/messages?limit=100', { token: A })).data.messages.filter((m) => m.body.includes('rotasi uji'));
  ok(new Set(rotMsgs.map((m) => m.sender_id)).size >= 2, `anti-ban: pengirim siaran terotasi (${new Set(rotMsgs.map((m) => m.sender_id)).size} pengirim)`);
  const bkRun = await api('/admin/backup/run', { token: O, method: 'POST' });
  ok(bkRun.status === 200 && bkRun.data.name.startsWith('backup-'), 'backup manual ditulis');
  const bkList = (await api('/admin/backups', { token: O })).data.backups;
  ok(bkList.some((b) => b.name === bkRun.data.name), 'backup terdaftar (berkala 6 jam + manual)');
  await api(`/admin/users/${warga.data.user.id}`, { token: A, method: 'PATCH', body: { shiftStart: '08:00', shiftEnd: '16:00' } });
  const uW2 = (await api('/admin/users?q=warga1', { token: A })).data.users;
  ok(uW2[0]?.shiftStart === '08:00' && uW2[0]?.shiftEnd === '16:00', 'penjadwalan shift agen tersimpan');

  console.log('• updates / channels / communities / calls');
  const up = (await api('/updates', { token: A })).data;
  ok(up.contacts.length >= 3, `feed status kontak seeded (${up.contacts.length})`);
  ok(up.channels.some((c) => c.title === 'X Studio Channel' && c.following), 'saluran seeded + diikuti');
  ok((await api('/status', { token: A, method: 'POST', body: { body: 'Status merah menyala 🔥' } })).status === 201, 'post status');
  const upW = (await api('/updates', { token: W })).data;
  const meBlock = upW.contacts.find((c) => c.user.id === login.data.user.id);
  ok(meBlock?.unseen >= 1, 'kontak melihat status baru (unseen badge)');
  await api(`/status/${meBlock.statuses[meBlock.statuses.length - 1].id}/view`, { token: W, method: 'POST' });
  ok((await api('/updates', { token: W })).data.contacts.find((c) => c.user.id === login.data.user.id).unseen === 0, 'status ditandai dilihat');
  const chNew = await api('/channels', { token: A, method: 'POST', body: { title: 'Squad Merah' } });
  ok(chNew.status === 201, 'buat saluran');
  ok((await api(`/channels/${chNew.data.channelId}/posts`, { token: A, method: 'POST', body: { body: 'Post pertama!' } })).status === 201, 'owner posting ke saluran');
  ok((await api(`/channels/${chNew.data.channelId}/posts`, { token: B, method: 'POST', body: { body: 'x' } })).status === 403, 'non-owner dilarang posting');
  await api(`/channels/${chNew.data.channelId}/follow`, { token: W, method: 'POST', body: { on: true } });
  ok((await api('/channels', { token: W })).data.channels.find((c) => c.id === chNew.data.channelId).following, 'follow saluran');
  const coms = (await api('/communities', { token: A })).data.communities;
  ok(coms.some((c) => c.title === 'Xerophis Community' && c.groups === 2), 'komunitas seeded (2 grup)');
  const comNew = await api('/communities', { token: W, method: 'POST', body: { title: 'Komunitas Warga' } });
  await api(`/communities/${comNew.data.communityId}/join`, { token: A, method: 'POST', body: { on: true } });
  ok((await api(`/communities/${comNew.data.communityId}`, { token: A })).data.community.members.includes('Xerophis User'), 'join komunitas');
  const offerP = waitWS(wsB, (m) => m.type === 'call:offer');
  const callR = await api('/calls/offer', { token: A, method: 'POST', body: { calleeId: reg.data.user.id, kind: 'voice' } });
  ok(callR.status === 201, 'tawaran panggilan');
  await offerP; ok(true, 'offer sampai via WS');
  const accP = waitWS(wsA, (m) => m.type === 'call:accept');
  await api(`/calls/${callR.data.call.id}/accept`, { token: B, method: 'POST' });
  await accP; ok(true, 'accept sampai via WS');
  await new Promise((r) => setTimeout(r, 1100));
  const endR = await api(`/calls/${callR.data.call.id}/end`, { method: 'POST', token: A });
  ok(endR.data.call.status === 'completed' && endR.data.call.duration_sec >= 1, `panggilan selesai (${endR.data.call.duration_sec} dtk)`);
  ok((await api('/calls', { token: B })).data.calls.some((c) => c.id === callR.data.call.id && c.status === 'completed'), 'riwayat panggilan');
  const callM = await api('/calls/offer', { token: A, method: 'POST', body: { calleeId: reg.data.user.id } });
  await api(`/calls/${callM.data.call.id}/end`, { token: A, method: 'POST' });
  ok((await api('/calls', { token: A })).data.calls.some((c) => c.id === callM.data.call.id && c.status === 'missed'), 'tak dijawab = missed');

  console.log('• media, fraud-detect, owner vall, PWA');
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const upl = await api('/media', { token: A, method: 'POST', body: { dataUrl: png } });
  ok(upl.status === 201 && upl.data.mediaId, 'unggah media (png)');
  const mediaMsg = await api(`/conversations/${ncid}/messages`, { token: A, method: 'POST', body: { body: 'cek lampiran', mediaId: upl.data.mediaId } });
  ok(mediaMsg.data.message.mediaId === upl.data.mediaId, 'pesan membawa media');
  const mr = await fetch(`${BASE}/api/media/${upl.data.mediaId}?token=${A}`);
  ok(mr.status === 200 && (mr.headers.get('content-type') || '').includes('image/png'), 'berkas media tersaji dgn mime benar');
  ok((await fetch(`${BASE}/api/media/${upl.data.mediaId}`)).status === 401, 'media dilindungi auth');
  const spam = await api('/auth/register', { method: 'POST', body: { username: 'spammer', password: 'spammer' } });
  const S = spam.data.token;
  const sameBody = 'PROMO JUTAAN RUPIAH KLIK SEKARANG';
  for (const uname of ['rehan', 'husni', 'noval']) {
    const cv = await api('/conversations', { token: S, method: 'POST', body: { type: 'private', username: uname } });
    await api(`/conversations/${cv.data.conversationId}/messages`, { token: S, method: 'POST', body: { body: sameBody } });
  }
  const cv4 = await api('/conversations', { token: S, method: 'POST', body: { type: 'private', username: 'rifki' } });
  const fraud = await api(`/conversations/${cv4.data.conversationId}/messages`, { token: S, method: 'POST', body: { body: sameBody } });
  ok(fraud.status === 429, 'fraud: pesan identik ke 4 chat = 429');
  const spList = (await api('/admin/users?q=spammer', { token: O })).data.users;
  ok(spList[0]?.flagged === true, 'akun spam auto-flag');
  const vall = await api('/auth/login', { method: 'POST', body: { username: 'vall', password: 'vall' } });
  ok(vall.status === 200 && vall.data.user.role === 'owner' && vall.data.user.title === 'Developer Xerophis', 'vall = owner otomatis + title');
  ok((await fetch(`${BASE}/manifest.webmanifest`)).status === 200, 'PWA manifest');
  ok((await fetch(`${BASE}/sw.js`)).status === 200, 'PWA service worker');

  console.log('• reaksi, balas, teruskan, semat (user)');
  const reactA = await api(`/messages/${sentCensor.data.message.id}/react`, { token: A, method: 'POST', body: { emoji: '🔥' } });
  ok(reactA.data.reactions.length === 1, 'reaksi pertama');
  await api(`/messages/${sentCensor.data.message.id}/react`, { token: W, method: 'POST', body: { emoji: '👍' } });
  const reactSw = await api(`/messages/${sentCensor.data.message.id}/react`, { token: A, method: 'POST', body: { emoji: '❤️' } });
  ok(reactSw.data.reactions.length === 2, 'reaksi kedua pengguna (swap emoji per user)');
  const withRx = (await api(`/conversations/${ncid}/messages`, { token: A })).data.messages.find((m) => m.id === sentCensor.data.message.id);
  ok(withRx.reactions.length === 2, 'reaksi ter-serialisasi di list pesan');
  await api(`/messages/${sentCensor.data.message.id}/react`, { token: A, method: 'POST', body: { emoji: '' } });
  ok((await api(`/messages/${sentCensor.data.message.id}/react`, { token: A, method: 'POST', body: { emoji: '' } })).status === 200, 'hapus reaksi');
  const replyM = await api(`/conversations/${ncid}/messages`, { token: W, method: 'POST', body: { body: 'menjawab ini', replyTo: sentCensor.data.message.id } });
  ok(replyM.data.message.replyTo === sentCensor.data.message.id, 'pesan balasan membawa quote');
  ok((await api(`/conversations/${ncid}/messages`, { token: W, method: 'POST', body: { body: 'x', replyTo: 999999 } })).status === 400, 'replyTo divalidasi');
  const fwd = await api(`/messages/${sentCensor.data.message.id}/forward`, { token: A, method: 'POST', body: { toConversationId: devConv2.id } });
  ok(fwd.status === 201 && fwd.data.message.forwarded === true, 'teruskan pesan (flag forwarded)');
  ok((await api(`/conversations/${devConv2.id}/messages`, { token: A })).data.messages.some((m) => m.id === fwd.data.message.id), 'pesan terusan sampai di tujuan');
  await api(`/conversations/${ncid}/pin`, { token: W, method: 'POST', body: { messageId: sentCensor.data.message.id, pinned: true } });
  ok((await api(`/conversations/${ncid}`, { token: W })).data.conversation.pinned?.id === sentCensor.data.message.id, 'anggota bisa sematkan pesan');

  console.log('• onboarding akun baru (tidak pernah kosong)');
  const baru = await api('/auth/register', { method: 'POST', body: { username: 'anakbaru', password: 'anakbaru' } });
  const NB = baru.data.token;
  const convsNB = (await api('/conversations', { token: NB })).data.conversations;
  ok(convsNB.some((c) => c.title === 'Xerophis Lounge'), 'user baru otomatis masuk Lounge');
  ok(convsNB.some((c) => c.counterpart?.username === 'xerophis'), 'user baru dapat welcome DM bot');
  const upNB = (await api('/updates', { token: NB })).data;
  ok(upNB.channels.some((c) => c.title === 'X Official' && c.following), 'user baru mengikuti X Official');
  const loungeMsgs = (await api(`/conversations/${convsNB.find((c) => c.title === 'Xerophis Lounge').id}/messages`, { token: NB })).data.messages;
  ok(loungeMsgs.length >= 1, 'Lounge berisi warga lain');

  console.log('• media-only & proteksi owner');
  const png2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const upl2 = await api('/media', { token: A, method: 'POST', body: { dataUrl: png2 } });
  const mm = await api(`/conversations/${ncid}/messages`, { token: A, method: 'POST', body: { mediaId: upl2.data.mediaId } });
  ok(mm.status === 201 && mm.data.message.body === '📷', 'pesan hanya-gambar sah (bug 400 dulu)');
  const webm = 'data:audio/webm;base64,GkXfo0Ag'; // header kecil cukup utk validasi MIME
  const upA = await api('/media', { token: A, method: 'POST', body: { dataUrl: webm } });
  ok(upA.status === 201, 'unggah audio (pesan suara) diterima');
  const vm = await api(`/conversations/${ncid}/messages`, { token: A, method: 'POST', body: { mediaId: upA.data.mediaId } });
  ok(vm.data.message.mediaMime === 'audio/webm', 'bubble dapat mediaMime audio');
  const avUp = await api('/media', { token: A, method: 'POST', body: { dataUrl: png2 } });
  const avP = await api('/me', { token: A, method: 'PATCH', body: { avatarUrl: `/media/${avUp.data.mediaId}` } });
  ok(avP.data.user.avatarUrl?.startsWith('/media/'), 'foto profil tersimpan');
  ok((await api('/me', { token: A })).data.user.avatarUrl?.startsWith('/media/'), 'avatarUrl kebaca di /me');
  const ed = await api(`/messages/${mm.data.message.id}`, { token: A, method: 'PATCH', body: { body: 'foto diedit' } });
  ok(ed.status === 200 && ed.data.message.edited === true, 'edit pesan sendiri (+flag diedit)');
  ok((await api(`/messages/${mm.data.message.id}`, { token: W, method: 'PATCH', body: { body: 'hack' } })).status === 403, 'edit hanya boleh pengirim');
  console.log('• manajemen grup & reset password via OTP');
  const grp2 = (await api('/conversations', { token: A, method: 'POST', body: { type: 'group', title: 'Squad Uji', members: [] } })).data.conversationId;
  await api(`/conversations/${grp2}/members`, { token: A, method: 'POST', body: { username: 'warga1' } });
  ok((await api(`/conversations/${grp2}`, { token: W })).data.members.length === 2, 'tambah anggota grup');
  await api(`/conversations/${grp2}`, { token: A, method: 'PATCH', body: { title: 'Squad Uji 2' } });
  ok((await api(`/conversations/${grp2}`, { token: W })).data.conversation.title === 'Squad Uji 2', 'ganti nama grup');
  ok((await api(`/conversations/${grp2}/members`, { token: W, method: 'POST', body: { username: 'rehan' } })).status === 403, 'non-admin grup ditolak');
  const rq0 = await api('/auth/otp/request', { method: 'POST', body: { email: 'resetme@contoh.id' } });
  const rv0 = await api('/auth/otp/verify', { method: 'POST', body: { email: 'resetme@contoh.id', code: rq0.data.dev } });
  ok(rv0.status === 200, 'akun email utk reset dibuat');
  const rq = await api('/auth/otp/request', { method: 'POST', body: { email: 'resetme@contoh.id' } });
  ok((await api('/auth/reset', { method: 'POST', body: { email: 'resetme@contoh.id', code: rq.data.dev, newPassword: 'warjabaru' } })).status === 200, 'reset password via OTP');
  ok((await api('/auth/login', { method: 'POST', body: { username: rv0.data.user.username, password: 'warjabaru' } })).status === 200, 'login dengan password baru');

  console.log('• kontak mutual = syarat tambah grup');
  const rehanTok = (await api('/auth/login', { method: 'POST', body: { username: 'rehan', password: 'xerophis' } })).data.token;
  const grp3 = (await api('/conversations', { token: W, method: 'POST', body: { type: 'group', title: 'Squad Mutual', members: [] } })).data.conversationId;
  await api('/contacts', { token: W, method: 'POST', body: { username: 'rehan' } });
  const nonMutual = await api(`/conversations/${grp3}/members`, { token: W, method: 'POST', body: { username: 'rehan' } });
  ok(nonMutual.status === 403, 'sepihak simpan = ditolak (harus sv-sv-an)');
  await api('/contacts', { token: rehanTok, method: 'POST', body: { username: 'warga1' } });
  ok((await api(`/conversations/${grp3}/members`, { token: W, method: 'POST', body: { username: 'rehan' } })).status === 201, 'mutual = boleh tambah ke grup');

  const squat = await api('/auth/register', { method: 'POST', body: { username: 'noval', password: 'noval123' } });
  ok(squat.status === 409 || (squat.data.user && squat.data.user.role !== 'owner'), 'username owner tak bisa diklaim pendaftar');
  const ownLogin = await api('/auth/login', { method: 'POST', body: { username: 'pall', password: 'pall' } });
  ok((await api(`/admin/users/${ownLogin.data.user.id}`, { token: A, method: 'PATCH', body: { blocked: true } })).status === 403, 'super-admin tak bisa sentuh akun owner');

  console.log('• OTP email, E2EE, WebRTC signaling, push');
  ok((await api('/auth/otp/request', { method: 'POST', body: { email: 'test@mailinator.com' } })).status === 403, 'temp-mail diblokir');
  ok((await api('/auth/otp/request', { method: 'POST', body: { email: 'budi@temp-mail.org' } })).status === 403, 'heuristik temp-mail diblokir');
  ok((await api('/auth/otp/request', { method: 'POST', body: { email: 'salahformat' } })).status === 400, 'format email divalidasi');
  const otpR = await api('/auth/otp/request', { method: 'POST', body: { email: 'warga1@contoh.id' } });
  ok(otpR.status === 200 && !!otpR.data.dev, 'OTP dibuat (mode dev: devCode)');
  const otpV = await api('/auth/otp/verify', { method: 'POST', body: { email: 'warga1@contoh.id', code: otpR.data.dev } });
  ok(otpV.status === 200 && otpV.data.user.email === 'warga1@contoh.id' && otpV.data.token, 'verifikasi OTP = akun + sesi');
  ok((await api('/auth/otp/verify', { method: 'POST', body: { email: 'warga1@contoh.id', code: '000000' } })).status === 400, 'OTP sekali pakai');

  const e2eMod = await import(`file://${path.resolve(__dirname, '../public/e2ee.js')}`);
  const pA = await e2eMod.generatePair();
  const pB = await e2eMod.generatePair();
  await api('/keys', { token: A, method: 'POST', body: { pubkey: pA.pubB64 } });
  await api('/keys', { token: B, method: 'POST', body: { pubkey: pB.pubB64 } });
  const pubB = (await api(`/keys/${reg.data.user.id}`, { token: A })).data.pubkey;
  ok(pubB === pB.pubB64, 'pubkey E2EE tersimpan & terdistribusi');
  const pc2 = (await api('/conversations', { token: A, method: 'POST', body: { type: 'private', username: 'tester2' } })).data.conversationId;
  const keyA = await e2eMod.sharedKey(pA.priv, pubB);
  const ct = await e2eMod.encryptText(keyA, 'rahasia e2e 🔐');
  await api(`/conversations/${pc2}/messages`, { token: A, method: 'POST', body: { body: ct, enc: 1 } });
  const stored = (await api(`/conversations/${pc2}/messages`, { token: B })).data.messages.find((m) => m.enc);
  ok(stored && stored.body === ct && !stored.body.includes('rahasia'), 'server hanya menyimpan ciphertext');
  const keyB = await e2eMod.sharedKey(pB.priv, (await api(`/keys/${login.data.user.id}`, { token: B })).data.pubkey);
  ok((await e2eMod.decryptText(keyB, stored.body)) === 'rahasia e2e 🔐', 'penerima mendekripsi E2EE');
  const convsB2 = (await api('/conversations', { token: B })).data.conversations;
  ok(convsB2.find((c) => c.id === pc2)?.lastMessage?.enc === true, 'list chat: flag enc, preview bukan ciphertext');

  const rtcP = waitWS(wsB, (m) => m.type === 'rtc' && m.from === login.data.user.id);
  wsA.send(JSON.stringify({ type: 'rtc', to: reg.data.user.id, payload: { t: 'offer', sdp: 'x' } }));
  const rtcM = await rtcP; ok(rtcM.payload.t === 'offer', 'signaling WebRTC direlay WS');

  const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const hits = { n: 0 };
  const pushSrv = require('node:http').createServer((req, res) => { hits.n++; res.end('ok'); });
  await new Promise((r) => pushSrv.listen(3499, r));
  const pk = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pk.publicKey));
  const sub = { endpoint: 'http://127.0.0.1:3499/push', keys: { p256dh: b64url(raw), auth: b64url(require('node:crypto').randomBytes(16)) } };
  ok((await api('/push/subscribe', { token: W, method: 'POST', body: { subscription: sub } })).status === 201, 'push subscribe tersimpan');
  ok((await api('/push/vapid', { token: W })).data.publicKey.length > 40, 'VAPID public key');
  await api(`/conversations/${ncid}/messages`, { token: A, method: 'POST', body: { body: 'ping push offline' } });
  await new Promise((r) => setTimeout(r, 1200));
  ok(hits.n >= 1, `push terkirim ke endpoint pengguna offline (${hits.n})`);
  await api('/calls/offer', { token: A, method: 'POST', body: { calleeId: warga.data.user.id, kind: 'voice' } });
  await new Promise((r) => setTimeout(r, 1000));
  ok(hits.n >= 2, `push panggilan masuk utk pengguna offline (${hits.n})`);
  pushSrv.close();

  const sr = await api(`/search?q=sjap`, { token: A });
  ok(sr.data.results.length >= 1 && sr.data.results[0].cid, 'pencarian isi pesan (spec 18)');

  console.log('• kontak via email, blokir personal, profil, password');
  const viaEmail = await api('/conversations', { token: A, method: 'POST', body: { type: 'private', email: 'warga1@contoh.id' } });
  ok(viaEmail.status === 201, 'tambah kontak via email (kayak WA pakai nomor)');
  const inv = await api('/invite', { token: A, method: 'POST', body: { email: 'teman.baru@contoh.id' } });
  ok(inv.status === 200, 'undang email belum terdaftar');
  ok((await api('/invite', { token: A, method: 'POST', body: { email: 'warga1@contoh.id' } })).status === 409, 'invite email terdaftar = 409');
  await api('/blocks', { token: W, method: 'POST', body: { email: 'xerophisuser@example.com', on: true } }).catch(() => {});
  await api('/blocks', { token: W, method: 'POST', body: { username: 'xerophisuser', on: true } });
  const blockedSend = await api(`/conversations/${ncid}/messages`, { token: A, method: 'POST', body: { body: 'halo?' } });
  ok(blockedSend.status === 403, 'pengirim diblokir = 403');
  await api('/blocks', { token: W, method: 'POST', body: { username: 'xerophisuser', on: false } });
  ok((await api('/blocks', { token: W })).data.blocks.length === 0, 'buka blokir');
  const pf = await api('/me', { token: A, method: 'PATCH', body: { avatarText: 'ZZ', about: 'status baru' } });
  ok(pf.data.user.avatarText === 'ZZ', 'ganti avatar/profil sendiri');
  await api('/me', { token: A, method: 'PATCH', body: { avatarText: '99', about: 'Hey there! I am using Xerophis.' } });
  await api('/auth/password', { token: A, method: 'POST', body: { current: 'xerophis', next: 'xerophis2' } });
  ok((await api('/auth/login', { method: 'POST', body: { username: 'xerophisuser', password: 'xerophis2' } })).status === 200, 'ganti password berhasil');
  ok((await api('/auth/login', { method: 'POST', body: { username: 'xerophisuser', password: 'xerophis' } })).status === 401, 'password lama ditolak');
  await api('/auth/password', { token: A, method: 'POST', body: { current: 'xerophis2', next: 'xerophis' } });

  console.log('• perangkat tertaut & bisukan chat');
  const ses = (await api('/sessions', { token: A })).data.sessions;
  ok(ses.length >= 1 && !!ses[0].device, `sesi merekam perangkat tertaut (${ses[0].device})`);
  await api(`/conversations/${ncid}/mute`, { token: A, method: 'POST', body: { muted: true } });
  ok((await api(`/conversations/${ncid}/mute`, { token: A })).data.muted === true, 'bisukan chat tersimpan');
  await api(`/conversations/${ncid}/mute`, { token: A, method: 'POST', body: { muted: false } });

  wsA.close(); wsB.close();
  server.kill();
  fs.rmSync(tmpDb, { force: true });
  if (ep) await ep.stop().catch(() => {});
  console.log(`\nALL ${passed} CHECKS PASSED (${USE_PG ? 'PostgreSQL' : 'SQLite'})`);
  process.exit(0);
}

main().catch((e) => { console.error('TEST FAIL:', e.message); process.exit(1); });
process.on('exit', () => { try { require('node:child_process').execSync('pkill -f "server/index.js" || true'); } catch {} });
