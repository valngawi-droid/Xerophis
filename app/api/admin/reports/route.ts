import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "../core";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const reports = sqlite.rows<any>(
    `SELECT r.*, u.username AS reporterName FROM reports r JOIN users u ON u.id = r.reporterId ORDER BY r.createdAt DESC LIMIT 200`
  ).map((r) => ({
    id: r.id, reporter: r.reporterName, targetType: r.targetType, targetId: r.targetId, reason: r.reason, details: r.details, status: r.status, createdAt: r.createdAt,
  }));
  return NextResponse.json({ reports });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => ({}));
  const { id, status } = body;
  if (!["pending", "reviewing", "resolved", "dismissed"].includes(status)) return NextResponse.json({ error: { code: "VALIDATION", message: "status tidak valid." } }, { status: 422 });
  const report = sqlite.row<any>("SELECT id FROM reports WHERE id = ?", id);
  if (!report) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Laporan tidak ditemukan." } }, { status: 404 });
  sqlite.run("UPDATE reports SET status = ? WHERE id = ?", status, id);
  logAudit(auth.user.id, "REPORT_RESOLVED", id, { status });
  return NextResponse.json({ ok: true });
}
