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
- **Settings** — profile card, menu system, brand footer, logout
- **Persistence** — SQLite (`node:sqlite`), seeded Indonesian demo data matching the reference screens
- **Deployment configs** — Dockerfile, docker-compose (app + Postgres + nginx with WebSocket proxy)

Upcoming milestones: Updates/status, communities, calls, media, admin dashboard, Postgres adapter (`DATABASE_URL`), PWA.

## Run locally

```bash
cd app
npm install
npm start          # http://localhost:8080
```

Demo login: **xerophisuser / xerophis** (or tap the demo chip on the login screen).

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
