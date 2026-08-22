import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

const REASONS = ["spam", "harassment", "inappropriate", "scam", "other"];
const TYPES = ["user", "message", "group", "channel", "community"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "");
  const reason = String(body.reason ?? "");
  if (!TYPES.includes(targetType) || !targetId || !REASONS.includes(reason)) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Data laporan tidak valid." } }, { status: 422 });
  }
  const id = newId("rp");
  const now = nowMs();
  sqlite.run("INSERT INTO reports (id, reporterId, targetType, targetId, reason, details, status, createdAt) VALUES (?,?,?,?,?,?,'pending',?)", id, user.id, targetType, targetId, reason, String(body.details ?? "").slice(0, 500), now);
  return NextResponse.json({ report: { id, status: "pending" } }, { status: 201 });
}
