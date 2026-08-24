'use strict';
/** Xerophis REST API — conversations, messages, users. */
const express = require('express');
const dbx = require('./db');
const hub = require('./wsHub');
const bots = require('./bots');

const router = express.Router();
router.use(require('./auth').requireAuth);

router.get('/me', (req, res) => {
  res.json({ user: req.user, online: hub.onlineIds() });
});

router.get('/users', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const users = q ? await dbx.searchUsers(q, req.user.id) : await dbx.allUsers(req.user.id);
  res.json({ users: users.map((u) => ({ ...u, online: hub.isOnline(u.id) })) });
});

router.get('/conversations', async (req, res) => {
  const list = await dbx.listConversationsFor(req.user.id);
  for (const c of list) if (c.counterpart) c.counterpart = { ...c.counterpart, online: hub.isOnline(c.counterpart.id) };
  res.json({ conversations: list });
});

router.post('/conversations', async (req, res) => {
  const { type, username, title, members } = req.body || {};
  if (type === 'private') {
    if (!username) return res.status(400).json({ error: 'username wajib.' });
    const other = await dbx.getUserByUsername(String(username));
    if (!other) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    let id = dbx.findPrivateConversation(req.user.id, other.id);
    if (!id) id = await dbx.createConversation({ type: 'private', createdBy: req.user.id, memberIds: [req.user.id, other.id] });
    return res.status(201).json({ conversationId: id });
  }
  if (type === 'group') {
    if (!title || String(title).trim().length < 1) return res.status(400).json({ error: 'Nama grup wajib.' });
    const ids = new Set([req.user.id]);
    for (const uname of members || []) {
      const u = await dbx.getUserByUsername(String(uname));
      if (u) ids.add(u.id);
    }
    const id = await dbx.createConversation({ type: 'group', title: String(title).trim(), createdBy: req.user.id, memberIds: [...ids], roles: { [req.user.id]: 'admin' } });
    const sys = await dbx.insertMessage({ conversationId: id, senderId: req.user.id, body: `${req.user.displayName} membuat grup "${title}"`, kind: 'system' });
    hub.sendToConversation(id, { type: 'message:new', conversationId: id, message: sys }, req.user.id);
    return res.status(201).json({ conversationId: id });
  }
  res.status(400).json({ error: 'type harus private|group.' });
});

router.get('/conversations/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const conv = await dbx.getConversation(id);
  const members = (await dbx.getMembers(id)).map((m) => ({ ...m, online: hub.isOnline(m.id) }));
  let title = conv.title, counterpart = null;
  if (conv.type === 'private') {
    counterpart = members.find((m) => m.id !== req.user.id) || null;
    title = counterpart ? counterpart.displayName : 'Anda';
  }
  res.json({ conversation: { id, type: conv.type, title, about: conv.about, memberCount: members.length, counterpart }, members });
});

router.get('/conversations/:id/messages', async (req, res) => {
  const id = Number(req.params.id);
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const messages = await dbx.listMessages(id);
  const members = await dbx.getMembers(id);
  const enriched = messages.map((m) => ({
    ...m,
    readBy: members.filter((u) => u.id !== m.senderId && u.lastReadId >= m.id).map((u) => u.id),
  }));
  res.json({ messages: enriched });
});

router.post('/conversations/:id/messages', async (req, res) => {
  const id = Number(req.params.id);
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Pesan kosong.' });
  if (body.length > 4000) return res.status(400).json({ error: 'Pesan terlalu panjang.' });
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const message = await dbx.insertMessage({ conversationId: id, senderId: req.user.id, body });
  await dbx.setLastRead(id, req.user.id, message.id);
  const withRead = { ...message, readBy: [] };
  hub.sendToConversation(id, { type: 'message:new', conversationId: id, message: withRead });
  const members = await dbx.getMembers(id);
  bots.onHumanMessage(id, message, members);
  res.status(201).json({ message: withRead });
});

router.post('/conversations/:id/read', async (req, res) => {
  const id = Number(req.params.id);
  const messageId = Number((req.body || {}).messageId || 0);
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  await dbx.setLastRead(id, req.user.id, messageId);
  await hub.sendToConversation(id, { type: 'read', conversationId: id, userId: req.user.id, messageId }, req.user.id);
  res.json({ ok: true });
});

router.post('/conversations/:id/favorite', async (req, res) => {
  const id = Number(req.params.id);
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  await dbx.setFavorite(id, req.user.id, !!(req.body || {}).favorite);
  res.json({ ok: true });
});

router.delete('/messages/:id', async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  if (msg.senderId !== req.user.id) return res.status(403).json({ error: 'Hanya pengirim yang dapat menghapus.' });
  await dbx.deleteMessage(id);
  await hub.sendToConversation(msg.conversationId, { type: 'message:deleted', conversationId: msg.conversationId, messageId: id });
  res.json({ ok: true });
});

module.exports = router;
