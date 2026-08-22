import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../core";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const type = req.nextUrl.searchParams.get("type") ?? "groups";
  if (type === "groups") {
    const groups = sqlite.rows<any>("SELECT * FROM conversations WHERE type='group' ORDER BY updatedAt DESC LIMIT 100");
    return NextResponse.json({ groups });
  }
  if (type === "communities") {
    const rows = sqlite.rows<any>("SELECT * FROM communities ORDER BY createdAt DESC LIMIT 100");
    return NextResponse.json({ communities: rows });
  }
  if (type === "channels") {
    const rows = sqlite.rows<any>("SELECT * FROM channels ORDER BY subscriberCount DESC LIMIT 100");
    return NextResponse.json({ channels: rows });
  }
  if (type === "media") {
    const rows = sqlite.rows<any>("SELECT * FROM media ORDER BY createdAt DESC LIMIT 100");
    return NextResponse.json({ media: rows });
  }
  if (type === "security") {
    const rows = sqlite.rows<any>("SELECT * FROM security_events ORDER BY createdAt DESC LIMIT 100");
    return NextResponse.json({ events: rows });
  }
  if (type === "notifications") {
    const rows = sqlite.rows<any>("SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 100");
    return NextResponse.json({ notifications: rows });
  }
  return NextResponse.json({ error: { code: "VALIDATION", message: "type tidak dikenal." } }, { status: 422 });
}
