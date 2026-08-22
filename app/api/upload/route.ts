import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getCurrentUser, rateLimit } from "@/lib/auth";
import { sqlite, nowMs } from "@/lib/db";

export const dynamic = "force-dynamic";

// MIME allowlist -> extension
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/zip": "zip",
};

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Belum login." } }, { status: 401 });
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`upload:${ip}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Terlalu banyak upload." } }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Tidak ada file." } }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: { code: "VALIDATION", message: "Tipe file tidak didukung." } }, { status: 422 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: { code: "VALIDATION", message: "File melebihi 25MB." } }, { status: 413 });

  const dir = process.env.UPLOAD_DIR ?? join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);
  const url = `/api/upload/${filename}`;
  const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document";
  sqlite.run("INSERT INTO media (id, uploaderId, type, url, name, size, mime, createdAt) VALUES (?,?,?,?,?,?,?,?)", `md${randomUUID().replace(/-/g, "").slice(0, 16)}`, user.id, kind, url, file.name, file.size, file.type, nowMs());
  return NextResponse.json({ url, type: kind, name: file.name, size: file.size, mime: file.type }, { status: 201 });
}
