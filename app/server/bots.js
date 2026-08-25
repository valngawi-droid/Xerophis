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

async function chooseReply(bot, text) {
  const rule = await dbx.matchAutoRule(text); // auto-reply keyword dari King Panel
  if (rule) return rule.reply;
  let bh = null;
  try { bh = JSON.parse((await dbx.kvGet('business_hours')) || 'null'); } catch { bh = null; }
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
      const reply = await dbx.insertMessage({ conversationId, senderId: bot.id, body: await chooseReply(bot, message.body) });
      await dbx.setLastRead(conversationId, bot.id, reply.id);
      hub.sendToConversation(conversationId, { type: 'message:new', conversationId, message: reply });
    }, 2000 + Math.random() * 1200);
  }
}

/** New accounts get a welcome conversation from the official Xerophis bot. */
async function welcomeNewUser(user) {
  const official = await dbx.getUserByUsername('xerophis');
  if (!official) return null;
  let convId = await dbx.findPrivateConversation(user.id, official.id);
  if (!convId) convId = await dbx.createConversation({ type: 'private', createdBy: official.id, memberIds: [user.id, official.id] });
  const msg = await dbx.insertMessage({
    conversationId: convId, senderId: official.id,
    body: `Welcome to Xerophis, ${user.displayName}! 🔥 Akun kamu aktif. Pesan terenkripsi end-to-end — mulai chat pertama kamu sekarang.`,
  });
  return { convId, msg };
}

/** Onboarding akun baru: welcome DM + gabung Lounge + ikuti X Official — biar gak pernah kosong. */
async function onboardUser(user) {
  const dev = await dbx.getUserByUsername('xerophis');
  await welcomeNewUser(user);
  let lounge = await dbx.db.prepare("SELECT id FROM conversations WHERE title = 'Xerophis Lounge'").get();
  if (!lounge) {
    const ids = [user.id, dev?.id].filter(Boolean);
    const id = await dbx.createConversation({ type: 'group', title: 'Xerophis Lounge', createdBy: dev?.id || user.id, memberIds: ids });
    await dbx.insertMessage({ conversationId: id, senderId: dev?.id || user.id, body: 'Selamat datang di Xerophis Lounge — ngobrol sama seluruh warga Xerophis di sini! 🎉', kind: 'system' });
    lounge = { id };
  } else if (!(await dbx.isMember(lounge.id, user.id))) {
    await dbx.db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)').run(lounge.id, user.id);
  }
  let ch = await dbx.db.prepare("SELECT id FROM channels WHERE title = 'X Official'").get();
  if (!ch && dev) ch = { id: await dbx.createChannel('X Official', 'Pengumuman sistem', dev.id) };
  if (ch) await dbx.followChannel(ch.id, user.id, true);
}

module.exports = { onHumanMessage, welcomeNewUser, onboardUser };
