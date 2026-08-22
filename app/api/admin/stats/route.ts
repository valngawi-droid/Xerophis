import { NextResponse } from "next/server";
import { requireAdmin } from "../core";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const count = (sql: string) => sqlite.row<{ c: number }>(sql)?.c ?? 0;
  const storage = sqlite.rows<{ size: number }>("SELECT size FROM media");
  const storageUsed = storage.reduce((a, b) => a + (b.size || 0), 0);

  // registrations per day (last 7)
  const regs = sqlite.rows<any>(
    `SELECT DATE(createdAt/1000, 'unixepoch') AS day, COUNT(*) AS c FROM users WHERE createdAt > ? GROUP BY day ORDER BY day`,
    Date.now() - 7 * 86400000
  );
  // messages per day (last 7)
  const msgPerDay = sqlite.rows<any>(
    `SELECT DATE(createdAt/1000, 'unixepoch') AS day, COUNT(*) AS c FROM messages WHERE createdAt > ? GROUP BY day ORDER BY day`,
    Date.now() - 7 * 86400000
  );

  return NextResponse.json({
    cards: {
      totalUsers: count("SELECT COUNT(*) AS c FROM users"),
      activeUsers: count("SELECT COUNT(*) AS c FROM users WHERE isOnline = 1"),
      onlineUsers: count("SELECT COUNT(*) AS c FROM users WHERE isOnline = 1"),
      totalMessages: count("SELECT COUNT(*) AS c FROM messages"),
      totalGroups: count("SELECT COUNT(*) AS c FROM conversations WHERE type='group'"),
      totalChannels: count("SELECT COUNT(*) AS c FROM channels"),
      totalCommunities: count("SELECT COUNT(*) AS c FROM communities"),
      openReports: count("SELECT COUNT(*) AS c FROM reports WHERE status='pending'"),
      storageUsed,
    },
    charts: {
      registrations: regs,
      messages: msgPerDay,
    },
    demo: true,
  });
}
