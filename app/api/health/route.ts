import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  try {
    sqlite.row("SELECT 1 AS ok");
    dbOk = true;
  } catch {
    /* db unreachable */
  }
  return NextResponse.json({
    status: "ok",
    app: "Xerophis",
    version: process.env.APP_VERSION ?? "1.0.0",
    db: dbOk ? "ok" : "error",
    uptime: Math.round(process.uptime()),
    timestamp: Date.now(),
  });
}
