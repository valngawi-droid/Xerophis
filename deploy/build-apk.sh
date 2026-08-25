#!/usr/bin/env bash
# Xerophis — build & sign APK (mesin/VPS dengan atau tanpa Java terpasang).
# Alur: apktool b -> zipalign (opsional) -> keytool -> sign (apksigner/uber-apk-signer) -> verify.
cd "$(dirname "$0")/.." || exit 1
mkdir -p build tools

log() { echo "[apk] $*"; }
fail() { echo "[apk] GAGAL: $*"; exit 1; }

# 1) Java
if ! command -v java >/dev/null; then
  log "Java tidak ada — install openjdk (fallback default-jre)…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq || true
  apt-get install -y -qq openjdk-17-jre-headless || apt-get install -y -qq default-jre-headless || fail "Java gagal dipasang (coba manual: apt install openjdk-17-jre-headless)"
fi
java -version 2>&1 | head -1 || fail "java tidak jalan"

# 2) apktool + uber-apk-signer (unduh bila belum ada)
if ! command -v apktool >/dev/null; then
  [ -s tools/apktool.jar ] || { log "unduh apktool.jar…"; curl -fsSL -o tools/apktool.jar https://github.com/iBotPeaches/Apktool/releases/download/v2.10.0/apktool_2.10.0.jar || fail "unduh apktool gagal"; }
  APKTOOL="java -jar tools/apktool.jar"
else
  APKTOOL="apktool"
fi
[ -s tools/uber-apk-signer.jar ] || { log "unduh uber-apk-signer.jar…"; curl -fsSL -o tools/uber-apk-signer.jar https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar || fail "unduh uber-apk-signer gagal"; }

# 3) compile mentah
log "apktool b android …"
$APKTOOL b android -o build/xerophis-mentah.apk || fail "apktool build gagal"
[ -s build/xerophis-mentah.apk ] || fail "apk mentah tidak ada"

# 4) zipalign (opsional)
if command -v zipalign >/dev/null; then
  zipalign -f 4 build/xerophis-mentah.apk build/xerophis-aligned.apk || cp build/xerophis-mentah.apk build/xerophis-aligned.apk
else
  log "zipalign tidak ada — lewati"
  cp build/xerophis-mentah.apk build/xerophis-aligned.apk
fi

# 5) keystore
if [ ! -f my-release-key.jks ]; then
  log "buat keystore…"
  keytool -genkeypair -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 \
    -alias my-key-alias -storepass xerophis123 -keypass xerophis123 \
    -dname "CN=Pall, O=Xerophis Team Dev, C=ID" || fail "keytool gagal"
fi

# 6) sign
if command -v apksigner >/dev/null; then
  log "apksigner sign…"
  apksigner sign --ks my-release-key.jks --ks-key-alias my-key-alias \
    --ks-pass pass:xerophis123 --key-pass pass:xerophis123 \
    --out build/xerophis-signed.apk build/xerophis-aligned.apk || fail "apksigner sign gagal"
  apksigner verify build/xerophis-signed.apk || log "verify warning"
else
  log "sign pakai uber-apk-signer…"
  java -jar tools/uber-apk-signer.jar --allowResign -a build/xerophis-aligned.apk \
    --ks my-release-key.jks --ksAlias my-key-alias --ksPass pass:xerophis123 --ksKeyPass pass:xerophis123 \
    --out build/ || fail "uber-apk-signer gagal"
  # uber-apk-signer menghasilkan beberapa varian; ambil yang signed
  SIGNED=$(ls build/*-signed.apk 2>/dev/null | head -1)
  [ -n "$SIGNED" ] && cp "$SIGNED" build/xerophis-signed.apk
fi

[ -s build/xerophis-signed.apk ] || fail "xerophis-signed.apk tidak terbentuk"
log "OK: build/xerophis-signed.apk ($(du -h build/xerophis-signed.apk | cut -f1))"
