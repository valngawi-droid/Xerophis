#!/usr/bin/env bash
# Xerophis — diagnosis VPS. Jalankan lalu TEMPSEL seluruh outputnya ke chat.
cd "$(dirname "$0")/.." || exit 1
echo "===== 1) compose ps ====="
docker compose ps
echo "===== 2) logs app (tail 40) ====="
docker compose logs --tail=40 app || true
echo "===== 3) logs nginx (tail 10) ====="
docker compose logs --tail=10 nginx || true
echo "===== 4) port 80/8080 ====="
(ss -tlnp 2>/dev/null | grep -E ':80 |:8080 ') || echo "tidak ada yang listen di 80/8080"
echo "===== 5) curl internal ====="
curl -s -m 5 http://127.0.0.1/api/health || echo "app tidak menjawab di port 80"
echo
echo "===== selesai ====="
