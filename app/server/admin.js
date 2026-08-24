'use strict';
/**
 * Xerophis King Panel — API admin.
 * Role hierarchy: owner > super > moderator > agent / keuangan.
 * Owner (pall/noval/vall) = bypass total + title "Developer Xerophis".
 * 2FA: bila admin punya admin_pin, setiap request wajib header x-admin-pin (owner kebal).
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('node:fs');
const os = require('node:os');
const dbx = require('./db');
const hub = require('./wsHub');
const ring = require('./ring');

const router = express.Router();

const PERMS = {
  'users.manage': ['owner', 'super'],
  'roles.manage': ['owner'],
  'brand': ['owner', 'super'],            // verified badge & custom title
  'moderation': ['owner', 'super', 'moderator'],
  'inbox': ['owner', 'super', 'moderator', 'agent'],
  'broadcast': ['owner', 'super', 'moderator'],
  'reports': ['owner', 'super', 'moderator', 'keuangan'],
  'finance': ['owner', 'super', 'keuangan'],
  'system': ['owner', 'super'],
};
const can = (user, perm) => user.role === 'owner' || (PERMS[perm] || []).includes(user.role);

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Akses admin ditolak.' });
  const row = dbx.db.prepare('SELECT admin_pin FROM users WHERE id = ?').get(req.user.id);
  if (row?.admin_pin && req.user.role !== 'owner' && req.headers['x-admin-pin'] !== row.admin_pin) {
    return res.status(401).json({ error: 'PIN_REQUIRED' });
  }
  next();
}
function requirePerm(perm) {
  return (req, res, next) => {
    if (!can(req.user, perm)) return res.status(403).json({ error: `Role ${req.user.role} tidak punya izin "${perm}".` });
    next();
  };
}
router.use(require('./auth').requireAuth, requireAdmin);

/* ---------- ringkasan & log ---------- */
router.get('/stats', async (req, res) => {
  const s = await dbx.stats();
  res.json({ stats: { ...s, online: hub.onlineIds().length }, role: req.user.role, perms: Object.keys(PERMS).filter((p) => can(req.user, p)) });
});
router.get('/logs', async (req, res) => res.json({ logs: await dbx.listAdminLogs() }));

/* ---------- pengguna ---------- */
router.get('/users', requirePerm('inbox'), async (req, res) => {
  const users = await dbx.adminListUsers(String(req.query.q || ''));
  res.json({ users });
});
router.post('/users', requirePerm('users.manage'), async (req, res) => {
  const { username, password, displayName, about, isAdmin, role } = req.body || {};
  if (!username || !/^[a-zA-Z0-9+._-]{3,24}$/.test(String(username))) return res.status(400).json({ error: 'Username tidak valid.' });
  if (!password || String(password).length < 4) return res.status(400).json({ error: 'Password minimal 4 karakter.' });
  if (await dbx.getUserByUsername(username)) return res.status(409).json({ error: 'Username sudah dipakai.' });
  if (role === 'owner' && req.user.role !== 'owner') return res.status(403).json({ error: 'Hanya owner yang bisa membuat owner.' });
  const user = await dbx.createUser({
    username: String(username), passwordHash: await bcrypt.hash(String(password), 10),
    displayName: displayName || String(username), about, isAdmin: !!isAdmin,
  });
  if (isAdmin) await dbx.adminUpdateUser(user.id, { role: role || 'agent', isAdmin: true });
  dbx.logAdmin(req.user.id, 'user.create', `@${username}`);
  res.status(201).json({ user: await dbx.getUserById(user.id) });
});
router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const target = await dbx.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  const b = req.body || {};
  const roleChanged = b.role !== undefined && b.role !== target.role;
  const wants = {
    profile: b.displayName !== undefined || b.about !== undefined || b.phone !== undefined || b.crmNote !== undefined || b.customFields !== undefined,
    brand: b.verified !== undefined || b.title !== undefined,
    mod: b.blocked !== undefined || b.flagged !== undefined,
    pin: b.adminPin !== undefined,
    shift: b.agentStatus !== undefined,
  };
  if (wants.profile && !can(req.user, 'users.manage') && id !== req.user.id) return res.status(403).json({ error: 'Tidak punya izin users.manage.' });
  if (roleChanged && !can(req.user, 'roles.manage')) return res.status(403).json({ error: 'Hanya owner yang mengatur role.' });
  if (!roleChanged && b.isAdmin !== undefined && !can(req.user, 'users.manage')) return res.status(403).json({ error: 'Tidak punya izin users.manage.' });
  if (wants.brand && !can(req.user, 'brand')) return res.status(403).json({ error: 'Tidak punya izin brand (verified/title).' });
  if (wants.mod && !can(req.user, 'moderation')) return res.status(403).json({ error: 'Tidak punya izin moderation.' });
  if (wants.pin && id !== req.user.id && req.user.role !== 'owner') return res.status(403).json({ error: 'PIN hanya untuk akun sendiri.' });
  if (id === req.user.id && (b.isAdmin === false || (b.role && b.role !== 'owner' && req.user.role === 'owner'))) return res.status(400).json({ error: 'Tidak bisa menurunkan admin sendiri.' });
  const patch = {
    displayName: b.displayName, about: b.about, phone: b.phone, crmNote: b.crmNote,
    verified: b.verified, title: b.title, blocked: b.blocked, flagged: b.flagged, agentStatus: b.agentStatus,
    customFields: b.customFields !== undefined ? JSON.stringify(b.customFields || {}) : undefined,
    shiftStart: b.shiftStart, shiftEnd: b.shiftEnd,
  };
  if (b.isAdmin !== undefined) patch.isAdmin = b.isAdmin;
  if (b.role !== undefined) {
    if (!['owner', 'super', 'moderator', 'agent', 'keuangan', 'member'].includes(b.role)) return res.status(400).json({ error: 'Role tidak valid.' });
    patch.role = b.role; if (b.role !== 'member') patch.isAdmin = true;
  }
  if (b.isAdmin === true && target.role === 'member') patch.role = 'agent';
  if (b.adminPin !== undefined) patch.adminPin = b.adminPin ? String(b.adminPin) : null;
  const user = await dbx.adminUpdateUser(id, patch);
  dbx.logAdmin(req.user.id, 'user.update', `@${user.username}`);
  res.json({ user });
});
router.delete('/users/:id', requirePerm('users.manage'), async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri.' });
  const target = await dbx.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (target.role === 'owner' && req.user.role !== 'owner') return res.status(403).json({ error: 'Owner hanya bisa dihapus owner.' });
  dbx.adminDeleteUser(id);
  dbx.logAdmin(req.user.id, 'user.delete', `@${target.username}`);
  res.json({ ok: true });
});

/* ---------- inbox terpusat ---------- */
router.get('/conversations', requirePerm('inbox'), async (req, res) => {
  const convs = await dbx.adminListConversations();
  const withMeta = await Promise.all(convs.map(async (c) => {
    const row = await dbx.getConversation(c.id);
    const assignee = row.assigned_to ? await dbx.getUserById(row.assigned_to) : null;
    return { ...c, tag: row.tag || '', assignedTo: row.assigned_to || null, assignedName: assignee ? assignee.displayName : null };
  }));
  res.json({ conversations: withMeta });
});
router.get('/conversations/:id/messages', requirePerm('inbox'), async (req, res) => {
  const id = Number(req.params.id);
  if (!await dbx.getConversation(id)) return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
  res.json({ messages: await dbx.listMessages(id, 300), notes: dbx.listNotes(id) });
});
router.post('/conversations/:id/reply', requirePerm('inbox'), async (req, res) => {
  const id = Number(req.params.id);
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Pesan kosong.' });
  if (!await dbx.getConversation(id)) return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
  const buttons = Array.isArray((req.body || {}).buttons)
    ? req.body.buttons.slice(0, 4).map((b, i) => ({ id: `b${i}`, label: String(b.label || '').slice(0, 40), url: b.url || null })).filter((b) => b.label)
    : null;
  const message = await dbx.insertMessage({ conversationId: id, senderId: req.user.id, body, buttons });
  await hub.sendToConversation(id, { type: 'message:new', conversationId: id, message: { ...message, readBy: [] } });
  dbx.logAdmin(req.user.id, 'inbox.reply', `#${id}${buttons ? ` (+${buttons.length} tombol)` : ''}`);
  res.status(201).json({ message });
});
router.post('/conversations/:id/csat', requirePerm('inbox'), async (req, res) => {
  const id = Number(req.params.id);
  if (!await dbx.getConversation(id)) return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
  const buttons = [1, 2, 3, 4, 5].map((n) => ({ id: `r${n}`, label: '⭐'.repeat(n), rating: n }));
  const message = await dbx.insertMessage({ conversationId: id, senderId: req.user.id, body: 'Seberapa puas kamu dengan layanan kami?', buttons });
  await hub.sendToConversation(id, { type: 'message:new', conversationId: id, message: { ...message, readBy: [] } });
  dbx.logAdmin(req.user.id, 'csat.send', `#${id}`);
  res.status(201).json({ message });
});
router.post('/conversations/:id/assign', requirePerm('inbox'), async (req, res) => {
  const id = Number(req.params.id);
  const adminId = Number((req.body || {}).adminId || 0) || null;
  dbx.assignConversation(id, adminId);
  dbx.logAdmin(req.user.id, 'chat.transfer', `#${id} → ${adminId || 'unassigned'}`);
  res.json({ ok: true });
});
router.post('/conversations/:id/tag', requirePerm('inbox'), async (req, res) => {
  dbx.setConversationTag(Number(req.params.id), (req.body || {}).tag);
  dbx.logAdmin(req.user.id, 'chat.tag', `#${req.params.id} = ${(req.body || {}).tag || ''}`);
  res.json({ ok: true });
});
router.get('/conversations/:id/notes', requirePerm('inbox'), async (req, res) => res.json({ notes: dbx.listNotes(Number(req.params.id)) }));
router.post('/conversations/:id/notes', requirePerm('inbox'), async (req, res) => {
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Catatan kosong.' });
  res.status(201).json({ note: dbx.addNote(Number(req.params.id), req.user.id, body) });
});
router.delete('/notes/:id', requirePerm('inbox'), async (req, res) => { dbx.deleteNote(Number(req.params.id)); res.json({ ok: true }); });
router.post('/messages/:id/pin', requirePerm('inbox'), async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  const pinned = !!(req.body || {}).pinned;
  const updated = dbx.setPinned(id, pinned);
  await hub.sendToConversation(msg.conversationId, { type: 'message:pinned', conversationId: msg.conversationId, message: updated, pinned });
  dbx.logAdmin(req.user.id, pinned ? 'message.pin' : 'message.unpin', `#${id}`);
  res.json({ message: updated });
});

/* ---------- moderasi ---------- */
router.get('/messages', requirePerm('moderation'), async (req, res) => res.json({ messages: await dbx.adminRecentMessages(Number(req.query.limit) || 60) }));
router.delete('/messages/:id', requirePerm('moderation'), async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  await dbx.deleteMessage(id);
  dbx.logAdmin(req.user.id, 'message.delete', `#${id} oleh ${msg.senderName}`);
  await hub.sendToConversation(msg.conversationId, { type: 'message:deleted', conversationId: msg.conversationId, messageId: id });
  res.json({ ok: true });
});
router.delete('/conversations/:id', requirePerm('moderation'), async (req, res) => {
  const id = Number(req.params.id);
  const conv = await dbx.getConversation(id);
  if (!conv) return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
  dbx.adminDeleteConversation(id);
  dbx.logAdmin(req.user.id, 'conversation.delete', `#${id} ${conv.title || '(privat)'}`);
  await hub.broadcast({ type: 'conversations:changed' });
  res.json({ ok: true });
});
router.get('/filters', requirePerm('moderation'), async (req, res) => res.json({ filters: dbx.listFilters() }));
router.post('/filters', requirePerm('moderation'), async (req, res) => {
  const word = String((req.body || {}).word || '').trim().toLowerCase();
  if (!word) return res.status(400).json({ error: 'Kata kosong.' });
  dbx.addFilter(word); dbx.logAdmin(req.user.id, 'filter.add', word);
  res.status(201).json({ ok: true });
});
router.delete('/filters/:id', requirePerm('moderation'), async (req, res) => { dbx.deleteFilter(Number(req.params.id)); res.json({ ok: true }); });

/* ---------- siaran & pengumuman ---------- */
async function runBroadcast(row) {
  const official = await dbx.getUserByUsername('xerophis');
  if (!official) throw new Error('Bot resmi tidak ditemukan.');
  let humans = await dbx.allHumanUsers();
  if (row.target === 'admins') humans = humans.filter((u) => u.isAdmin);
  if (row.target === 'agents') humans = humans.filter((u) => ['agent', 'moderator', 'super'].includes(u.role));
  if (String(row.target).startsWith('tag:')) {
    const ids = new Set(dbx.usersInTag(String(row.target).slice(4)));
    humans = humans.filter((u) => ids.has(u.id));
  }
  /* anti-ban rotation: rotasi pengirim siaran dari pool akun */
  let pool = [];
  try { pool = JSON.parse(dbx.kvGet('rotation_pool') || '[]'); } catch { pool = []; }
  const poolUsers = (await Promise.all(pool.map((uname) => dbx.getUserByUsername(String(uname).trim())))).filter(Boolean);
  let count = 0;
  for (const u of humans) {
    const sender = poolUsers.length ? poolUsers[count % poolUsers.length] : official;
    let convId = dbx.findPrivateConversation(u.id, sender.id);
    if (!convId) convId = await dbx.createConversation({ type: 'private', createdBy: sender.id, memberIds: [u.id, sender.id] });
    const info = dbx.db.prepare('INSERT INTO messages (conversation_id, sender_id, body, broadcast_id) VALUES (?, ?, ?, ?)')
      .run(convId, sender.id, `📢 ${row.text}`, row.id);
    const message = await dbx.getMessage(Number(info.lastInsertRowid));
    await hub.sendToConversation(convId, { type: 'message:new', conversationId: convId, message });
    count += 1;
  }
  return count;
}
router.post('/broadcast', requirePerm('broadcast'), async (req, res) => {
  const text = String((req.body || {}).text || '').trim();
  if (!text) return res.status(400).json({ error: 'Teks siaran kosong.' });
  const sendAt = (req.body || {}).sendAt || null;
  const rawTarget = String((req.body || {}).target || 'all');
  const target = ['all', 'admins', 'agents'].includes(rawTarget) || rawTarget.startsWith('tag:') ? rawTarget : 'all';
  const id = dbx.createBroadcast(req.user.id, text, target, sendAt);
  if (sendAt) { dbx.logAdmin(req.user.id, 'broadcast.schedule', `#${id} @ ${sendAt}`); return res.status(201).json({ ok: true, id, status: 'scheduled' }); }
  const count = await runBroadcast({ id, text, target });
  dbx.logAdmin(req.user.id, 'broadcast', `${count} pengguna`);
  res.json({ ok: true, count });
});
router.get('/broadcasts', requirePerm('broadcast'), async (req, res) => res.json({ broadcasts: dbx.listBroadcasts() }));
router.post('/announce', requirePerm('system'), async (req, res) => {
  const text = String((req.body || {}).text || '').trim();
  dbx.kvSet('announcement', text);
  await hub.broadcast({ type: 'announce', text });
  dbx.logAdmin(req.user.id, text ? 'announce.set' : 'announce.clear', text.slice(0, 60));
  res.json({ ok: true });
});

/* ---------- otomasi ---------- */
router.get('/autorules', requirePerm('system'), async (req, res) => res.json({ rules: dbx.listAutoRules() }));
router.post('/autorules', requirePerm('system'), async (req, res) => {
  const { keyword, reply } = req.body || {};
  if (!keyword || !reply) return res.status(400).json({ error: 'Keyword & balasan wajib.' });
  dbx.addAutoRule(keyword, reply); dbx.logAdmin(req.user.id, 'autorule.add', String(keyword));
  res.status(201).json({ ok: true });
});
router.delete('/autorules/:id', requirePerm('system'), async (req, res) => { dbx.deleteAutoRule(Number(req.params.id)); res.json({ ok: true }); });
router.get('/quickreplies', requirePerm('system'), async (req, res) => res.json({ quick: dbx.listQuickReplies() }));
router.post('/quickreplies', requirePerm('system'), async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'Judul & isi wajib.' });
  dbx.addQuickReply(title, body); res.status(201).json({ ok: true });
});
router.delete('/quickreplies/:id', requirePerm('system'), async (req, res) => { dbx.deleteQuickReply(Number(req.params.id)); res.json({ ok: true }); });
router.get('/webhook', requirePerm('system'), async (req, res) => res.json({ url: dbx.kvGet('webhook_url') || '' }));
router.post('/webhook', requirePerm('system'), async (req, res) => {
  dbx.kvSet('webhook_url', String((req.body || {}).url || '').trim());
  dbx.logAdmin(req.user.id, 'webhook.set', String((req.body || {}).url || '').slice(0, 80));
  res.json({ ok: true });
});
router.post('/webhook/test', requirePerm('system'), async (req, res) => {
  const url = dbx.kvGet('webhook_url');
  if (!url) return res.status(400).json({ error: 'Webhook belum diset.' });
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'ping', app: 'Xerophis' }) });
    res.json({ ok: true, status: r.status });
  } catch (e) { res.status(502).json({ error: `Webhook tidak terjangkau: ${e.message}` }); }
});

/* ---------- keuangan & CSAT ---------- */
router.get('/transactions', requirePerm('reports'), async (req, res) => {
  res.json({ transactions: dbx.listTransactions(Number(req.query.userId) || 0) });
});
router.post('/transactions', requirePerm('finance'), async (req, res) => {
  const { userId, amount, note } = req.body || {};
  const user = await dbx.getUserById(Number(userId));
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (!Number.isFinite(Number(amount))) return res.status(400).json({ error: 'Nominal tidak valid.' });
  const id = dbx.addTransaction(user.id, req.user.id, Number(amount), String(note || ''));
  dbx.logAdmin(req.user.id, 'transaction.add', `@${user.username} ${amount}`);
  res.status(201).json({ id });
});

/* ---------- analitik & laporan ---------- */
router.get('/analytics', requirePerm('reports'), async (req, res) => res.json({ analytics: dbx.analytics() }));
router.get('/export/users.csv', requirePerm('reports'), async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="xerophis-contacts.csv"');
  res.send(dbx.usersCSV());
});
router.post('/import/users', requirePerm('users.manage'), async (req, res) => {
  const csv = String((req.body || {}).csv || '');
  if (!csv.trim()) return res.status(400).json({ error: 'CSV kosong.' });
  try {
    const hash = await bcrypt.hash(String((req.body || {}).password || 'xerophis'), 8);
    const r = dbx.importUsersCSV(csv, hash);
    dbx.logAdmin(req.user.id, 'users.import', `+${r.created} / skip ${r.skipped}`);
    res.json(r);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
router.get('/backup', requirePerm('system'), async (req, res) => {
  const dump = {
    exportedAt: new Date().toISOString(), app: 'Xerophis',
    users: dbx.db.prepare('SELECT id, username, display_name, phone, about, role, verified, title, is_bot, is_admin, created_at FROM users').all(),
    conversations: dbx.db.prepare('SELECT * FROM conversations').all(),
    members: dbx.db.prepare('SELECT * FROM conversation_members').all(),
    messages: dbx.db.prepare('SELECT * FROM messages').all(),
  };
  res.setHeader('Content-Disposition', 'attachment; filename="xerophis-backup.json"');
  res.json(dump);
});

/* ---------- sesi & sistem ---------- */
router.get('/sessions', requirePerm('system'), async (req, res) => res.json({ sessions: dbx.listSessions() }));
router.delete('/sessions/:token', requirePerm('system'), async (req, res) => {
  dbx.deleteSession(String(req.params.token));
  dbx.logAdmin(req.user.id, 'session.revoke', String(req.params.token).slice(0, 8) + '…');
  res.json({ ok: true });
});
router.get('/system', requirePerm('system'), async (req, res) => {
  const mem = process.memoryUsage();
  let dbSize = 0; try { dbSize = fs.statSync(dbx.DB_PATH).size; } catch {}
  res.json({
    system: {
      node: process.version, pid: process.pid, uptimeSec: Math.round(process.uptime()),
      hostname: os.hostname(), cpus: os.cpus().length,
      memory: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal },
      dbPath: dbx.DB_PATH, dbSize,
      errors: ring.list(),
    },
  });
});

/* ---------- pengaturan sistem (jam kerja, anti-phising, rotasi) ---------- */
router.get('/settings', requirePerm('system'), async (req, res) => {
  let bh = null; try { bh = JSON.parse(dbx.kvGet('business_hours') || 'null'); } catch {}
  let pool = []; try { pool = JSON.parse(dbx.kvGet('rotation_pool') || '[]'); } catch {}
  res.json({ settings: { businessHours: bh, blockLinks: dbx.kvGet('block_links') === '1', rotationPool: pool } });
});
router.post('/settings', requirePerm('system'), async (req, res) => {
  const b = req.body || {};
  if (b.businessHours !== undefined) dbx.kvSet('business_hours', JSON.stringify(b.businessHours || null));
  if (b.blockLinks !== undefined) dbx.kvSet('block_links', b.blockLinks ? '1' : '0');
  if (b.rotationPool !== undefined) dbx.kvSet('rotation_pool', JSON.stringify(b.rotationPool || []));
  dbx.logAdmin(req.user.id, 'settings.update', Object.keys(b).join(','));
  res.json({ ok: true });
});

/* ---------- backup berkala ---------- */
const path = require('node:path');
const BACKUP_DIR = path.join(path.dirname(dbx.DB_PATH), 'backups');
function writeBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const dump = {
    exportedAt: new Date().toISOString(), app: 'Xerophis',
    users: dbx.db.prepare('SELECT id, username, display_name, phone, about, role, verified, title, is_bot, is_admin, created_at FROM users').all(),
    conversations: dbx.db.prepare('SELECT * FROM conversations').all(),
    members: dbx.db.prepare('SELECT * FROM conversation_members').all(),
    messages: dbx.db.prepare('SELECT * FROM messages').all(),
  };
  const name = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(BACKUP_DIR, name), JSON.stringify(dump));
  for (const f of fs.readdirSync(BACKUP_DIR).sort().slice(0, -10)) fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
  return name;
}
router.post('/backup/run', requirePerm('system'), async (req, res) => {
  const name = writeBackup();
  dbx.logAdmin(req.user.id, 'backup.run', name);
  res.json({ ok: true, name });
});
router.get('/backups', requirePerm('system'), async (req, res) => {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backups = fs.readdirSync(BACKUP_DIR).sort().reverse().map((f) => ({ name: f, size: fs.statSync(path.join(BACKUP_DIR, f)).size }));
  res.json({ backups });
});
router.get('/backups/:name', requirePerm('system'), async (req, res) => {
  const file = path.join(BACKUP_DIR, path.basename(req.params.name));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Backup tidak ditemukan.' });
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(file)}"`);
  res.send(fs.readFileSync(file));
});

function startScheduler() {
  setInterval(async () => {
    for (const row of dbx.dueBroadcasts()) {
      try {
        const count = await runBroadcast(row);
        dbx.markBroadcast(row.id, 'sent');
        dbx.logAdmin(row.admin_id, 'broadcast.sent-scheduled', `#${row.id} → ${count} pengguna`);
      } catch (e) { ring.push(e); dbx.markBroadcast(row.id, 'failed'); }
    }
  }, 10_000).unref();
  /* backup berkala tiap 6 jam + saat start */
  try { writeBackup(); } catch (e) { ring.push(e); }
  setInterval(() => { try { writeBackup(); } catch (e) { ring.push(e); } }, 6 * 3600_000).unref();
}

module.exports = { router, startScheduler, can, PERMS };
