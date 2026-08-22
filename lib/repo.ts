import { sqlite } from "./db";

/**
 * Data-access helpers that shape raw rows into the API/frontend shapes.
 */

export type ChatItem = {
  id: string;
  type: string;
  name: string;
  avatar: string;
  avatarColor: string;
  description: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  muted: boolean;
  pinned: boolean;
  online: boolean;
  memberCount: number;
  verified: boolean;
};

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam`;
  const d = new Date(ts);
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return "kemarin";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function listConversationsFor(userId: string): ChatItem[] {
  const convs = sqlite.rows<any>(
    `SELECT c.* FROM conversations c
       JOIN conversation_members m ON m.conversationId = c.id
      WHERE m.userId = ?
      ORDER BY c.updatedAt DESC`,
    userId
  );
  return convs.map((c) => {
    const last = sqlite.row<any>(
      `SELECT text, createdAt, senderId FROM messages WHERE conversationId = ? AND deletedAt IS NULL ORDER BY createdAt DESC LIMIT 1`,
      c.id
    );
    const memberCount = sqlite.row<{ c: number }>(
      "SELECT COUNT(*) AS c FROM conversation_members WHERE conversationId = ?",
      c.id
    )?.c ?? 1;
    const unread = sqlite.row<{ c: number }>(
      `SELECT COUNT(*) AS c FROM messages
        WHERE conversationId = ? AND senderId != ? AND status != 'read' AND deletedAt IS NULL`,
      c.id,
      userId
    )?.c ?? 0;
    // mark read when listing for simplicity of demo
    sqlite.run(
      `UPDATE messages SET status = 'read' WHERE conversationId = ? AND senderId != ? AND status != 'read'`,
      c.id,
      userId
    );
    const other = sqlite.row<any>(
      `SELECT u.displayName, u.avatarUrl FROM conversation_members mm
         JOIN users u ON u.id = mm.userId
        WHERE mm.conversationId = ? AND mm.userId != ?
        ORDER BY (mm.role = 'owner') DESC LIMIT 1`,
      c.id,
      userId
    );
    const title = c.type === "direct" ? other?.displayName ?? c.title : c.title;
    const name = title;
    const verifier = name.toLowerCase().includes("x studio") || name.toLowerCase().includes("x official");
    return {
      id: c.id,
      type: c.type,
      name,
      avatar: (c.avatar ?? (other?.avatarUrl ?? "X")),
      avatarColor: c.avatar ?? "#FF1111",
      description: c.description ?? "",
      lastMessage: last?.text ?? "Tidak ada pesan",
      lastTime: last?.createdAt ? relTime(last.createdAt) : "",
      unread,
      muted: !!c.muted,
      pinned: !!c.pinned,
      online: false,
      memberCount,
      verified: verifier,
    } as ChatItem;
  });
}

export function listMessages(conversationId: string, userId: string, cursor?: string, limit = 40) {
  const base = `FROM messages WHERE conversationId = ? AND deletedAt IS NULL`;
  const order = `ORDER BY createdAt ASC`;
  const msgs = sqlite.rows<any>(`SELECT * ${base} ${order}`, conversationId);
  // filter is already limited; cursor-based pagination by id
  let list = msgs;
  if (cursor) {
    const idx = msgs.findIndex((m) => m.id === cursor);
    if (idx >= 0) list = msgs.slice(0, idx + 1);
  }
  if (list.length > limit) list = list.slice(-limit);
  const map = new Map<number, Map<string, string[]>>();
  for (const m of list) {
    const reacts = sqlite.rows<any>(
      `SELECT emoji FROM message_reactions WHERE messageId = ?`,
      m.id
    );
    if (reacts.length) {
      const byUser = new Map<string, string[]>();
      for (const r of reacts) byUser.set(r.emoji, [r.emoji]);
      map.set(Number(m.createdAt), byUser);
    }
  }
  return list.map((m) => {
    const reactions = sqlite.rows<any>(`SELECT emoji FROM message_reactions WHERE messageId = ?`, m.id).map((r) => r.emoji);
    const sender = sqlite.row<any>(`SELECT displayName, username, avatarUrl FROM users WHERE id = ?`, m.senderId);
    const att = sqlite.row<any>("SELECT url FROM message_attachments WHERE messageId = ? LIMIT 1", m.id);
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      from: m.senderId === userId ? "me" : "them",
      senderName: sender?.displayName ?? "Xerophis User",
      text: m.text,
      kind: m.kind,
      mediaUrl: att?.url ?? null,
      replyTo: m.replyTo,
      status: m.status,
      time: new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      date: new Date(m.createdAt).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }),
      reactions,
    };
  });
}

export function unreadConversationCount(userId: string): number {
  const c = sqlite.row<{ c: number }>(
    `SELECT COUNT(*) AS c FROM messages
      WHERE senderId != ? AND status != 'read' AND deletedAt IS NULL
        AND conversationId IN (SELECT conversationId FROM conversation_members WHERE userId = ?)`,
    userId,
    userId
  );
  return c?.c ?? 0;
}
