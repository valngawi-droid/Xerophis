# Xerophis — Android app (Kotlin)

Native Android client for Xerophis written in **Kotlin**. It talks to the same
backend as the web app (the Next.js API), so chats, login, and device-linking
are shared.

## What it does

- **Login / registration** against `/api/auth/login` & `/api/auth/register`.
- **Chat list** from `/api/conversations`.
- **Conversations** — load & send messages (optimistic append) against
  `/api/conversations/:id/messages`.
- **Perangkat Tertaut (Linked devices)** — list devices, and **link a new
  device by entering the 8-digit pairing code** shown on that device's web/app
  (`/api/devices`, `/api/link/confirm`). This is the WhatsApp-style pairing flow.

## Set the server URL

Open `android/app/build.gradle.kts` and edit `API_BASE_URL`:

- Emulator → `http://10.0.2.2:3000` (points to the host machine's localhost).
- Physical phone on the same Wi-Fi → `http://<your-computer-LAN-IP>:3000`.
- Production / your VPS → `http://69.33.213.153` (already set in both build types).

> Over HTTPS you can change to `https://69.33.213.153` after configuring Nginx + certbot.

> Local dev uses plain HTTP; the manifest has `usesCleartextTraffic="true"` for
> that. For production, serve over HTTPS.

## Build & run

Requires **Android Studio (or Android SDK + JDK 17)**:

```bash
cd android
./gradlew assembleDebug        # or: build APK via Android Studio → Run
# APK at: app/build/outputs/apk/debug/app-debug.apk
```

If `gradlew` is missing, open the `android/` folder in Android Studio, which
will provision the Gradle wrapper. Then add a run configuration for `app` and
press Run on an emulator/device.

## How pairing works (WhatsApp-style)

1. On the **new device** (web or another app), open the "Link device" flow. It
   shows an **8-digit code** (e.g. `TC98JCKA`).
2. On this **Android app** (already logged in), go to **Perangkat Tertaut →
   Tautkan perangkat** and enter that code.
3. The new device adopts its session and is now linked; it appears in the
   device list on both sides.

## Project layout

```
app/src/main/java/com/xerophis/app/
  XerophisApp.kt            # Application (inits ApiClient + Session)
  data/Models.kt            # DTOs matching the backend API
  data/Api.kt               # Retrofit API + OkHttp cookie interceptor
  data/Session.kt           # persisted session token / profile
  ui/LoginActivity.kt
  ui/ChatListActivity.kt
  ui/ConversationActivity.kt
  ui/LinkActivity.kt
```
