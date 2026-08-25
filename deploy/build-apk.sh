#!/usr/bin/env bash
# Xerophis — build & sign APK (jalankan di mesin/VPS dengan Java + apktool).
# Mengikuti alur: apktool b -> zipalign -> keytool -> apksigner sign -> verify.
set -e
cd "$(dirname "$0")/.."
mkdir -p build

APKTOOL_BIN=${APKTOOL_BIN:-apktool}
if ! command -v "$APKTOOL_BIN" >/dev/null; then
  echo "apktool tidak ada — coba unduh apktool.jar (butuh Java)"
  if ! command -v java >/dev/null; then
    echo "Java tidak ada — coba: apt-get install -y openjdk-17-jre-headless"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq openjdk-17-jre-headless || { echo "pasang Java manual dulu"; exit 1; }
  fi
  mkdir -p tools
  [ -f tools/apktool.jar ] || curl -fsSL -o tools/apktool.jar https://github.com/iBotPeaches/Apktool/releases/download/v2.10.0/apktool_2.10.0.jar
  [ -f tools/uber-apk-signer.jar ] || curl -fsSL -o tools/uber-apk-signer.jar https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
  APKTOOL_BIN="java -jar tools/apktool.jar"
fi

echo "==> [1/4] apktool b (compile mentah)"
$APKTOOL_BIN b android -o build/xerophis-mentah.apk

echo "==> [2/4] zipalign"
if command -v zipalign >/dev/null; then
  zipalign -f 4 build/xerophis-mentah.apk build/xerophis-aligned.apk
else
  echo "zipalign tidak ada — lewati (apksigner tetap bekerja)"
  cp build/xerophis-mentah.apk build/xerophis-aligned.apk
fi

echo "==> [3/4] keystore + sign"
if [ ! -f my-release-key.jks ]; then
  keytool -genkeypair -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 \
    -validity 10000 -alias my-key-alias -storepass xerophis123 -keypass xerophis123 \
    -dname "CN=Pall, O=Xerophis Team Dev, C=ID"
fi
if command -v apksigner >/dev/null; then
  apksigner sign --ks my-release-key.jks --ks-key-alias my-key-alias \
    --ks-pass pass:xerophis123 --key-pass pass:xerophis123 \
    --out build/xerophis-signed.apk build/xerophis-aligned.apk
  echo "==> [4/4] verify"
  apksigner verify --verbose build/xerophis-signed.apk
else
  echo "apksigner tidak ada — pakai uber-apk-signer (java -jar uas.jar)"
  java -jar tools/uber-apk-signer.jar -a build/xerophis-aligned.apk \
    --ks my-release-key.jks --ksAlias my-key-alias --ksPass pass:xerophis123 \
    --ksKeyPass pass:xerophis123 --out build/
  mv build/xerophis-aligned-aligned-signed.apk build/xerophis-signed.apk 2>/dev/null || true
fi

echo
echo "SELESAI: build/xerophis-signed.apk  (install ke Android, buka = langsung http://69.33.213.153)"
