import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const community = sqlite.row<any>("SELECT id FROM communities WHERE id = ?", id);
  if (!community) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Komunitas tidak ditemukan." } }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const action = body.action === "leave" ? "leave" : "join";
  if (action === "leave") {
    sqlite.run("DELETE FROM community_members WHERE communityId = ? AND userId = ?", id, user.id);
  } else {
    sqlite.run("INSERT OR IGNORE INTO community_members (id, communityId, userId, role, joinedAt) VALUES (?,?,?,'member',?)", newId("cm"), id, user.id, nowMs());
  }
  return NextResponse.json({ ok: true, joined: action !== "leave" });
}
