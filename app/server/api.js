'use strict';
/** Xerophis REST API — conversations, messages, users. */
const express = require('express');
const dbx = require('./db');
const hub = require('./wsHub');
const bots = require('./bots');

const router = express.Router();
router.use(require('./auth').requireAuth);

router.get('/me', (req, res) => {
  res.json({ user: req.user, online: hub.onlineIds(), announcement: dbx.kvGet('announcement') || '' });
});

router.get('/sessions', async (req, res) => {
  res.json({ sessions: dbx.listSessionsFor(req.user.id) });
});
router.delete('/sessions/:token', async (req, res) => {
  const token = String(req.params.token);
  const own = dbx.listSessionsFor(req.user.id).some((s) => s.token === token);
  if (!own) return res.status(403).json({ error: 'Bukan sesi kamu.' });
  if (token === req.token) return res.status(400).json({ error: 'Tidak bisa menghapus sesi aktif ini.' });
  dbx.deleteSession(token);
  res.json({ ok: true });
});

router.get('/quick', async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Khusus admin.' });
  res.json({ quick: dbx.listQuickReplies() });
});

/* starred messages */
router.post('/messages/:id/star', async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  if (!(await dbx.isMember(msg.conversationId, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const on = (req.body || {}).on === undefined ? !dbx.isStarred(req.user.id, id) : !!(req.body || {}).on;
  dbx.toggleStar(req.user.id, id, on);
  res.json({ ok: true, starred: on });
});
router.get('/stars', async (req, res) => {
  res.json({ stars: dbx.listStarred(req.user.id) });
});

/* CSAT: pengguna menilai layanan setelah chat dgn admin */
router.post('/conversations/:id/rating', async (req, res) => {
  const id = Number(req.params.id);
  const rating = Number((req.body || {}).rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5.' });
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const conv = await dbx.getConversation(id);
  let agentId = conv.assigned_to || null;
  if (!agentId) {
    const lastAdmin = dbx.db.prepare(`SELECT m.sender_id AS s FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ? AND u.is_admin = 1 ORDER BY m.id DESC LIMIT 1`).get(id);
    agentId = lastAdmin?.s || null;
  }
  dbx.recordRating(id, agentId, req.user.id, rating);
  res.json({ ok: true });
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
  res.json({ conversation: { id, type: conv.type, title, about: conv.about, memberCount: members.length, counterpart, pinned: dbx.lastPinned(id) }, members });
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
  if (req.user.blocked) return res.status(403).json({ error: 'Akun kamu diblokir admin.' });
  if (req.user.flagged) return res.status(429).json({ error: 'Akun ditandai sebagai spam. Hubungi admin.' });
  let body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Pesan kosong.' });
  if (body.length > 4000) return res.status(400).json({ error: 'Pesan terlalu panjang.' });
  if (!req.user.isAdmin) body = dbx.censorText(body);
  if (dbx.countRecentMessages(req.user.id) > 25) {
    dbx.setUserFlagged(req.user.id, true);
    dbx.logAdmin(null, 'spam.auto-flag', `@${req.user.username}`);
    return res.status(429).json({ error: 'Terlalu cepat. Akun ditandai untuk review admin.' });
  }
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const message = await dbx.insertMessage({ conversationId: id, senderId: req.user.id, body });
  await dbx.setLastRead(id, req.user.id, message.id);
  const withRead = { ...message, readBy: [] };
  hub.sendToConversation(id, { type: 'message:new', conversationId: id, message: withRead });
  const webhook = dbx.kvGet('webhook_url');
  if (webhook) fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'message.new', conversationId: id, sender: req.user.username, body }) }).catch(() => {});
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

/* ============================================================
   UPDATES / STATUS / CHANNELS / COMMUNITIES / CALLS
   ============================================================ */
router.get('/updates', async (req, res) => {
  const feed = await dbx.updatesFeed(req.user.id);
  res.json({ ...feed, channels: dbx.listChannels(req.user.id) });
});
router.post('/status', async (req, res) => {
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Status kosong.' });
  if (body.length > 500) return res.status(400).json({ error: 'Status terlalu panjang.' });
  const st = dbx.addStatus(req.user.id, body);
  res.status(201).json({ status: st });
});
router.delete('/status/:id', async (req, res) => {
  dbx.deleteStatus(Number(req.params.id), req.user.id);
  res.json({ ok: true });
});
router.post('/status/:id/view', async (req, res) => {
  const st = dbx.statusById(Number(req.params.id));
  if (!st) return res.status(404).json({ error: 'Status tidak ditemukan.' });
  if (st.user_id !== req.user.id) dbx.markStatusViewed(st.id, req.user.id);
  res.json({ ok: true });
});

router.get('/channels', async (req, res) => res.json({ channels: dbx.listChannels(req.user.id) }));
router.post('/channels', async (req, res) => {
  const title = String((req.body || {}).title || '').trim();
  if (!title) return res.status(400).json({ error: 'Nama saluran wajib.' });
  const id = dbx.createChannel(title, String((req.body || {}).about || ''), req.user.id);
  res.status(201).json({ channelId: id });
});
router.post('/channels/:id/follow', async (req, res) => {
  dbx.followChannel(Number(req.params.id), req.user.id, !!(req.body || {}).on);
  res.json({ ok: true });
});
router.get('/channels/:id/posts', async (req, res) => {
  res.json({ posts: dbx.channelPosts(Number(req.params.id), req.user.id) });
});
router.post('/channels/:id/posts', async (req, res) => {
  const id = Number(req.params.id);
  const ch = dbx.db.prepare('SELECT created_by FROM channels WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Saluran tidak ditemukan.' });
  if (ch.created_by !== req.user.id) return res.status(403).json({ error: 'Hanya pemilik saluran yang bisa posting.' });
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Postingan kosong.' });
  const postId = dbx.addChannelPost(id, req.user.id, body);
  res.status(201).json({ postId });
});

router.get('/communities', async (req, res) => res.json({ communities: dbx.listCommunities(req.user.id) }));
router.get('/communities/:id', async (req, res) => {
  const d = dbx.communityDetail(Number(req.params.id));
  if (!d) return res.status(404).json({ error: 'Komunitas tidak ditemukan.' });
  res.json({ community: d });
});
router.post('/communities', async (req, res) => {
  const title = String((req.body || {}).title || '').trim();
  if (!title) return res.status(400).json({ error: 'Nama komunitas wajib.' });
  const groups = (req.body || {}).groups || [];
  const myGroups = [];
  for (const g of groups) { if (await dbx.isMember(Number(g), req.user.id)) myGroups.push(Number(g)); }
  const id = dbx.createCommunity(title, String((req.body || {}).about || ''), req.user.id, myGroups);
  res.status(201).json({ communityId: id });
});
router.post('/communities/:id/join', async (req, res) => {
  dbx.joinCommunity(Number(req.params.id), req.user.id, !!(req.body || {}).on);
  res.json({ ok: true });
});

router.get('/calls', async (req, res) => res.json({ calls: dbx.callHistory(req.user.id), pending: dbx.pendingCalls(req.user.id) }));
router.post('/calls/offer', async (req, res) => {
  const calleeId = Number((req.body || {}).calleeId);
  const kind = (req.body || {}).kind === 'video' ? 'video' : 'voice';
  if (!(await dbx.getUserById(calleeId))) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (calleeId === req.user.id) return res.status(400).json({ error: 'Tidak bisa memanggil diri sendiri.' });
  const call = dbx.createCall(req.user.id, calleeId, kind);
  hub.sendToUser(calleeId, { type: 'call:offer', call });
  res.status(201).json({ call });
});
router.post('/calls/:id/accept', async (req, res) => {
  const call = dbx.getCall(Number(req.params.id));
  if (!call || call.callee_id !== req.user.id) return res.status(403).json({ error: 'Bukan penerima panggilan.' });
  const updated = dbx.setCall(call.id, { status: 'active', startedNow: true });
  hub.sendToUser(call.caller_id, { type: 'call:accept', call: updated });
  res.json({ call: updated });
});
router.post('/calls/:id/reject', async (req, res) => {
  const call = dbx.getCall(Number(req.params.id));
  if (!call || call.callee_id !== req.user.id) return res.status(403).json({ error: 'Bukan penerima panggilan.' });
  const updated = dbx.setCall(call.id, { status: 'rejected', endedNow: true });
  hub.sendToUser(call.caller_id, { type: 'call:reject', call: updated });
  res.json({ call: updated });
});
router.post('/calls/:id/end', async (req, res) => {
  const call = dbx.getCall(Number(req.params.id));
  if (!call || (call.caller_id !== req.user.id && call.callee_id !== req.user.id)) return res.status(403).json({ error: 'Bukan peserta panggilan.' });
  const dur = call.started_at ? Math.max(1, Math.round((Date.now() - Date.parse(call.started_at)) / 1000)) : 0;
  const status = call.status === 'active' ? 'completed' : 'missed';
  const updated = dbx.setCall(call.id, { status, endedNow: true, durationSec: dur });
  const other = call.caller_id === req.user.id ? call.callee_id : call.caller_id;
  hub.sendToUser(other, { type: 'call:end', call: updated });
  res.json({ call: updated });
});

module.exports = router;
