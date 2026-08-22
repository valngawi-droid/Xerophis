#!/usr/bin/env bash
#
# Xerophis — VPS deployment helper.
# Target server: 69.33.213.153
#
# This script is meant to run ON the VPS (after cloning this repo there).
# It builds the Docker images, starts the stack, and reports the health status.
#
set -euo pipefail

VPS_IP="${VPS_IP:-69.33.213.153}"
ENV_FILE="${ENV_FILE:-.env}"

echo "==> Xerophis deploy to ${VPS_IP}"

if [ ! -f "$ENV_FILE" ]; then
  echo "!! Missing $ENV_FILE — copying from .env.example. Edit it first."
  cp .env.example "$ENV_FILE"
  echo "   You MUST edit $ENV_FILE (AUTH_SECRET, POSTGRES_PASSWORD, etc.) before continuing."
  exit 1
fi

echo "==> Building & pulling images..."
docker compose build web realtime

echo "==> Starting database first..."
docker compose up -d db

echo "==> Starting web + realtime + nginx..."
docker compose up -d

echo "==> Waiting for health endpoint..."
for i in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000/api/health" || echo 000)"
  if [ "$CODE" = "200" ]; then
    echo "==> Healthy. App is live at http://${VPS_IP}"
    curl -s "http://127.0.0.1:3000/api/health" && echo
    exit 0
  fi
  sleep 2
done

echo "!! Health check did not pass within timeout. Inspect logs:"
docker compose logs --tail=50 web
exit 1
