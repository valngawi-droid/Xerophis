'use strict';
/** Xerophis realtime hub — WebSocket presence, typing, message fan-out. */
const { WebSocketServer } = require('ws');
const url = require('node:url');
const dbx = require('./db');

const sockets = new Map(); // userId -> Set<ws>

function onlineIds() { return [...sockets.keys()]; }
function isOnline(userId) { return (sockets.get(userId) || new Set()).size > 0; }

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}
function sendToUser(userId, payload) {
  for (const ws of sockets.get(userId) || []) send(ws, payload);
}
function broadcast(payload, exceptUserId = null) {
  for (const [uid, set] of sockets) if (uid !== exceptUserId) for (const ws of set) send(ws, payload);
}
async function sendToConversation(conversationId, payload, exceptUserId = null) {
  const members = await dbx.getMembers(conversationId);
  for (const m of members) if (m.id !== exceptUserId) sendToUser(m.id, payload);
}

function attach(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', async (ws, req) => {
    const token = url.parse(req.url, true).query.token || '';
    const user = token ? await dbx.getUserByToken(token) : null;
    if (!user) { ws.close(4401, 'unauthorized'); return; }

    const wasOnline = isOnline(user.id);
    if (!sockets.has(user.id)) sockets.set(user.id, new Set());
    sockets.get(user.id).add(ws);
    ws.userId = user.id;

    send(ws, { type: 'hello', user, online: onlineIds() });
    if (!wasOnline) broadcast({ type: 'presence', userId: user.id, online: true }, user.id);

    ws.on('message', async (raw) => {
      let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type === 'typing' && Number.isInteger(msg.conversationId)) {
        await sendToConversation(msg.conversationId, {
          type: 'typing', conversationId: msg.conversationId,
          userId: user.id, name: user.displayName,
        }, user.id);
      }
    });
    ws.on('close', () => {
      const set = sockets.get(user.id);
      if (set) { set.delete(ws); if (!set.size) { sockets.delete(user.id); broadcast({ type: 'presence', userId: user.id, online: false }); } }
    });
  });
  return wss;
}

module.exports = { attach, sendToUser, sendToConversation, broadcast, onlineIds, isOnline };
