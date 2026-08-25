#!/usr/bin/env bash
# Xerophis — build & sign APK (jalankan di mesin/VPS dengan Java + apktool).
# Mengikuti alur: apktool b -> zipalign -> keytool -> apksigner sign -> verify.
set -e
cd "$(dirname "$0")/.."
mkdir -p build

APKTOOL_BIN=${APKTOOL_BIN:-apktool}
if ! command -v "$APKTOOL_BIN" >/dev/null; then
  echo "apktool tidak ditemukan. Pasang: https://apktool.org (atau: java -jar apktool.jar)"
  echo "Jika hanya ada apktool.jar:  export APKTOOL_BIN='java -jar /path/apktool.jar'"
  exit 1
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
