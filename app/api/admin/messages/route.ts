import { NextResponse } from "next/server";
import { requireAdmin } from "../core";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(req.url);
  const q = ((url.searchParams.get("q") ?? "").trim()).toLowerCase();
  const like = `%${q}%`;
  const conds = ["m.deletedAt IS NULL"];
  const vals: unknown[] = [];
  if (q) { conds.push("m.text LIKE ?"); vals.push(like); }
  const messages = sqlite.rows<any>(
    `SELECT m.*, u.username AS senderName, c.title AS conversationTitle
       FROM messages m JOIN users u ON u.id = m.senderId LEFT JOIN conversations c ON c.id = m.conversationId
      WHERE ${conds.join(" AND ")} ORDER BY m.createdAt DESC LIMIT 100`,
    ...vals
  );
  return NextResponse.json({ messages });
}
