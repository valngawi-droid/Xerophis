#!/usr/bin/env bash
# Xerophis — HTTPS otomatis tanpa domain sendiri (nip.io + Let's Encrypt).
# Push notification, PWA install, dan SW butuh secure context; skrip ini mengaktifkannya.
set -e
cd "$(dirname "$0")/.."
IP=${1:-$(hostname -I | awk '{print $1}')}
DOMAIN=$(echo "$IP" | tr . -).nip.io
echo "==> minta sertifikat utk $DOMAIN (menunjuk $IP via nip.io)"
export DEBIAN_FRONTEND=noninteractive
command -v certbot >/dev/null || { apt-get update -qq; apt-get install -y -qq certbot; }
mkdir -p deploy/tls

docker compose stop nginx || true
certbot certonly --standalone --agree-tos --register-unsafely-without-email -d "$DOMAIN" --non-interactive \
  || { docker compose start nginx; echo "GAGAL: certbot (port 80 harus bebas)"; exit 1; }
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" deploy/tls/
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" deploy/tls/

cat > deploy/nginx-ssl.conf <<EOF
server {
    listen 443 ssl;
    server_name $DOMAIN;
    ssl_certificate /etc/nginx/tls/fullchain.pem;
    ssl_certificate_key /etc/nginx/tls/privkey.pem;
    client_max_body_size 20m;
    location / {
        proxy_pass http://app:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
EOF

docker compose up -d nginx
echo
echo "==> SELESAI. HTTPS aktif: https://$DOMAIN"
echo "    Buka URL itu di HP: notifikasi push + install-PWA kini jalan (secure context)."
echo "    (URL http://$IP tetap berfungsi sebagai perangkat tertaut.)"
