# Xerophis

> **Xerophis** — berjalan keras ke arah cita-cita. 🐍

A **premium dark messaging platform** (black + red) built as a real full-stack application — not a static mockup. It ships with a persistent database, REST API, realtime layer, authentication, media uploads, communities, channels, status/updates, calls, profile & privacy settings, a full admin dashboard, and Docker + Nginx + PostgreSQL deployment structure.

**Developer:** Pall — **Footer:** *Developed with ♥ by Pall · All rights reserved.*

---

## ✨ Features

- **Authentication** — register, login, logout, forgot/reset password, session management (list & revoke devices), secure cookie sessions, rate limiting, scrypt password hashing.
- **Linked Devices (WhatsApp-style pairing)** — link a new device/web session with an **8-digit pairing code**: the new device shows a code, the phone/main account confirms it, and the device is linked & appears in "Perangkat Tertaut" (`#/link` on web, and the native Android app).
- **Native Android app (Kotlin)** — a complete Android Studio project in [`android/`](android/) that logs in against the same API, shows chats/messages, and supports device linking.
- **Chats** — real conversation list from the DB, search, filters (Semua / Belum dibaca / Grup / Favorit), unread badges, pinned/muted.
- **Percakapan (realtime)** — send messages with **optimistic UI**, realtime delivery via **SSE** (with a **WebSocket** server for production), reactions, reply, copy, delete, typing indicator, read receipts.
- **Groups** — create/edit/delete, members with roles (owner/admin), group info page.
- **Communities** — create, join/leave, list with member counts.
- **Channels** — create, subscribe/unsubscribe, subscriber counts.
- **Updates / Status** — publish status (24h expiry), viewer counts, channels.
- **Calls** — history (incoming/outgoing/missed) + call-history UI, with an isolated future WebRTC layer.
- **Profile & Settings** — edit profile, Account, Privacy, Avatar, Chat, Notifications, Storage, Help, Sessions, Security; **settings persist** to the database.
- **Notifications** — persistent, unread count, mark read/all read.
- **Admin dashboard** — stats, user CRUD (create/suspend/ban/delete), moderation (reports), audit logs, messages/groups/communities/channels/media/security/notifications. Admin routes are **enforced server-side**.
- **Search** — users, conversations, messages, groups, communities, channels.
- **Media uploads** — validated (MIME allowlist, size limit), served from disk.
- **UX states** — skeleton loading, empty states, error states, toasts, confirmation dialogs, optimistic updates + rollback.

---

## 🧰 Tech stack

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript (strict)
- **Tailwind CSS v4** (custom dark/red design system)
- **SQLite** (`node:sqlite`, built into Node) as the default persistent DB — real relational storage on disk, survives restarts
- **REST API** via Next.js Route Handlers
- **Realtime:** Server-Sent Events (`/api/realtime`) primary + WebSocket (`ws`, `server/realtime-ws.mjs`) for production
- **Auth:** secure httpOnly session cookies, `scrypt` password hashing, rate limiting
- **Docker, Nginx, PostgreSQL** for VPS deployment

---

## 🚀 Quick start (local)

```bash
npm install
npm run dev
```

Open the dev-server URL. The database file (`data/xerophis.db`) is created and **auto-seeded** on first use.

**Demo account** (pre-filled on the login screen):

```
Username:  xerophis
Password:  Xerophis#2025
```

Other seeded users: `gariskeras`, `rehanq`, `husnij`, `novalr`, `mochrifki`, `ngabers`, `xerophisteam` (same password).

---

## 📁 Project structure

```
app/
  api/        # REST + realtime endpoints (auth, conversations, messages, link, ...)
  health/     # /health endpoint
  layout.tsx  # metadata, manifest, favicon/OG icons
  page.tsx    # client root
components/
  shell.tsx   # responsive shell (mobile bottom-nav + desktop sidebar), hash router
  auth.tsx    # splash / onboarding / login / register / forgot
  link.tsx    # device-linking screen (new device shows pairing code)
  devices.tsx # "Perangkat Tertaut" (main account enters pairing code)
  chats, conversation, groupInfo, updates, communities, calls, settings, profile, admin
  AppState.tsx, api/lib.ts, hooks, realtime, eventbus, ui.tsx, icons.tsx
lib/
  db.ts       # SQLite schema, migrations, seed, password hashing
  seed.ts     # realistic demo data
  auth.ts     # sessions, cookies, rate limit
  link.ts     # device-linking (pairing codes)
  repo.ts     # data-access
  validate.ts # server-side input validation
  realtime.ts # pub/sub hub
  brand.ts    # brand constants
server/
  realtime-ws.mjs  # production WebSocket realtime server
android/     # native Android app (Kotlin) — see android/README.md
prisma/
  schema.prisma    # PostgreSQL schema (VPS production path)
public/      # favicon + generated brand logo / icons / avatars (branding assets)
scripts/
  deploy-vps.sh    # VPS deploy helper targeting 69.33.213.153
data/        # persistent SQLite DB + uploads (gitignored)
```

---

## 🔌 API overview

Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET/DELETE /api/auth/sessions`

Account/data: `GET/PATCH /api/me`, `GET /api/conversations`, `POST /api/conversations`, `GET/PATCH /api/conversations/:id`, `GET/POST /api/conversations/:id/messages`, `POST /api/conversations/:id/typing`, `PATCH/DELETE /api/messages/:id`, `POST /api/messages/:id/reactions`

Resources: `GET/POST /api/groups` · `/api/communities` · `/api/channels` · `/api/status` · `/api/calls` · `/api/contacts` · `/api/notifications` · `/api/settings` · `/api/search` · `/api/reports`

Media: `POST /api/upload`, `GET /api/upload/:file`

Realtime: `GET /api/realtime` (SSE), `POST /api/realtime` (client→server events)

Health: `GET /api/health`, `GET /health`

Admin: `/api/admin/stats`, `/api/admin/users`, `/api/admin/users/:id`, `/api/admin/reports`, `/api/admin/audit`, `/api/admin/resources?type=…`, `/api/admin/messages`

All protected routes require the `xerophis_session` cookie; admin routes additionally enforce the admin user server-side.

---

## 🐳 Docker / VPS deployment

Target VPS: **`69.33.213.153`** — config is pre-wired to this IP (`.env.example`, `docker-compose.yml`, `nginx.conf`, Android `API_BASE_URL`).

```bash
cp .env.example .env       # fill in secrets (AUTH_SECRET, POSTGRES_PASSWORD)
./scripts/deploy-vps.sh    # or: docker compose up -d --build
```

Services: `web` (Next.js), `db` (PostgreSQL), `realtime` (WebSocket), `nginx` (reverse proxy + HTTPS-ready).

Deployment flow: install Docker → configure env → start db → run migrations (Prisma) → seed → start backend/frontend → configure Nginx → obtain HTTPS via certbot → verify `GET /api/health`.

> **Database note:** the default runtime uses **SQLite** for zero-setup local dev (persistent file, survives restarts). Production PostgreSQL support is fully scaffolded (`prisma/schema.prisma`, `DATABASE_URL`, postgres service) — swap `lib/db.ts` to the Prisma client to go live on Postgres. See the schema comments.

---

## 🔐 Security

- Passwords hashed with scrypt + salt; never stored in plaintext.
- Secure httpOnly, SameSite session cookies.
- Server-side validation on every mutation; MIME/size validation on uploads.
- Rate limiting on login/register/forgot/upload.
- Middleware enforces authentication, ownership, membership, role & admin permissions.
- `.env.example` only — real secrets are gitignored and never exposed to the client.
- Never logs passwords/tokens/secrets.

---

## 📱 Responsive

Mobile-first (bottom navigation, safe-area aware, keyboard-aware composer). On desktop it becomes a **sidebar + content panel** layout; the admin uses its own sidebar layout.

---

## 🧪 Verify

```bash
npm run typecheck
npm run build
GET /api/health      # -> {"status":"ok","db":"ok"}
```

Demo credentials unlock a populated, "alive" workspace on first login.

---

**Xerophis** · **Xerophis Team Dev** · **Developed with ♥ by Pall** · **All rights reserved.**
