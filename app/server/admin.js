'use strict';
/** Xerophis admin API — panel tersembunyi (trigger client: "kingpall"), gate role di sini. */
const express = require('express');
const bcrypt = require('bcryptjs');
const dbx = require('./db');
const hub = require('./wsHub');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Akses admin ditolak.' });
  next();
}
router.use(require('./auth').requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const s = await dbx.stats();
  res.json({ stats: { ...s, online: hub.onlineIds().length } });
});

router.get('/users', async (req, res) => {
  res.json({ users: await dbx.adminListUsers(String(req.query.q || '')) });
});

router.post('/users', async (req, res) => {
  const { username, password, displayName, about, isAdmin } = req.body || {};
  if (!username || !/^[a-zA-Z0-9+._-]{3,24}$/.test(String(username))) return res.status(400).json({ error: 'Username tidak valid.' });
  if (!password || String(password).length < 4) return res.status(400).json({ error: 'Password minimal 4 karakter.' });
  if (await dbx.getUserByUsername(username)) return res.status(409).json({ error: 'Username sudah dipakai.' });
  const user = await dbx.createUser({
    username: String(username), passwordHash: await bcrypt.hash(String(password), 10),
    displayName: displayName || String(username), about, isAdmin: !!isAdmin,
  });
  dbx.logAdmin(req.user.id, 'user.create', `@${user.username}`);
  res.status(201).json({ user });
});

router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const target = await dbx.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (id === req.user.id && req.body.isAdmin === false) return res.status(400).json({ error: 'Tidak bisa menurunkan admin sendiri.' });
  const user = await dbx.adminUpdateUser(id, req.body || {});
  dbx.logAdmin(req.user.id, 'user.update', `@${user.username}`);
  res.json({ user });
});

router.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri.' });
  const target = await dbx.getUserById(id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  dbx.adminDeleteUser(id);
  dbx.logAdmin(req.user.id, 'user.delete', `@${target.username}`);
  res.json({ ok: true });
});

router.get('/conversations', async (req, res) => {
  res.json({ conversations: await dbx.adminListConversations() });
});

router.delete('/conversations/:id', async (req, res) => {
  const id = Number(req.params.id);
  const conv = await dbx.getConversation(id);
  if (!conv) return res.status(404).json({ error: 'Percakapan tidak ditemukan.' });
  dbx.adminDeleteConversation(id);
  dbx.logAdmin(req.user.id, 'conversation.delete', `#${id} ${conv.title || '(privat)'}`);
  await hub.broadcast({ type: 'conversations:changed' });
  res.json({ ok: true });
});

router.get('/messages', async (req, res) => {
  res.json({ messages: await dbx.adminRecentMessages(Number(req.query.limit) || 60) });
});

router.delete('/messages/:id', async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  await dbx.deleteMessage(id);
  dbx.logAdmin(req.user.id, 'message.delete', `#${id} oleh ${msg.senderName}`);
  await hub.sendToConversation(msg.conversationId, { type: 'message:deleted', conversationId: msg.conversationId, messageId: id });
  res.json({ ok: true });
});

router.post('/broadcast', async (req, res) => {
  const text = String((req.body || {}).text || '').trim();
  if (!text) return res.status(400).json({ error: 'Teks siaran kosong.' });
  const official = await dbx.getUserByUsername('xerophis');
  if (!official) return res.status(500).json({ error: 'Bot resmi tidak ditemukan.' });
  const humans = await dbx.allHumanUsers();
  let count = 0;
  for (const u of humans) {
    let convId = dbx.findPrivateConversation(u.id, official.id);
    if (!convId) convId = await dbx.createConversation({ type: 'private', createdBy: official.id, memberIds: [u.id, official.id] });
    const message = await dbx.insertMessage({ conversationId: convId, senderId: official.id, body: `📢 ${text}` });
    await hub.sendToConversation(convId, { type: 'message:new', conversationId: convId, message });
    count += 1;
  }
  dbx.logAdmin(req.user.id, 'broadcast', `${count} pengguna`);
  res.json({ ok: true, count });
});

router.get('/logs', async (req, res) => {
  res.json({ logs: await dbx.listAdminLogs() });
});

module.exports = router;
