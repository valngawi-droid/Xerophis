import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { sqlite, newId, nowMs } from "@/lib/db";

/** Server-side admin authz. Admin = verified demo account with username 'xerophis'. */
export async function requireAdmin(): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  }
  if (!(user.username === "xerophis" && user.isVerified === 1)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Akses admin ditolak." } }, { status: 403 });
  }
  return { user };
}

export function logAudit(adminId: string, action: string, target: string, metadata: unknown = {}) {
  sqlite.run(
    "INSERT INTO audit_logs (id, adminId, action, target, metadata, createdAt) VALUES (?,?,?,?,?,?)",
    newId("al"),
    adminId,
    action,
    target,
    JSON.stringify(metadata),
    nowMs()
  );
}
