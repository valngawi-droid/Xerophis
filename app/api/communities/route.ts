import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";
import { isTitle } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const communities = sqlite.rows<any>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM community_members WHERE communityId=c.id) AS memberCount
     FROM communities c ORDER BY c.createdAt DESC`
  ).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    avatar: c.avatar ?? "#FF1111",
    memberCount: c.memberCount,
    ownerId: c.ownerId,
    createdAt: c.createdAt,
    joined: !!sqlite.row<any>("SELECT 1 FROM community_members WHERE communityId=? AND userId=?", c.id, user.id),
  }));
  return NextResponse.json({ communities });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!isTitle(body.name)) return NextResponse.json({ error: { code: "VALIDATION", message: "Nama komunitas tidak valid." } }, { status: 422 });
  const id = newId("com");
  const now = nowMs();
  sqlite.run("INSERT INTO communities (id, name, description, avatar, ownerId, createdAt) VALUES (?,?,?,?,?,?)", id, body.name.trim(), String(body.description ?? "").slice(0, 500), body.avatar ?? "#FF1111", user.id, now);
  sqlite.run("INSERT INTO community_members (id, communityId, userId, role, joinedAt) VALUES (?,?,?,'owner',?)", newId("cm"), id, user.id, now);
  return NextResponse.json({ community: { id, name: body.name.trim() } }, { status: 201 });
}
