#!/usr/bin/env bash
# Xerophis — build APK di dalam container Android SDK (Docker Hub terjangkau di VPS).
set -e
cd "$(dirname "$0")/.."
log() { echo "[apk-docker] $*"; }
IMG=${ANDROID_DOCKER_IMAGE:-mingc/android-build-box}
if ! docker image inspect "$IMG" >/dev/null 2>&1; then
  log "pull image $IMG …"
  docker pull "$IMG" || { IMG=thyrlian/android-sdk; docker pull "$IMG"; }
fi
log "build di dalam container…"
docker run --rm -v "$PWD:/work" -w /work "$IMG" bash deploy/build-apk-inner.sh
log "SELESAI: $(du -h build/xerophis-signed.apk | cut -f1) — http://69.33.213.153/xerophis.apk"
