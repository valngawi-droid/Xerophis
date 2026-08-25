'use strict';
/** Xerophis demo seed — realistic Indonesian demo data matching the reference screens. */
const bcrypt = require('bcryptjs');
const dbx = require('./db');

const ago = (min) => new Date(Date.now() - min * 60_000).toISOString();

async function seed() {
  await dbx.ready;
  const { db } = dbx;
  if ((await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n > 0) return false;

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
  await db.prepare("UPDATE users SET role = 'super' WHERE username = 'xerophisuser'").run();

  const msg = async (convId, sender, body, minAgo, kind) => {
    await db.prepare('INSERT INTO messages (conversation_id, sender_id, body, kind, created_at) VALUES (?,?,?,?,?)')
      .run(convId, sender.id, body, kind || 'text', ago(minAgo));
    return (await db.prepare('SELECT id FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(convId)).id;
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
  await db.prepare('UPDATE conversation_members SET favorite = 1 WHERE conversation_id = ? AND user_id = ?').run(cDev, me.id);

  /* Ngabers Project (group) */
  const cNgabers = await dbx.createConversation({ type: 'group', title: 'Ngabers Project', createdBy: me.id, memberIds: [me.id, rehan.id, husni.id, noval.id], roles: { [me.id]: 'admin' } });
  await msg(cNgabers, husni, 'Boss, desain baru udah naik ke staging.', 62);
  const mNg = await msg(cNgabers, rehan, 'Oke sjap boss', 60);

  /* Random Group */
  const cRandom = await dbx.createConversation({ type: 'group', title: 'Random Group', createdBy: rifki.id, memberIds: [me.id, rifki.id, husni.id] });
  for (let i = 0; i < 4; i++) await msg(cRandom, i % 2 ? husni : rifki, ['ada info apa hari ini?', 'wkwkwkwk', 'sabar woi 😹', 'gaskeun 🔥'][i], 36 - i);
  const mRand = await msg(cRandom, rifki, 'wkwkwkwk', 31);

  /* updates / status (reference screen) */
  const status = async (u, body, minAgo) => db.prepare('INSERT INTO statuses (user_id, body, created_at) VALUES (?,?,?)').run(u.id, body, ago(minAgo));
  await status(rehan, 'Baru saja deploy build merah 🔥', 20);
  await status(husni, 'Desain avatar baru siap review', 160);
  await status(noval, 'Gas polling fitur berikutnya!', 300);

  /* channels (reference: X Studio Channel / X Official) */
  const ch1 = await dbx.createChannel('X Studio Channel', 'Channel resmi Xerophis Studio', dev.id);
  await db.prepare('INSERT INTO channel_followers (channel_id, user_id) VALUES (?, ?)').run(ch1, me.id);
  await dbx.addChannelPost(ch1, dev.id, 'Xerophis v0.2 — Updates, Channels, Communities & Calls rilis! 🔥');
  await dbx.addChannelPost(ch1, dev.id, 'Tip: ketik kingpall di pencarian untuk membuka King Panel.');
  const ch2 = await dbx.createChannel('X Official', 'Pengumuman sistem', dev.id);
  await dbx.addChannelPost(ch2, dev.id, 'Selamat datang di Xerophis — developed with ♥ by Pall.');

  /* community */
  await dbx.createCommunity('Xerophis Community', 'Wadah grup-grup Xerophis', me.id, [cNgabers, cRandom]);

  /* Xerophis Lounge — ruang kumpul semua warga (biar user baru gak pernah kosong) */
  const cLounge = await dbx.createConversation({ type: 'group', title: 'Xerophis Lounge', createdBy: dev.id, memberIds: [me.id, rehan.id, husni.id, noval.id, rifki.id, dev.id] });
  await msg(cLounge, dev, 'Selamat datang di Xerophis Lounge — ngobrol sama seluruh warga Xerophis di sini! 🎉', 90, 'system');
  await msg(cLounge, rifki, 'akhirnya rame juga wkwk', 85);
  await msg(cLounge, husni, 'gas polling fitur dong', 80);

  /* unread windows for the demo account */
  const setRead = async (convId, userId, lastId) => db.prepare('UPDATE conversation_members SET last_read_id = ? WHERE conversation_id = ? AND user_id = ?').run(lastId, convId, userId);
  await setRead(cGaris, me.id, g2); await setRead(cGaris, rehan.id, g1);
  await setRead(c999, me.id, m999); await setRead(cDev, me.id, mDev); await setRead(cSelf, me.id, mSelf);
  await setRead(cNgabers, me.id, mNg - 1);          /* 1 unread */
  await setRead(cRandom, me.id, mRand - 5);         /* 5 unread */

  /* reactions demo */
  const gMsg = await db.prepare("SELECT id FROM messages WHERE body LIKE 'intro nya%'").get();
  if (gMsg) await db.prepare('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)').run(gMsg.id, rehan.id, '🔥');

  /* demo session shortcut token for instant login in previews */
  await db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run('demo-xerophis-token', me.id);

  console.log('[seed] demo data ready — login: xerophisuser / xerophis');
  return true;
}

/* pastikan akun owner ada (juga untuk DB lama yang di-seed sebelum fitur ini) */
async function ensureOwnerAccounts() {
  await dbx.ready;
  for (const uname of dbx.OWNER_USERNAMES) {
    if (!(await dbx.getUserByUsername(uname))) {
      await dbx.createUser({
        username: uname, displayName: uname[0].toUpperCase() + uname.slice(1),
        about: 'Owner & Developer Xerophis', avatarText: uname[0].toUpperCase(), avatarColor: '#a3121a',
        passwordHash: await bcrypt.hash(uname, 10),
      });
    }
  }
  await dbx.ensureOwners();
}

/* backfill fitur v0.2 untuk DB yang di-seed sebelum Updates/Channels/Communities ada */
async function seedExtras() {
  await dbx.ready;
  const { db } = dbx;

  /* backfill Lounge utk DB lama: semua warga + bot resmi */
  const loungeRow = await db.prepare("SELECT id FROM conversations WHERE title = 'Xerophis Lounge'").get();
  if (!loungeRow) {
    const humans = await dbx.allHumanUsers();
    const dev2 = await dbx.getUserByUsername('xerophis');
    const ids = humans.map((h) => h.id);
    if (dev2 && !ids.includes(dev2.id)) ids.push(dev2.id);
    const id = await dbx.createConversation({ type: 'group', title: 'Xerophis Lounge', createdBy: dev2?.id || ids[0], memberIds: ids });
    await dbx.insertMessage({ conversationId: id, senderId: dev2?.id || ids[0], body: 'Selamat datang di Xerophis Lounge — ngobrol sama seluruh warga Xerophis di sini! 🎉', kind: 'system' });
  }

  if ((await db.prepare('SELECT COUNT(*) AS n FROM channels').get()).n > 0) return;
  const dev = await dbx.getUserByUsername('xerophis');
  const me = await dbx.getUserByUsername('xerophisuser');
  if (!dev || !me) return;
  for (const [uname, body] of [['rehan', 'Baru saja deploy build merah 🔥'], ['husni', 'Desain avatar baru siap review'], ['noval', 'Gas polling fitur berikutnya!']]) {
    const u = await dbx.getUserByUsername(uname);
    if (u) await dbx.addStatus(u.id, body);
  }
  const ch1 = await dbx.createChannel('X Studio Channel', 'Channel resmi Xerophis Studio', dev.id);
  await db.prepare('INSERT OR IGNORE INTO channel_followers (channel_id, user_id) VALUES (?, ?)').run(ch1, me.id);
  await dbx.addChannelPost(ch1, dev.id, 'Xerophis v0.2 — Updates, Channels, Communities & Calls rilis! 🔥');
  const ch2 = await dbx.createChannel('X Official', 'Pengumuman sistem', dev.id);
  await dbx.addChannelPost(ch2, dev.id, 'Selamat datang di Xerophis — developed with ♥ by Pall.');
  const groupIds = [];
  for (const t of ['Ngabers Project', 'Random Group']) {
    const g = await db.prepare('SELECT id FROM conversations WHERE title = ?').get(t);
    if (g) groupIds.push(g.id);
  }
  await dbx.createCommunity('Xerophis Community', 'Wadah grup-grup Xerophis', me.id, groupIds);
  console.log('[seed] extras v0.2 ready (updates/channels/communities)');
}

if (require.main === module || process.argv.includes('--run')) {
  seed().then((did) => { if (!did) console.log('[seed] database already seeded.'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { seed, ensureOwnerAccounts, seedExtras };
