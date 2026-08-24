'use strict';
/** Xerophis demo seed — realistic Indonesian demo data matching the reference screens. */
const bcrypt = require('bcryptjs');
const dbx = require('./db');

const ago = (min) => new Date(Date.now() - min * 60_000).toISOString();

async function seed() {
  const { db } = dbx;
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return false;

  const hash = await bcrypt.hash('xerophis', 10);
  const mk = async (u) => dbx.createUser({ passwordHash: hash, ...u });

  const me     = await mk({ username: 'xerophisuser', displayName: 'Xerophis User', phone: '+62 812-3456-7890', about: 'Hey there! I am using Xerophis.', avatarText: '99', avatarColor: '#8c1218', isAdmin: true });
  const dev    = await mk({ username: 'xerophis', displayName: 'Xerophis Team Dev', about: 'Official Xerophis channel. Developed with ♥ by Pall.', avatarText: 'X', avatarColor: '#5c0f13', isBot: true, isOfficial: true });
  const bot999 = await mk({ username: '+000999', displayName: '+000999', about: 'Bot santai. Ketik untuk mulai chat 👋', avatarText: '99', avatarColor: '#7a1216', isBot: true });
  const rehan  = await mk({ username: 'rehan', displayName: 'Rehan Qurohman', avatarText: 'RQ', avatarColor: '#6d1a1a' });
  const husni  = await mk({ username: 'husni', displayName: 'Husni Jauhar', avatarText: 'HJ', avatarColor: '#4a1010' });
  const noval  = await mk({ username: 'noval', displayName: 'Noval Rizki', avatarText: 'NR', avatarColor: '#7d2020' });
  const rifki  = await mk({ username: 'rifki', displayName: 'Moch. Rifki', avatarText: 'MR', avatarColor: '#591414' });
  await ensureOwnerAccounts();

  /* owner privilege: pall & noval otomatis owner + title Developer Xerophis */
  dbx.ensureOwners();
  db.prepare("UPDATE users SET role = 'super' WHERE username = 'xerophisuser'").run();

  const msg = async (convId, sender, body, minAgo, kind) => {
    db.prepare('INSERT INTO messages (conversation_id, sender_id, body, kind, created_at) VALUES (?,?,?,?,?)')
      .run(convId, sender.id, body, kind || 'text', ago(minAgo));
    return db.prepare('SELECT id FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(convId).id;
  };

  /* saved messages ("Anda") */
  const cSelf = await dbx.createConversation({ type: 'private', createdBy: me.id, memberIds: [me.id] });
  const mSelf = await msg(cSelf, me, ' Catatan: UI black + red, aksen #FF1E1E.', 190);

  /* garis keras Xerophis (group, 2 peserta) */
  const cGaris = await dbx.createConversation({ type: 'group', title: 'garis keras Xerophis', createdBy: rehan.id, memberIds: [me.id, rehan.id] });
  const g1 = await msg(cGaris, rehan, 'Welcome too Xerophis Studio bebas aja asal ga 18+ 🤝', 47);
  const g2 = await msg(cGaris, me, 'intro nya red dark gila 🔥', 46);

  /* +000999 bot */
  const c999 = await dbx.createConversation({ type: 'private', createdBy: me.id, memberIds: [me.id, bot999.id] });
  const m999 = await msg(c999, bot999, 'Ketik untuk memulai chat 👋', 45);

  /* Xerophis Team Dev */
  const cDev = await dbx.createConversation({ type: 'private', createdBy: dev.id, memberIds: [me.id, dev.id] });
  const mDev = await msg(cDev, dev, 'Welcome to Xerophis Studio — bebas berkarya asal ga 18+ 🤝', 44);
  db.prepare('UPDATE conversation_members SET favorite = 1 WHERE conversation_id = ? AND user_id = ?').run(cDev, me.id);

  /* Ngabers Project (group) */
  const cNgabers = await dbx.createConversation({ type: 'group', title: 'Ngabers Project', createdBy: me.id, memberIds: [me.id, rehan.id, husni.id, noval.id], roles: { [me.id]: 'admin' } });
  await msg(cNgabers, husni, 'Boss, desain baru udah naik ke staging.', 62);
  const mNg = await msg(cNgabers, rehan, 'Oke sjap boss', 60);

  /* Random Group */
  const cRandom = await dbx.createConversation({ type: 'group', title: 'Random Group', createdBy: rifki.id, memberIds: [me.id, rifki.id, husni.id] });
  for (let i = 0; i < 4; i++) await msg(cRandom, i % 2 ? husni : rifki, ['ada info apa hari ini?', 'wkwkwkwk', 'sabar woi 😹', 'gaskeun 🔥'][i], 36 - i);
  const mRand = await msg(cRandom, rifki, 'wkwkwkwk', 31);

  /* unread windows for the demo account */
  const setRead = (convId, userId, lastId) => db.prepare('UPDATE conversation_members SET last_read_id = ? WHERE conversation_id = ? AND user_id = ?').run(lastId, convId, userId);
  setRead(cGaris, me.id, g2); setRead(cGaris, rehan.id, g1);
  setRead(c999, me.id, m999); setRead(cDev, me.id, mDev); setRead(cSelf, me.id, mSelf);
  setRead(cNgabers, me.id, mNg - 1);          /* 1 unread */
  setRead(cRandom, me.id, mRand - 5);         /* 5 unread */

  /* demo session shortcut token for instant login in previews */
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run('demo-xerophis-token', me.id);

  console.log('[seed] demo data ready — login: xerophisuser / xerophis');
  return true;
}

/* pastikan akun owner ada (juga untuk DB lama yang di-seed sebelum fitur ini) */
async function ensureOwnerAccounts() {
  if (!(await dbx.getUserByUsername('pall'))) {
    await dbx.createUser({ username: 'pall', displayName: 'Pall', about: 'Owner & Developer Xerophis', avatarText: 'P', avatarColor: '#a3121a', passwordHash: await bcrypt.hash('pall', 10) });
  }
  dbx.ensureOwners();
}

if (require.main === module || process.argv.includes('--run')) {
  seed().then((did) => { if (!did) console.log('[seed] database already seeded.'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { seed, ensureOwnerAccounts };
