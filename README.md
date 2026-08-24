# Xerophis

Full-stack messaging platform — **black + red premium UI**, mobile-first, realtime.

**Developed with ♥ by Pall · Xerophis Team Dev · All rights reserved.**

## Status (milestone 1 — core vertical slice)

Working end-to-end:

- **Auth** — register / login / logout, bcrypt-hashed passwords, bearer sessions, rate limiting
- **Chats list** — search, filter chips (Semua / Belum dibaca / Grup / Favorit), unread badges, favorites, presence dots
- **Realtime chat** — WebSocket messaging, optimistic send, delivery/read ticks, typing indicators, long-press message menu (copy / delete), day dividers, encryption notice
- **Groups** — seeded groups + group creation with system messages, sender names in bubbles
- **Demo bots** — official *Xerophis Team Dev* bot and `+000999` bot: read receipts → typing → replies; new accounts get a welcome chat
- **King Panel (admin tersembunyi)** — ketik `kingpall` di kolom pencarian chat untuk membukanya (`#/admin`). Gate role & 2FA PIN di server. Akun demo `xerophisuser` = super admin; `pall` / `noval` = **owner** dengan title otomatis *Developer Xerophis* + centang verifikasi (bypass total).

### Matriks 35 fitur admin (status milestone ini)

| # | Fitur | Status |
|---|-------|--------|
| 1 | Multi-admin role hierarchy (owner/super/moderator/agent/keuangan) | ✅ |
| 2 | Permission management per fitur (dipaksa di server) | ✅ |
| 3 | Admin activity logs | ✅ |
| 4 | Agent shift & status management (status + jadwal shift) | ✅ |
| 5 | Session handover / transfer chat | ✅ |
| 6 | Unified inbox (balas sebagai admin) | ✅ |
| 7 | Broadcast campaign scheduler | ✅ |
| 8 | Auto-reply & chatbot (keyword + luar jam kerja) | ✅ |
| 9 | Quick replies (tombol ⚡ di composer admin) | ✅ |
| 10 | Interactive message builder (tombol CTA di pesan) | ✅ |
| 11 | Chat tagging & categorization | ✅ |
| 12 | Internal notes (hanya admin) | ✅ |
| 13 | Message pinning / starred messages | ✅ |
| 14 | Anti-ban rotation (rotasi pengirim siaran via pool akun + rate-limit/spam-flag) | ✅ |
| 15 | Spam & fraud detection (auto-flag rate) | ✅ |
| 16 | Blacklist / block management | ✅ |
| 17 | Content moderation filter (kata terlarang + tautan phising) | ✅ |
| 18 | 2FA for admin (PIN) | ✅ |
| 19 | CRM contact directory (catatan CRM) | ✅ |
| 20 | Contact import & export CSV | ✅ |
| 21 | Custom contact fields (label=nilai per kontak) | ✅ |
| 22 | Audience segmentation (role + tag percakapan) | ✅ |
| 23 | Agent performance analytics | ✅ |
| 24 | Message delivery reports (terkirim/dibaca) | ✅ |
| 25 | Traffic & peak hours chart | ✅ |
| 26 | Revenue & transaction tracking | ✅ |
| 27 | CSAT survey (rating ⭐1-5 dari klien + analitik) | ✅ |
| 28 | Webhook & API integration (event message.new) | ✅ |
| 29 | Multi-device / multi-session control | ✅ |
| 30 | Backup & data export (JSON, berkala 6 jam + manual) | ✅ |
| 31 | Custom verified badge | ✅ |
| 32 | Developer & owner privilege panel (bypass) | ✅ |
| 33 | Global announcement broadcast (banner semua layar) | ✅ |
| 34 | Custom role & title manager | ✅ |
| 35 | Database & source inspector (memori/uptime/error log) | ✅ |
- **Settings** — profile card, menu system, brand footer, logout
- **Persistence** — SQLite (`node:sqlite`), seeded Indonesian demo data matching the reference screens
- **Deployment configs** — Dockerfile, docker-compose (app + Postgres + nginx with WebSocket proxy)

### Milestone 2 — Updates, Channels, Communities, Calls (v0.2)

- **Updates/Status**: bagikan status teks, feed "Pembaruan terbaru" dengan ring unseen,
  viewer fullscreen + progress, ditandai dilihat, hapus status sendiri
- **Saluran (channels)**: buat saluran, ikuti/berhenti, postingan owner-only, badge pengikut
- **Communities**: wadah beberapa grup, buat/gabung/keluar, detail grup & anggota
- **Calls**: panggilan suara/video realtime via WebSocket — offer/accept/reject/end,
  overlay incoming, timer durasi, riwayat (completed/missed/rejected), pending offer saat login

### Milestone 3 — Media, PWA, Fraud, Owner penuh (v0.3)

- **Media**: kirim gambar di chat (jpg/png/webp/gif ≤1.5MB), bubble gambar,
  berkas tersimpan di `data/media`, akses dilindungi sesi (`?token=`)
- **PWA**: manifest + service worker (cache shell, offline shell) + ikon
- **Fraud detection (#15)**: pesan identik menyebar ke 3+ percakapan dalam
  5 menit → auto-flag 429 + log audit (melengkapi rate-limit spam)
- **Owner penuh**: `pall`, `noval`, **`vall`** diprovisi otomatis saat boot
  (password default = username) + role owner + title *Developer Xerophis*

### Milestone 4 — Reaksi, Balas, Teruskan, Semat pengguna (v0.4)

- **Reaksi pesan**: bar emoji 👍❤️😂😮😢🙏🔥 dari menu tahan-pesan, satu reaksi
  per pengguna (swap), chip reaksi di bubble, realtime via WS
- **Balas**: quote pesan asli di bubble + chip "Membalas" di composer
- **Teruskan**: salin pesan (teks/media) ke chat lain dengan flag "↪ Diteruskan"
- **Sematkan oleh anggota**: pin/unpin pesan langsung dari menu chat (banner 📌)

### Milestone 5 — Adapter PostgreSQL (v1.0)

- Lapisan data di-refactor async & engine-agnostic: `DB_DRIVER=sqlite|postgres`
- Wrapper PG: konversi placeholder, `INSERT OR IGNORE`→`ON CONFLICT`,
  `RETURNING id`, fungsi kompatibilitas `strftime()` di PG, parser int8/numeric
- **117 checks e2e hijau di KEDUA engine** (`npm test` & `npm run test:pg`,
  yang kedua memakai embedded PostgreSQL binary dari npm)
- docker-compose kini menjalankan app dengan Postgres di production

Cara coba mode PG: `npm run test:pg` (boot PG embedded otomatis).

## Run locally

```bash
cd app
npm install
npm start          # http://localhost:8080
```

Demo login: **xerophisuser / xerophis** (super admin) · **pall / pall** · **vall / vall** · **noval / xerophis** (owner, title *Developer Xerophis*).
Panel admin: ketik **kingpall** di kolom "Cari atau mulai chat".

## Test

```bash
cd app && npm test   # boots a real server on a temp DB: 22 e2e checks (REST + WS + bots)
```

## Deploy (VPS)

```bash
docker compose up -d --build   # nginx :80 -> app :8080, Postgres provisioned
```

See `.env.example` for configuration. The storage layer is adapter-shaped (async
accessors) so the Postgres adapter can drop in without touching the API layer.

## Repo map

```
app/server/   Express + WebSocket + SQLite storage/seed/bots
app/public/   no-build SPA (design system in styles.css)
app/test/     e2e suite
deploy/       nginx edge config
*.md          product master build prompt (spec)
```
