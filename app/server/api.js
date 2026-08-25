'use strict';
/** Xerophis REST API — conversations, messages, users. */
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dbx = require('./db');
const hub = require('./wsHub');
const bots = require('./bots');

const MEDIA_DIR = path.join(path.dirname(dbx.DB_PATH), 'media');
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

const router = express.Router();

/* ambil berkas media (token via query agar bisa dipakai <img>) */
router.get('/media/:id', async (req, res) => {
  const user = await dbx.getUserByToken(String(req.query.token || ''));
  if (!user) return res.status(401).json({ error: 'Sesi berakhir.' });
  const m = await dbx.mediaById(Number(req.params.id));
  if (!m) return res.status(404).json({ error: 'Media tidak ditemukan.' });
  const file = path.join(MEDIA_DIR, path.basename(m.filename));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Berkas hilang.' });
  res.setHeader('Content-Type', m.mime);
  res.setHeader('Cache-Control', 'private, max-age=31536000');
  res.send(fs.readFileSync(file));
});

router.use(require('./auth').requireAuth);

/* unggah media (base64 dataURL, maks 1.5MB) */
/* ---------- pencarian isi pesan (spec 18) ---------- */
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [] });
  const rows = await dbx.db.prepare(`
    SELECT m.id AS mid, m.conversation_id AS cid, m.body, m.created_at, u.display_name AS sender_name, c.title AS conv_title, c.type AS conv_type
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ?
    JOIN users u ON u.id = m.sender_id
    WHERE m.enc = 0 AND lower(m.body) LIKE ?
    ORDER BY m.id DESC LIMIT 50`).all(req.user.id, `%${q.toLowerCase()}%`);
  res.json({ results: rows });
});
router.post('/media', async (req, res) => {
  if (require('./auth').limited(req, 20, 60_000, 'media')) return res.status(429).json({ error: 'Terlalu banyak unggahan. Coba sebentar lagi.' });
  const dataUrl = String((req.body || {}).dataUrl || '');
  const mMatch = dataUrl.match(/^data:(image\/(jpeg|png|webp|gif));base64,(.+)$/);
  if (!mMatch) return res.status(400).json({ error: 'Format media tidak didukung (jpg/png/webp/gif).' });
  const buf = Buffer.from(mMatch[3], 'base64');
  if (buf.length > 1.5 * 1024 * 1024) return res.status(400).json({ error: 'Maksimal 1.5MB.' });
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${MIME_EXT[mMatch[1]]}`;
  fs.writeFileSync(path.join(MEDIA_DIR, filename), buf);
  const id = await dbx.createMedia(filename, mMatch[1], buf.length);
  res.status(201).json({ mediaId: id });
});

router.get('/me', async (req, res) => {
  res.json({ user: { ...req.user, email: await dbx.getEmail(req.user.id) }, online: hub.onlineIds(), announcement: await dbx.kvGet('announcement') || '' });
});

router.get('/sessions', async (req, res) => {
  res.json({ sessions: await dbx.listSessionsFor(req.user.id) });
});
router.delete('/sessions/:token', async (req, res) => {
  const token = String(req.params.token);
  const own = await dbx.listSessionsFor(req.user.id).some((s) => s.token === token);
  if (!own) return res.status(403).json({ error: 'Bukan sesi kamu.' });
  if (token === req.token) return res.status(400).json({ error: 'Tidak bisa menghapus sesi aktif ini.' });
  await dbx.deleteSession(token);
  res.json({ ok: true });
});

router.get('/quick', async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Khusus admin.' });
  res.json({ quick: await dbx.listQuickReplies() });
});

/* reaksi pesan */
router.post('/messages/:id/react', async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  if (!(await dbx.isMember(msg.conversationId, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const emoji = String((req.body || {}).emoji || '').slice(0, 8);
  const reactions = await dbx.setReaction(id, req.user.id, emoji || null);
  await hub.sendToConversation(msg.conversationId, { type: 'message:react', conversationId: msg.conversationId, messageId: id, reactions });
  res.json({ ok: true, reactions });
});

/* teruskan pesan */
router.post('/messages/:id/forward', async (req, res) => {
  const id = Number(req.params.id);
  const toId = Number((req.body || {}).toConversationId || 0);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  if (!(await dbx.isMember(msg.conversationId, req.user.id)) || !(await dbx.isMember(toId, req.user.id))) {
    return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  }
  const copy = await dbx.insertMessage({ conversationId: toId, senderId: req.user.id, body: msg.body, mediaId: msg.mediaId, forwarded: true });
  await hub.sendToConversation(toId, { type: 'message:new', conversationId: toId, message: { ...copy, readBy: [] } });
  res.status(201).json({ message: copy });
});

/* sematkan pesan oleh anggota chat */
router.post('/conversations/:id/pin', async (req, res) => {
  const id = Number(req.params.id);
  const messageId = Number((req.body || {}).messageId || 0);
  const pinned = !!(req.body || {}).pinned;
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const msg = await dbx.getMessage(messageId);
  if (!msg || msg.conversationId !== id) return res.status(400).json({ error: 'Pesan tidak valid.' });
  const updated = await dbx.setPinned(messageId, pinned);
  await hub.sendToConversation(id, { type: 'message:pinned', conversationId: id, message: updated, pinned });
  res.json({ ok: true });
});

/* starred messages */
router.post('/messages/:id/star', async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  if (!(await dbx.isMember(msg.conversationId, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const on = (req.body || {}).on === undefined ? !await dbx.isStarred(req.user.id, id) : !!(req.body || {}).on;
  await dbx.toggleStar(req.user.id, id, on);
  res.json({ ok: true, starred: on });
});
router.get('/stars', async (req, res) => {
  res.json({ stars: await dbx.listStarred(req.user.id) });
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
    const lastAdmin = await dbx.db.prepare(`SELECT m.sender_id AS s FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ? AND u.is_admin = 1 ORDER BY m.id DESC LIMIT 1`).get(id);
    agentId = lastAdmin?.s || null;
  }
  await dbx.recordRating(id, agentId, req.user.id, rating);
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
  const { type, username, email, title, members } = req.body || {};
  if (type === 'private') {
    if (!username && !email) return res.status(400).json({ error: 'username/email wajib.' });
    const other = email ? await dbx.getUserByEmail(String(email)) : await dbx.getUserByUsername(String(username));
    if (!other) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    if (await dbx.isBlocking(other.id, req.user.id)) return res.status(403).json({ error: 'Pengguna ini memblokir kamu.' });
    let id = await dbx.findPrivateConversation(req.user.id, other.id);
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
  res.json({ conversation: { id, type: conv.type, title, about: conv.about, memberCount: members.length, counterpart, pinned: await dbx.lastPinned(id) }, members });
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
  const mediaId = Number((req.body || {}).mediaId || 0) || null;
  if (mediaId && !await dbx.mediaById(mediaId)) return res.status(400).json({ error: 'Media tidak valid.' });
  if (!body && mediaId) body = '📷'; // pesan media-only tetap sah
  if (!body) return res.status(400).json({ error: 'Pesan kosong.' });
  if (body.length > 4000) return res.status(400).json({ error: 'Pesan terlalu panjang.' });
  if (!req.user.isAdmin) body = await dbx.censorText(body);
  if (await dbx.countRecentMessages(req.user.id) > 25) {
    await dbx.setUserFlagged(req.user.id, true);
    await dbx.logAdmin(null, 'spam.auto-flag', `@${req.user.username}`);
    return res.status(429).json({ error: 'Terlalu cepat. Akun ditandai untuk review admin.' });
  }
  if (!req.user.isAdmin && await dbx.sameBodySpread(req.user.id, body) >= 3) {
    await dbx.setUserFlagged(req.user.id, true);
    await dbx.logAdmin(null, 'fraud.auto-flag', `@${req.user.username} (pesan identik ke 3+ chat)`);
    return res.status(429).json({ error: 'Terdeteksi penyebaran pesan identik (fraud/spam). Akun direview admin.' });
  }
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  const conv0 = await dbx.getConversation(id);
  if (conv0?.type === 'private') {
    for (const o of await dbx.getMembers(id)) {
      if (o.id !== req.user.id && (await dbx.isBlocking(o.id, req.user.id))) return res.status(403).json({ error: 'Kamu diblokir oleh pengguna ini.' });
    }
  }
  const replyTo = Number((req.body || {}).replyTo || 0) || null;
  if (replyTo) {
    const rt = await dbx.getMessage(replyTo);
    if (!rt || rt.conversationId !== id) return res.status(400).json({ error: 'Pesan balasan tidak valid.' });
  }
  const enc = !!(req.body || {}).enc;
  const message = await dbx.insertMessage({ conversationId: id, senderId: req.user.id, body, mediaId, replyTo, enc });
  await dbx.setLastRead(id, req.user.id, message.id);
  const withRead = { ...message, readBy: [] };
  hub.sendToConversation(id, { type: 'message:new', conversationId: id, message: withRead });
  const members = await dbx.getMembers(id);
  if (!enc) { // push hanya untuk pesan plaintext (E2EE tak bisa dibaca server)
    for (const m of members) {
      if (m.id !== req.user.id && !m.isBot && !hub.isOnline(m.id)) {
        pushMod.sendPush(m.id, { title: req.user.displayName, body: String(body).slice(0, 80) });
      }
    }
  }
  const webhook = await dbx.kvGet('webhook_url');
  if (webhook) fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'message.new', conversationId: id, sender: req.user.username, body }) }).catch(() => {});
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
router.post('/conversations/:id/mute', async (req, res) => {
  const id = Number(req.params.id);
  if (!(await dbx.isMember(id, req.user.id))) return res.status(403).json({ error: 'Bukan peserta percakapan.' });
  await dbx.setMuted(id, req.user.id, !!(req.body || {}).muted);
  res.json({ ok: true });
});
router.get('/conversations/:id/mute', async (req, res) => {
  res.json({ muted: await dbx.getMuted(Number(req.params.id), req.user.id) });
});

/* edit pesan sendiri (teks, non-E2EE) */
router.patch('/messages/:id', async (req, res) => {
  const id = Number(req.params.id);
  const msg = await dbx.getMessage(id);
  if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
  if (msg.senderId !== req.user.id) return res.status(403).json({ error: 'Hanya pengirim yang dapat mengedit.' });
  if (msg.enc) return res.status(400).json({ error: 'Pesan terenkripsi tidak dapat diedit.' });
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Isi pesan kosong.' });
  if (body.length > 4000) return res.status(400).json({ error: 'Pesan terlalu panjang.' });
  const finalBody = req.user.isAdmin ? body : await dbx.censorText(body);
  await dbx.db.prepare('UPDATE messages SET body = ?, edited = 1 WHERE id = ?').run(finalBody, id);
  const updated = await dbx.getMessage(id);
  await hub.sendToConversation(msg.conversationId, { type: 'message:edited', conversationId: msg.conversationId, messageId: id, body: finalBody });
  res.json({ message: updated });
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

/* ---------- profil sendiri & blokir personal ---------- */
router.patch('/me', async (req, res) => {
  const b = req.body || {};
  const user = await dbx.updateOwnProfile(req.user.id, {
    displayName: b.displayName, about: b.about, avatarText: b.avatarText, avatarColor: b.avatarColor,
  });
  res.json({ user: { ...user, email: await dbx.getEmail(user.id) } });
});
router.get('/blocks', async (req, res) => res.json({ blocks: await dbx.listBlocks(req.user.id) }));
router.post('/blocks', async (req, res) => {
  const target = await dbx.getUserByEmail(String((req.body || {}).email || '')) || await dbx.getUserByUsername(String((req.body || {}).username || ''));
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Tidak bisa blokir diri sendiri.' });
  await dbx.setBlock(req.user.id, target.id, (req.body || {}).on !== false);
  res.json({ ok: true });
});
router.post('/invite', async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Format email tidak valid.' });
  if (await dbx.getUserByEmail(email)) return res.status(409).json({ error: 'Email sudah terdaftar — langsung buka chat.' });
  const mail = require('./mail');
  try {
    const r = await mail.sendInviteEmail(email, req.user.displayName);
    res.json({ ok: true, dev: r.devInfo || null });
  } catch (e) { res.status(503).json({ error: e.message }); }
});

/* ---------- E2EE keys ---------- */
router.post('/keys', async (req, res) => {
  const pubkey = String((req.body || {}).pubkey || '').slice(0, 400);
  if (!pubkey) return res.status(400).json({ error: 'pubkey wajib.' });
  await dbx.setUserPubkey(req.user.id, pubkey);
  res.json({ ok: true });
});
router.get('/keys/:userId', async (req, res) => {
  res.json({ pubkey: await dbx.getPubkey(Number(req.params.userId)) });
});

/* ---------- Web Push ---------- */
const pushMod = require('./push');
router.get('/push/vapid', async (req, res) => {
  const v = await pushMod.vapidKeys();
  res.json({ publicKey: v.publicKey });
});
router.get('/push/subs', async (req, res) => {
  res.json({ subs: await dbx.listPushSubs(req.user.id) });
});
router.post('/push/subscribe', async (req, res) => {
  const sub = (req.body || {}).subscription;
  if (!sub?.endpoint) return res.status(400).json({ error: 'Subscription tidak valid.' });
  await dbx.addPushSub(req.user.id, sub);
  res.status(201).json({ ok: true });
});
router.delete('/push/:id', async (req, res) => {
  const subs = await dbx.listPushSubs(req.user.id);
  if (!subs.some((s) => s.id === Number(req.params.id))) return res.status(403).json({ error: 'Bukan subscription kamu.' });
  await dbx.deletePushSub(Number(req.params.id));
  res.json({ ok: true });
});

/* ============================================================
   UPDATES / STATUS / CHANNELS / COMMUNITIES / CALLS
   ============================================================ */
router.get('/updates', async (req, res) => {
  const feed = await dbx.updatesFeed(req.user.id);
  res.json({ ...feed, channels: await dbx.listChannels(req.user.id) });
});
router.post('/status', async (req, res) => {
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Status kosong.' });
  if (body.length > 500) return res.status(400).json({ error: 'Status terlalu panjang.' });
  const st = await dbx.addStatus(req.user.id, body);
  res.status(201).json({ status: st });
});
router.delete('/status/:id', async (req, res) => {
  await dbx.deleteStatus(Number(req.params.id), req.user.id);
  res.json({ ok: true });
});
router.post('/status/:id/view', async (req, res) => {
  const st = await dbx.statusById(Number(req.params.id));
  if (!st) return res.status(404).json({ error: 'Status tidak ditemukan.' });
  if (st.user_id !== req.user.id) await dbx.markStatusViewed(st.id, req.user.id);
  res.json({ ok: true });
});

router.get('/channels', async (req, res) => res.json({ channels: await dbx.listChannels(req.user.id) }));
router.post('/channels', async (req, res) => {
  const title = String((req.body || {}).title || '').trim();
  if (!title) return res.status(400).json({ error: 'Nama saluran wajib.' });
  const id = await dbx.createChannel(title, String((req.body || {}).about || ''), req.user.id);
  res.status(201).json({ channelId: id });
});
router.post('/channels/:id/follow', async (req, res) => {
  await dbx.followChannel(Number(req.params.id), req.user.id, !!(req.body || {}).on);
  res.json({ ok: true });
});
router.get('/channels/:id/posts', async (req, res) => {
  res.json({ posts: await dbx.channelPosts(Number(req.params.id), req.user.id) });
});
router.post('/channels/:id/posts', async (req, res) => {
  const id = Number(req.params.id);
  const ch = await dbx.db.prepare('SELECT created_by FROM channels WHERE id = ?').get(id);
  if (!ch) return res.status(404).json({ error: 'Saluran tidak ditemukan.' });
  if (ch.created_by !== req.user.id) return res.status(403).json({ error: 'Hanya pemilik saluran yang bisa posting.' });
  const body = String((req.body || {}).body || '').trim();
  if (!body) return res.status(400).json({ error: 'Postingan kosong.' });
  const postId = await dbx.addChannelPost(id, req.user.id, body);
  res.status(201).json({ postId });
});

router.get('/communities', async (req, res) => res.json({ communities: await dbx.listCommunities(req.user.id) }));
router.get('/communities/:id', async (req, res) => {
  const d = await dbx.communityDetail(Number(req.params.id));
  if (!d) return res.status(404).json({ error: 'Komunitas tidak ditemukan.' });
  res.json({ community: d });
});
router.post('/communities', async (req, res) => {
  const title = String((req.body || {}).title || '').trim();
  if (!title) return res.status(400).json({ error: 'Nama komunitas wajib.' });
  const groups = (req.body || {}).groups || [];
  const myGroups = [];
  for (const g of groups) { if (await dbx.isMember(Number(g), req.user.id)) myGroups.push(Number(g)); }
  const id = await dbx.createCommunity(title, String((req.body || {}).about || ''), req.user.id, myGroups);
  res.status(201).json({ communityId: id });
});
router.post('/communities/:id/join', async (req, res) => {
  await dbx.joinCommunity(Number(req.params.id), req.user.id, !!(req.body || {}).on);
  res.json({ ok: true });
});

router.get('/calls', async (req, res) => res.json({ calls: await dbx.callHistory(req.user.id), pending: await dbx.pendingCalls(req.user.id) }));
router.post('/calls/offer', async (req, res) => {
  const calleeId = Number((req.body || {}).calleeId);
  const kind = (req.body || {}).kind === 'video' ? 'video' : 'voice';
  if (!(await dbx.getUserById(calleeId))) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (calleeId === req.user.id) return res.status(400).json({ error: 'Tidak bisa memanggil diri sendiri.' });
  const call = await dbx.createCall(req.user.id, calleeId, kind);
  hub.sendToUser(calleeId, { type: 'call:offer', call });
  if (!hub.isOnline(calleeId)) {
    pushMod.sendPush(calleeId, { title: req.user.displayName, body: `📞 Panggilan ${kind === 'video' ? 'video' : 'suara'} masuk — buka Xerophis` });
  }
  res.status(201).json({ call });
});
router.post('/calls/:id/accept', async (req, res) => {
  const call = await dbx.getCall(Number(req.params.id));
  if (!call || call.callee_id !== req.user.id) return res.status(403).json({ error: 'Bukan penerima panggilan.' });
  const updated = await dbx.setCall(call.id, { status: 'active', startedNow: true });
  hub.sendToUser(call.caller_id, { type: 'call:accept', call: updated });
  res.json({ call: updated });
});
router.post('/calls/:id/reject', async (req, res) => {
  const call = await dbx.getCall(Number(req.params.id));
  if (!call || call.callee_id !== req.user.id) return res.status(403).json({ error: 'Bukan penerima panggilan.' });
  const updated = await dbx.setCall(call.id, { status: 'rejected', endedNow: true });
  hub.sendToUser(call.caller_id, { type: 'call:reject', call: updated });
  res.json({ call: updated });
});
router.post('/calls/:id/end', async (req, res) => {
  const call = await dbx.getCall(Number(req.params.id));
  if (!call || (call.caller_id !== req.user.id && call.callee_id !== req.user.id)) return res.status(403).json({ error: 'Bukan peserta panggilan.' });
  const dur = call.started_at ? Math.max(1, Math.round((Date.now() - Date.parse(call.started_at)) / 1000)) : 0;
  const status = call.status === 'active' ? 'completed' : 'missed';
  const updated = await dbx.setCall(call.id, { status, endedNow: true, durationSec: dur });
  const other = call.caller_id === req.user.id ? call.callee_id : call.caller_id;
  hub.sendToUser(other, { type: 'call:end', call: updated });
  res.json({ call: updated });
});

module.exports = router;
