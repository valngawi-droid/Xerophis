import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  try {
    sqlite.row("SELECT 1 AS ok");
    dbOk = true;
  } catch {
    /* ignore */
  }
  return NextResponse.json({ status: dbOk ? "ok" : "degraded", app: "Xerophis" });
}
