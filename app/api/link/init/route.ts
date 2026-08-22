import { NextRequest, NextResponse } from "next/server";
import { initLink, expireStaleLinks } from "@/lib/link";
import { rateLimit } from "@/lib/auth";
import { qrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

/** A brand-new device requests a pairing code (does NOT require login). */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "local";
  const rl = rateLimit(`link:init:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan. Coba lagi sebentar." } }, { status: 429 });
  }
  expireStaleLinks();
  const body = await req.json().catch(() => ({}));
  const ua = req.headers.get("user-agent") ?? "";
  const label = body.label ? String(body.label).slice(0, 60) : deviceFromUA(ua);
  const { token, code, expiry } = initLink({ label, ip });
  const qr = await qrDataUrl(token);
  return NextResponse.json({ token, code, expiry, label, qr });
}

function deviceFromUA(ua: string): string {
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Perangkat";
  const browser = /edg/i.test(ua) ? "Edge" : /chrome/i.test(ua) ? "Chrome" : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
  return `${browser} di ${os}`;
}
