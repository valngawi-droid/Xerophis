import { DatabaseSync } from "node:sqlite";
import { hashPassword, newId, hashToken } from "./db";

/**
 * Seeds the Xerophis database with realistic demo data so the first load
 * feels alive. It is only run when the users table is empty.
 */

const AV = {
  red: "#FF1111",
  darkred: "#D90000",
  green: "#31D158",
  blue: "#4AA3FF",
  amber: "#FFB020",
  pink: "#E84393",
  purple: "#A06BFF",
  teal: "#2DD4BF",
};

// For "today" (daysAgo 0) return a time in the near past so the data feels
// alive; for other days use the calendar day at the given hour/minute.
function d(daysAgo: number, hour = 9, min = 0): number {
  if (daysAgo === 0) {
    return Date.now() - (((24 - hour) * 60) + min) * 60_000;
  }
  const t = new Date();
  t.setDate(t.getDate() - daysAgo);
  t.setHours(hour, min, 0, 0);
  return t.getTime();
}

// statuses should expire ~24h from now
function statusTimes(agoMin: number): { created: number; expires: number } {
  const created = Date.now() - agoMin * 60_000;
  return { created, expires: created + 24 * 60 * 60 * 1000 };
}

export function seed(db: DatabaseSync) {
  const insUser = db.prepare(
    `INSERT INTO users (id, email, phone, username, passwordHash, displayName, avatarUrl, bio, status, isVerified, isOnline, lastSeen, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`
  );
  const insSession = db.prepare(
    `INSERT INTO sessions (id, userId, tokenHash, device, browser, location, ip, createdAt, lastActive, expiresAt) VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  const insConv = db.prepare(
    `INSERT INTO conversations (id, type, title, description, avatar, ownerId, muted, pinned, wallpaper, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  const insMember = db.prepare(
    `INSERT INTO conversation_members (id, conversationId, userId, role, joinedAt) VALUES (?,?,?,?,?)`
  );
  const insMsg = db.prepare(
    `INSERT INTO messages (id, conversationId, senderId, text, kind, replyTo, createdAt, editedAt, deletedAt, status) VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  const insReaction = db.prepare(
    `INSERT INTO message_reactions (id, messageId, userId, emoji, createdAt) VALUES (?,?,?,?,?)`
  );
  const insCommunity = db.prepare(
    `INSERT INTO communities (id, name, description, avatar, ownerId, createdAt) VALUES (?,?,?,?,?,?)`
  );
  const insChannel = db.prepare(
    `INSERT INTO channels (id, name, username, description, avatar, ownerId, subscriberCount, createdAt) VALUES (?,?,?,?,?,?,?,?)`
  );
  const insStatus = db.prepare(
    `INSERT INTO statuses (id, userId, content, mediaUrl, kind, expiresAt, createdAt) VALUES (?,?,?,?,?,?,?)`
  );
  const insNotification = db.prepare(
    `INSERT INTO notifications (id, userId, type, title, body, read, conversationId, createdAt) VALUES (?,?,?,?,?,?,?,?)`
  );
  const insCall = db.prepare(
    `INSERT INTO calls (id, callerId, receiverId, conversationId, type, status, startedAt, endedAt) VALUES (?,?,?,?,?,?,?,?)`
  );
  const insContact = db.prepare(
    `INSERT INTO contacts (id, userId, contactId, nickname, favorite, blocked, createdAt) VALUES (?,?,?,?,?,?,?)`
  );
  const insPrivacy = db.prepare(
    `INSERT INTO privacy_settings (userId, lastSeen, profilePhoto, about, status, online, readReceipts, groupAdd, liveLocation, disappearing, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  const insChatSettings = db.prepare(
    `INSERT INTO chat_settings (userId, theme, wallpaper, enterToSend, mediaVisibility, fontSize, updatedAt) VALUES (?,?,?,?,?,?,?)`
  );
  const insNotifSettings = db.prepare(
    `INSERT INTO notification_settings (userId, messageSound, messageVibration, popup, groupSound, groupVibration, callRingtone, callVibration, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`
  );
  const insMedia = db.prepare(
    `INSERT INTO media (id, uploaderId, type, url, name, size, mime, createdAt) VALUES (?,?,?,?,?,?,?,?)`
  );
  const insAttachment = db.prepare(
    `INSERT INTO message_attachments (id, messageId, type, url, name, size, mime, createdAt) VALUES (?,?,?,?,?,?,?,?)`
  );

  const passwordHash = hashPassword("Xerophis#2025");

  // ---- Users ----
  const users: [string, string | null, string | null, string, string, string, string, string, number][] = [
    ["u_xerophis", "user@xerophis.app", "+62 812-3456-7890", "xerophis", passwordHash, "Xerophis User", "Hey there! I am using Xerophis.", AV.red, d(120)],
    ["u_garis", null, "+62 811-1111-1111", "gariskeras", passwordHash, "garis keras Xerophis", "berjalan keras ke arah cita-cita", AV.darkred, d(90)],
    ["u_rehan", "rehan@xerophis.app", null, "rehanq", passwordHash, "Rehan Qurohman", "Intro nya red dark gila 🔥", AV.pink, d(60)],
    ["u_husni", null, null, "husnij", passwordHash, "Husni Jauhar", "Awokawok", AV.blue, d(48)],
    ["u_noval", null, null, "novalr", passwordHash, "Noval Rizki", "Semangat!", AV.teal, d(40)],
    ["u_moch", null, null, "mochrifki", passwordHash, "Moch. Rifki Pratama", "Oke siap boss", AV.amber, d(35)],
    ["u_ngabers", null, null, "ngabers", passwordHash, "Ngabers Project", "Komunitas kreatif", AV.purple, d(30)],
    ["u_team", null, null, "xerophisteam", passwordHash, "Xerophis Team Dev", "Welcome to Xerophis Studio", AV.green, d(100)],
  ];
  // Base avatars as paths so the generated brand images are used.
  const AVATAR_IMAGES: Record<string, string> = {
    u_xerophis: "/avatars/avatar-a.png",
    u_garis: "/avatars/avatar-c.png",
    u_team: "/avatars/avatar-e.png",
    u_rehan: "/avatars/avatar-b.png",
    u_husni: "/avatars/avatar-f.png",
    u_noval: "/avatars/avatar-d.png",
    u_moch: "/avatars/avatar-a.png",
    u_ngabers: "/avatars/avatar-c.png",
  };
  for (const [id, email, phone, uname, hash, dn, bio, color, created] of users) {
    const avatar = AVATAR_IMAGES[id] ?? (color ?? null);
    insUser.run(id, email, phone, uname, hash, dn, avatar, bio, 1, 1, created, created, created);
    insContact.run(newId("c"), id, id, null, 0, 0, created);
  }
  // make the demo user's contacts = everyone else so "start a chat" feels alive
  for (const [id] of users) {
    if (id !== "u_xerophis") insContact.run(newId("c"), "u_xerophis", id, null, 0, 0, d(2));
  }

  // demo session for the demo user so login works out of the box in demo mode
  const demoToken = "demo-token-xerophis-0001";
  insSession.run(
    newId("s"),
    "u_xerophis",
    hashToken(demoToken),
    "Windows",
    "Chrome",
    "Bandung, ID",
    "127.0.0.1",
    d(1),
    d(0, 10, 0),
    d(-3)
  );

  // ---- Conversations ----
  const conversations: { id: string; type: string; title: string; desc: string; avatar: string | null; owner: string; members: [string, string][]; msgs: [string, string, string, number][]; unread: number; muted?: number; pinned?: number }[] = [
    {
      id: "conv_garis",
      type: "group",
      title: "garis keras Xerophis",
      desc: "Welcome too Xerophis Studio 👋 Selamat datang di Xerophis Studio. Selalu berjalan keras ke arah cita-cita.",
      avatar: "/avatars/avatar-c.png",
      owner: "u_xerophis",
      members: [
        ["u_xerophis", "owner"],
        ["u_garis", "admin"],
      ],
      msgs: [
        ["g1", "u_garis", "Hai", d(0, 15, 46)],
        ["g2", "u_garis", "Welcome too X...", d(0, 15, 46)],
        ["g3", "u_garis", "Welcome too Xerophis Studio 👋 Selamat datang di Xerophis Studio.", d(0, 15, 46)],
        ["g4", "u_xerophis", "intro nya red dark gila 🔥", d(0, 15, 47)],
        ["g5", "u_rehan", "Kota malam ini 🌆", d(0, 15, 48)],
        ["g6", "u_garis", "Bukti! 🔥", d(0, 15, 49)],
      ],
      unread: 2,
      pinned: 1,
    },
    {
      id: "conv_team",
      type: "group",
      title: "Xerophis Team Dev",
      desc: "Welcome to Xerophis Studio 🚀",
      avatar: "/avatars/avatar-c.png",
      owner: "u_xerophis",
      members: [
        ["u_xerophis", "owner"],
        ["u_team", "admin"],
      ],
      msgs: [
        ["t1", "u_team", "Welcome to Xerophis Studio", d(0, 14, 30)],
        ["t2", "u_xerophis", "Gaskeun semua! 💪", d(0, 14, 31)],
      ],
      unread: 1,
    },
    {
      id: "conv_ngabers",
      type: "group",
      title: "Ngabers Project",
      desc: "Komunitas kreatif untuk berbagi proyek.",
      avatar: "/avatars/avatar-c.png",
      owner: "u_ngabers",
      members: [
        ["u_ngabers", "owner"],
        ["u_xerophis", "member"],
        ["u_noval", "member"],
      ],
      msgs: [
        ["n1", "u_ngabers", "Oke siap boss", d(0, 13, 5)],
        ["n2", "u_noval", "Noted 🫡", d(0, 13, 6)],
      ],
      unread: 0,
    },
    {
      id: "conv_random",
      type: "group",
      title: "Random Group",
      desc: "Kelompok santai",
      avatar: AV.pink,
      owner: "u_rehan",
      members: [
        ["u_rehan", "owner"],
        ["u_xerophis", "member"],
        ["u_husni", "member"],
        ["u_moch", "member"],
      ],
      msgs: [
        ["r1", "u_husni", "wkwkwkwk", d(0, 12, 40)],
        ["r2", "u_moch", "wkwkwkwk", d(0, 12, 40)],
      ],
      unread: 3,
      muted: 1,
    },
    {
      id: "conv_random2",
      type: "direct",
      title: "Moch. Rifki Pratama",
      desc: "",
      avatar: AV.amber,
      owner: "u_moch",
      members: [
        ["u_moch", "member"],
        ["u_xerophis", "member"],
      ],
      msgs: [
        ["rr1", "u_moch", "Bro kabar?", d(1, 20, 12)],
        ["rr2", "u_xerophis", "Lancar, kamu?", d(1, 20, 14)],
      ],
      unread: 0,
    },
    {
      id: "conv_rehan",
      type: "direct",
      title: "Rehan Qurohman",
      desc: "",
      avatar: "/avatars/avatar-b.png",
      owner: "u_rehan",
      members: [
        ["u_rehan", "member"],
        ["u_xerophis", "member"],
      ],
      msgs: [
        ["rh1", "u_rehan", "Mas, kapan rilis?", d(0, 9, 15)],
        ["rh2", "u_xerophis", "Bentar lagi 🔥", d(0, 9, 16)],
      ],
      unread: 1,
    },
    {
      id: "conv_husni",
      type: "direct",
      title: "Husni Jauhar",
      desc: "",
      avatar: AV.blue,
      owner: "u_husni",
      members: [
        ["u_husni", "member"],
        ["u_xerophis", "member"],
      ],
      msgs: [
        ["hj1", "u_husni", "Siap", d(1, 19, 40)],
      ],
      unread: 0,
    },
    {
      id: "conv_noval",
      type: "direct",
      title: "Noval Rizki",
      desc: "",
      avatar: AV.teal,
      owner: "u_noval",
      members: [
        ["u_noval", "member"],
        ["u_xerophis", "member"],
      ],
      msgs: [],
      unread: 0,
    },
    {
      id: "conv_xstudio",
      type: "channel",
      title: "X Studio Channel",
      desc: "Update terbaru seputar Xerophis.",
      avatar: "/avatars/avatar-c.png",
      owner: "u_team",
      members: [
        ["u_xerophis", "member"],
        ["u_team", "owner"],
      ],
      msgs: [
        ["xs1", "u_team", "Sneak peek Xerophis v2 🔥", d(0, 15, 10)],
        ["xs2", "u_team", "Update hari ini: tema baru, mode gelap, dan banyak lagi.", d(0, 15, 10)],
      ],
      unread: 2,
      pinned: 1,
    },
    {
      id: "conv_xofficial",
      type: "channel",
      title: "X Official",
      desc: "Pengumuman resmi Xerophis.",
      avatar: "/avatars/avatar-c.png",
      owner: "u_team",
      members: [
        ["u_xerophis", "member"],
        ["u_team", "owner"],
      ],
      msgs: [
        ["xo1", "u_team", "Selamat datang di Xerophis", d(0, 14, 30)],
      ],
      unread: 0,
    },
  ];

  for (const c of conversations) {
    insConv.run(c.id, c.type, c.title, c.desc, c.avatar, c.owner, c.muted ?? 0, c.pinned ?? 0, null, d(20), d(20));
    for (const [uid, role] of c.members) {
      insMember.run(newId("cm"), c.id, uid, role, d(20));
    }
    for (const [id, sender, text, createdAt] of c.msgs) {
      // g5 is a demo photo message
      const kind = id === "g5" ? "image" : "text";
      insMsg.run(id, c.id, sender, text, kind, null, createdAt, null, null, "read");
    }
    // reactions on the 3rd message of each conv that has at least 3 messages
    if (c.msgs.length >= 3) {
      const reacts: [string, string][] = [
        ["u_xerophis", "🔥"],
        ["u_garis", "❤️"],
        ["u_team", "😂"],
      ];
      for (const [uid, emoji] of reacts) {
        insReaction.run(newId("r"), c.msgs[2][0], uid, emoji, d(0, 15, 50));
      }
    }
  }

  // Attach a photo to the image message (g5 in conv_garis) so media shows in chat.
  insAttachment.run(newId("att"), "g5", "image", "/media/photo-1.png", "photo-1.png", 362180, "image/png", d(0, 15, 48));

  // ---- Communities ----
  insCommunity.run("com_xerophis", "Xerophis Community", "Ruang untuk para pejuang yang berjalan keras ke arah cita-cita.", AV.red, "u_xerophis", d(60));
  insCommunity.run("com_ngabers", "Ngabers Project", "Komunitas kreatif untuk berbagi proyek dan ide.", AV.purple, "u_ngabers", d(50));
  insCommunity.run("com_xstudio", "X Studio", "Studio kreatif komunitas Xerophis.", AV.blue, "u_team", d(40));
  db.prepare("INSERT INTO community_members (id, communityId, userId, role, joinedAt) VALUES (?,?,?,?,?)").run(newId("cmr"), "com_xerophis", "u_xerophis", "owner", d(60));

  // ---- Channels ----
  insChannel.run("chan_xstudio", "X Studio Channel", "xstudio", "Update resmi Xerophis Studio.", AV.red, "u_team", 182000, d(80));
  insChannel.run("chan_xofficial", "X Official", "xofficial", "Pengumuman resmi Xerophis.", AV.purple, "u_team", 96400, d(70));
  insChannel.run("chan_ngabers", "Ngabers Project", "ngabers", "Proyek dan ide kreatif.", AV.purple, "u_ngabers", 12800, d(55));

  // ---- Status ----
  const st1 = statusTimes(320);
  const st2 = statusTimes(180);
  const st3 = statusTimes(90);
  insStatus.run("st1", "u_xerophis", "Mulai petualangan baru 🔥", null, "text", st1.expires, st1.created);
  insStatus.run("st2", "u_rehan", "Intro nya red dark gila", null, "text", st2.expires, st2.created);
  insStatus.run("st3", "u_husni", "Gw semangat 45 🔥", null, "text", st3.expires, st3.created);
  // photo statuses
  insStatus.run("st4", "u_rehan", "Kota malam ini 🌆", "/media/photo-1.png", "media", st2.expires, st2.created);
  insStatus.run("st5", "u_xerophis", "Ruang kerja", "/media/photo-2.png", "media", st1.expires, st1.created);
  insStatus.run("st6", "u_husni", "Santai 🔥", "/media/photo-4.png", "media", st3.expires, st3.created);

  // ---- Notifications ----
  insNotification.run(newId("nt"), "u_xerophis", "message", "Pesan baru", "garis keras Xerophis: intro nya red dark gila 🔥", 0, "conv_garis", d(0, 15, 47));
  insNotification.run(newId("nt"), "u_xerophis", "community", "Undangan Komunitas", "Anda diundang bergabung ke Ngabers Project", 0, null, d(0, 12, 30));
  insNotification.run(newId("nt"), "u_xerophis", "security", "Masuk akun baru", "Log masuk dari perangkat baru terdeteksi", 1, null, d(1, 8, 0));

  // ---- Calls ----
  insCall.run(newId("cl"), "u_team", "u_xerophis", "conv_team", "video", "missed", d(1, 21, 14), d(1, 21, 14));
  insCall.run(newId("cl"), "u_xerophis", "u_rehan", "conv_rehan", "audio", "outgoing", d(1, 19, 3), d(1, 19, 8));
  insCall.run(newId("cl"), "u_husni", "u_xerophis", "conv_husni", "audio", "incoming", d(2, 22, 8), d(2, 22, 9));

  // ---- Settings for demo user ----
  insPrivacy.run("u_xerophis", "Everyone", "Everyone", "Everyone", "Contacts", "Everyone", 1, "Contacts", "Nobody", 0, d(5));
  insChatSettings.run("u_xerophis", "dark", "", 1, "Default", "medium", d(5));
  insNotifSettings.run("u_xerophis", 1, 1, 1, 1, 1, 1, 1, d(5));

  // ---- Media sample ----
  insMedia.run(newId("md"), "u_xerophis", "image", "/demo/media-sample.svg", "welcome.svg", 2048, "image/svg+xml", d(3));
  insMedia.run(newId("md"), "u_rehan", "image", "/media/photo-1.png", "photo-1.png", 362180, "image/png", d(1));
  insMedia.run(newId("md"), "u_xerophis", "image", "/media/photo-2.png", "photo-2.png", 320194, "image/png", d(1));
  insMedia.run(newId("md"), "u_husni", "image", "/media/photo-4.png", "photo-4.png", 354208, "image/png", d(1));
  // also for the other users so their settings work
  for (const u of users.slice(1)) {
    insPrivacy.run(u[0], "Everyone", "Everyone", "Everyone", "Contacts", "Everyone", 1, "Contacts", "Nobody", 0, d(5));
    insChatSettings.run(u[0], "dark", "", 1, "Default", "medium", d(5));
    insNotifSettings.run(u[0], 1, 1, 1, 1, 1, 1, 1, d(5));
  }
}
