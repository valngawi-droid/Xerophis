#!/usr/bin/env bash
# Xerophis — instalasi PRODUKSI di VPS (69.33.213.153)
set -e
cd "$(dirname "$0")/.."

echo "==> Xerophis production installer"
command -v docker >/dev/null || { echo "Install docker + docker compose dulu"; exit 1; }

# .env produksi (jangan commit kredensial asli)
if [ ! -f app/.env ]; then
  cp deploy/.env.production app/.env
  echo "!! Edit app/.env: isi SMTP_URL (Gmail app password) lalu jalankan ulang skrip ini."
  read -r -p "Lanjut dengan placeholder? [y/N] " ans
  [ "$ans" = "y" ] || exit 1
fi

docker compose up -d --build
echo
echo "==> SELESAI. Aplikasi: http://69.33.213.153 (port 80)"
echo "    Login owner: pall / pall  ·  panel admin: ketik 'kingpall' di pencarian"
echo "    OTP email terkirim via Gmail SMTP (NODE_ENV=production)."
