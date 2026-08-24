'use strict';
/** Xerophis demo bots — give the realtime slice life (typing → reply, read receipts). */
const dbx = require('./db');
const hub = require('./wsHub');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const GENERIC = [
  'Oke sjap boss 🔥', 'wkwkwkwk 😂', 'Sip, nanti aku cek dulu ya.',
  'Mantap, red dark gila emang UI-nya 🖤❤️', 'Gas terus, jangan kendor!',
  'Bebas aja asal ga 18+ 🤝', 'Siap laksanakan 🫡', 'Nanti malam voice call yuk?',
  'Update-nya udah keren banget 👌', 'Aku lagi di Bandung nih, kamu dimana?',
];
const OFFICIAL = [
  'Welcome to Xerophis Studio — bebas berkarya, asal tetap rispett 🤝',
  'Tip: tahan pesan untuk menghapus atau meneruskannya.',
  'Xerophis v1.0.0 — dikembangkan dengan ♥ oleh Pall.',
  'Semua pesan di Xerophis terenkripsi secara end-to-end. 🔒',
];
const GREET = ['Halo! 👋', 'Hai hai, ada yang bisa dibantu?', 'Yo! 🔥'];

function chooseReply(bot, text) {
  const rule = dbx.matchAutoRule(text); // auto-reply keyword dari King Panel
  if (rule) return rule.reply;
  const bh = (() => { try { return JSON.parse(dbx.kvGet('business_hours') || 'null'); } catch { return null; } })();
  if (bh?.enabled) { // auto-reply di luar jam kerja
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const inside = bh.start <= bh.end ? (hm >= bh.start && hm < bh.end) : (hm >= bh.start || hm < bh.end);
    if (!inside) return bh.reply || 'Kami sedang di luar jam kerja. Pesan kamu akan dibalas saat kami kembali. 🙏';
  }
  const t = text.toLowerCase();
  if (/(halo|hai|hey|hi|pagi|malam)/.test(t)) return pick(GREET);
  if (t.includes('?')) return pick(['Pertanyaan bagus — coba cek menu Settings ya.', 'Hmm, sebentar aku cek dulu 🔍', 'Menurutku sih gas aja 🔥']);
  return bot.isOfficial ? pick(OFFICIAL) : pick(GENERIC);
}

/** After a human message lands, bots in the conversation read + type + reply. */
function onHumanMessage(conversationId, message, members) {
  for (const bot of members.filter((m) => m.isBot && m.id !== message.senderId)) {
    setTimeout(async () => {
      await dbx.setLastRead(conversationId, bot.id, message.id);
      hub.sendToConversation(conversationId, { type: 'read', conversationId, userId: bot.id, messageId: message.id }, bot.id);
    }, 500 + Math.random() * 400);
    setTimeout(() => {
      hub.sendToConversation(conversationId, { type: 'typing', conversationId, userId: bot.id, name: bot.displayName });
    }, 1100);
    setTimeout(async () => {
      const reply = await dbx.insertMessage({ conversationId, senderId: bot.id, body: chooseReply(bot, message.body) });
      await dbx.setLastRead(conversationId, bot.id, reply.id);
      hub.sendToConversation(conversationId, { type: 'message:new', conversationId, message: reply });
    }, 2000 + Math.random() * 1200);
  }
}

/** New accounts get a welcome conversation from the official Xerophis bot. */
async function welcomeNewUser(user) {
  const official = await dbx.getUserByUsername('xerophis');
  if (!official) return null;
  let convId = dbx.findPrivateConversation(user.id, official.id);
  if (!convId) convId = await dbx.createConversation({ type: 'private', createdBy: official.id, memberIds: [user.id, official.id] });
  const msg = await dbx.insertMessage({
    conversationId: convId, senderId: official.id,
    body: `Welcome to Xerophis, ${user.displayName}! 🔥 Akun kamu aktif. Pesan terenkripsi end-to-end — mulai chat pertama kamu sekarang.`,
  });
  return { convId, msg };
}

module.exports = { onHumanMessage, welcomeNewUser };
