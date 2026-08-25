# Panduan Deploy Xerophis ke VPS lewat Termius (step-by-step)

VPS target: **69.33.213.153** · hasil akhir: aplikasi PRODUKSI di `http://69.33.213.153` + APK signed.

> ⚠️ Sebelum mulai: buat **App Password Gmail BARU** di https://myaccount.google.com/apppasswords
> (jangan pakai yang pernah dibagikan di chat — anggap sudah bocor).

---

## 1) Konek SSH pakai Termius

1. Buka Termius → **New Host** (ikon +).
2. Isi:
   - Alias: `VPS Xerophis`
   - Address: `69.33.213.153`
   - Port: `22`
   - Username: `root` (atau user sudo VPS kamu)
   - Password: password VPS kamu (atau pilih SSH key)
3. **Save** → ketuk hostnya → **Connect** → terima fingerprint.

Sekarang kamu di terminal VPS. Semua perintah bawah di-tempel satu-satu.

## 2) Siapkan sistem

```bash
apt update && apt install -y git curl ca-certificates
```

## 3) Ambil kode Xerophis (branch kerja)

```bash
cd /root
git clone https://github.com/valngawi-droid/Xerophis.git
cd Xerophis
git checkout arena/01a032d1-xerophis
```

## 4) Isi kredensial produksi (SMTP Gmail)

```bash
nano app/.env
```
Isi (template sudah ada bila kamu jalankan installer; atau buat manual):

```
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
SMTP_URL=smtps://dd3604414@gmail.com:APPPASSWORD_BARU_TANPA_SPASI@smtp.gmail.com:465
MAIL_FROM="Xerophis <dd3604414@gmail.com>"
DB_DRIVER=postgres
DATABASE_URL=postgres://xerophis:xerophis@db:5432/xerophis
```
(App password format tanpa spasi, contoh `voztjclmcvwndzmo` — **ganti dengan yang baru**.)
Simpan: `Ctrl+O` → Enter → `Ctrl+X`.

## 5) Jalankan installer (docker + compose + nginx, mode PRODUKSI)

```bash
bash deploy/install-vps.sh
```
Script ini: install Docker bila belum ada, build image, jalankan app + Postgres + nginx
(server_name `69.33.213.153`), NODE_ENV=production.

## 6) Verifikasi

```bash
curl -s http://127.0.0.1/api/health          # {"ok":true,...}
curl -s -X POST http://127.0.0.1/api/auth/otp/request -H 'Content-Type: application/json' -d '{"email":"dd3604414@gmail.com"}'
```
Perintah kedua harus mengirim **email OTP sungguhan** ke Gmail kamu (mode production = tanpa devCode).
Buka di browser HP/laptop: **http://69.33.213.153** → login:
- owner: `pall / pall` (title *Developer Xerophis*), atau
- email + OTP.
Panel admin: ketik **kingpall** di kolom pencarian chat.

## 7) (Opsional tapi disarankan) HTTPS + push penuh

Push & install-PWA idealnya butuh HTTPS. Bila punya domain yang di-A-record ke IP:
```bash
apt install -y certbot
certbot certonly --standalone -d domainkamu.com   # stop nginx dulu atau pakai webroot
```
lalu arahkan nginx ke sertifikat itu. Tanpa domain, aplikasi tetap jalan penuh lewat http.

## 8) Build APK signed di VPS (Java otomatis)

```bash
bash deploy/build-apk.sh
```
Script akan: install OpenJDK bila perlu, unduh `apktool.jar` + `uber-apk-signer.jar`,
lalu menjalankan alur: `apktool b` → zipalign (bila ada) → `keytool` bikin keystore →
sign (`apksigner` bila ada, jika tidak uber-apk-signer) → verify.
Hasil: `build/xerophis-signed.apk` (WebView → http://69.33.213.153, WebRTC aktif).

Ambil APK ke HP dari Termius:
```bash
cd /root/Xerophis && python3 -m http.server 8000
```
Di browser HP: `http://69.33.213.153:8000/build/xerophis-signed.apk` → install
(izinkan "sumber tidak dikenal"). Matikan server setelah selesai: `Ctrl+C`.
(Bila port 8000 diblokir firewall provider, buka dulu di panel VPS / `ufw allow 8000`.)

## 9) Operasional harian

```bash
cd /root/Xerophis
docker compose logs -f app        # lihat log (termasuk error)
git pull && bash deploy/install-vps.sh   # update aplikasi ke versi terbaru
docker compose down && docker compose up -d   # restart
```

## Troubleshoot cepat

| Gejala | Cek |
|---|---|
| OTP tidak sampai | `docker compose logs app \| grep mail` — pastikan SMTP_URL benar & app password aktif |
| Web tidak kebuka | `docker compose ps`, `ufw status` (allow 80), security-group provider |
| APK blank | pastikan VPS reachable dari HP; WebView pakai `http://69.33.213.153` |
| Push tidak muncul | butuh HTTPS + izin notifikasi di browser |
