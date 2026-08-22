import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { emit } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const member = sqlite.row<any>("SELECT 1 FROM conversation_members WHERE conversationId = ? AND userId = ?", id, user.id);
  if (!member) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Bukan anggota." } }, { status: 403 });
  emit("typing:start", { conversationId: id, userId: user.id, name: user.displayName });
  return NextResponse.json({ ok: true });
}
