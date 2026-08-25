#!/usr/bin/env bash
# Xerophis — instalasi PRODUKSI di VPS (69.33.213.153). Bootstrap penuh: docker, env, compose.
set -e
cd "$(dirname "$0")/.."

echo "==> [1/4] cek dependensi dasar"
export DEBIAN_FRONTEND=noninteractive
command -v git  >/dev/null || { apt-get update -qq; apt-get install -y -qq git curl ca-certificates; }
command -v curl >/dev/null || apt-get install -y -qq curl

echo "==> [2/4] docker (install otomatis bila belum ada)"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
docker compose version >/dev/null 2>&1 || { echo "docker compose tidak ada — update docker"; exit 1; }

echo "==> [3/4] konfigurasi .env produksi"
if [ ! -f app/.env ]; then
  cp deploy/.env.production app/.env
  echo "!! app/.env dibuat dari template. EDIT dulu (SMTP_URL + password postgres boleh diganti):"
  echo "   nano app/.env"
  read -r -p "Lanjut tanpa edit? [y/N] " ans
  [ "$ans" = "y" ] || { echo "Setelah edit, jalankan ulang: bash deploy/install-vps.sh"; exit 1; }
fi

echo "==> [4/4] docker compose up"
# bersihkan container orphan project lama (bekas percobaan) yg bisa menahan port
docker compose down --remove-orphans >/dev/null 2>&1 || true
# bila port 80 masih dipakai webserver host (nginx/apache bawaan), matikan
if command -v ss >/dev/null && ss -tln | grep -q ':80 '; then
  echo "!! Port 80 masih dipakai — coba matikan webserver host:"
  systemctl stop nginx apache2 httpd 2>/dev/null || true
  systemctl disable nginx apache2 httpd 2>/dev/null || true
  sleep 1
  if ss -tln | grep -q ':80 '; then
    echo "!! Masih terpakai. Cek: ss -tlnp | grep ':80 ' lalu hentikan prosesnya manual."
    exit 1
  fi
fi
docker compose up -d --build

echo
echo "=============================================================="
echo " SELESAI. Aplikasi PRODUKSI:  http://69.33.213.153"
echo "   owner  : pall / pall   (title Developer Xerophis)"
 echo "   admin  : ketik 'kingpall' di kolom pencarian chat"
echo "   OTP    : terkirim via Gmail SMTP (cek app/.env)"
echo "   logs   : docker compose logs -f app"
echo "   update : git pull && docker compose up -d --build"
echo "=============================================================="
