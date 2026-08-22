import { NextResponse } from "next/server";
import { requireAdmin } from "../core";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const logs = sqlite.rows<any>(
    `SELECT a.*, u.username AS adminName FROM audit_logs a JOIN users u ON u.id = a.adminId ORDER BY a.createdAt DESC LIMIT 200`
  ).map((l) => ({
    id: l.id, admin: l.adminName, action: l.action, target: l.target, metadata: l.metadata, createdAt: l.createdAt,
  }));
  return NextResponse.json({ logs });
}
