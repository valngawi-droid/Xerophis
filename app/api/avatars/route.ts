import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Bundled premium 3D avatar gallery (WhatsApp-style custom avatars).
const GALLERY = [
  { id: "avatar-a", src: "/avatars/avatar-a.png", label: "Budi" },
  { id: "avatar-b", src: "/avatars/avatar-b.png", label: "Salsa" },
  { id: "avatar-c", src: "/avatars/avatar-c.png", label: "Rizky" },
  { id: "avatar-d", src: "/avatars/avatar-d.png", label: "Nadia" },
  { id: "avatar-e", src: "/avatars/avatar-e.png", label: "Fajar" },
  { id: "avatar-f", src: "/avatars/avatar-f.png", label: "Putri" },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  return NextResponse.json({ avatars: GALLERY, current: user.avatarUrl });
}
