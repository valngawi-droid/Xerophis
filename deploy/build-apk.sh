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

# 2b) bundle engine native per-ABI (WebRTC + libVLC) + font emoji — isi asli, 4 ABI (32/64-bit)
mkdir -p tools/cache android/assets/fonts
[ -s tools/cache/webrtc.aar ]  || { log "unduh engine WebRTC…";  curl -fsSL -o tools/cache/webrtc.aar  https://repo1.maven.org/maven2/org/webrtc/google-webrtc/1.0.32006/google-webrtc-1.0.32006.aar || fail "unduh webrtc gagal"; }
[ -s tools/cache/libvlc.aar ]  || { log "unduh engine libVLC…";  curl -fsSL -o tools/cache/libvlc.aar  https://repo1.maven.org/maven2/org/videolan/android/libvlc-all/3.6.0/libvlc-all-3.6.0.aar || fail "unduh libvlc gagal"; }
[ -s tools/cache/NotoColorEmoji.ttf ] || { log "unduh font emoji Noto…"; curl -fsSL -o tools/cache/NotoColorEmoji.ttf https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf || fail "unduh emoji font gagal"; }
log "ekstrak native libs ke android/lib (4 ABI)…"
python3 - <<'PY' || fail "ekstrak bundle gagal"
import zipfile, os, shutil
def ext(aar):
    z = zipfile.ZipFile(aar)
    for n in z.namelist():
        if n.startswith('jni/') and n.endswith('.so'):
            abi = n.split('/')[1]
            out = os.path.join('android', 'lib', abi, os.path.basename(n))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, 'wb') as f: f.write(z.read(n))
ext('tools/cache/webrtc.aar')
ext('tools/cache/libvlc.aar')
os.makedirs('android/assets/fonts', exist_ok=True)
shutil.copy('tools/cache/NotoColorEmoji.ttf', 'android/assets/fonts/NotoColorEmoji.ttf')
tot = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk('android/lib') for f in fs)
print(f'[apk] native libs: {tot/1048576:.1f} MB across', sorted(os.listdir('android/lib')))
PY

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

# 5) keystore (deteksi password lama salah -> regenerasi otomatis)
if [ -f my-release-key.jks ]; then
  if ! keytool -list -keystore my-release-key.jks -storepass xerophis123 >/dev/null 2>&1; then
    log "keystore existing password-nya beda — backup & buat baru…"
    mv -f my-release-key.jks "my-release-key.jks.old.$(date +%s)"
  fi
fi
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
  # uber-apk-signer TIDAK mendukung prefix "pass:" (itu milik apksigner) — berikan polos
  java -jar tools/uber-apk-signer.jar --allowResign -a build/xerophis-aligned.apk \
    --ks my-release-key.jks --ksAlias my-key-alias --ksPass xerophis123 --ksKeyPass xerophis123 \
    --out build/ || fail "uber-apk-signer gagal"
  # uber-apk-signer menghasilkan beberapa varian; ambil yang signed
  SIGNED=$(ls build/*-signed.apk 2>/dev/null | head -1)
  [ -n "$SIGNED" ] && cp "$SIGNED" build/xerophis-signed.apk
fi

[ -s build/xerophis-signed.apk ] || fail "xerophis-signed.apk tidak terbentuk"

# 7) sanity struktur APK (classes.dex + manifest biner + resources)
if command -v python3 >/dev/null; then
python3 - "$PWD/build/xerophis-signed.apk" <<'PY' || fail "struktur APK aneh (lihat output python)"
import sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
names = z.namelist()
need = ['classes.dex', 'AndroidManifest.xml', 'resources.arsc']
for n in need:
    assert n in names, f'{n} hilang!'
m = z.read('AndroidManifest.xml')
assert m[:4] in (b'\x03\x00\x08\x00',), f'manifest magic salah: {m[:4].hex()}'
sig = [n for n in names if n.startswith('META-INF/') and (n.endswith('.RSA') or n.endswith('.DSA') or n.endswith('.SF'))]
print('[apk] struktur OK:', ', '.join(need), '| tanda tangan:', len(sig), 'entri META-INF')
PY
fi

# 8) verify signature
java -jar tools/uber-apk-signer.jar --verify -a build/xerophis-signed.apk 2>&1 | tail -5 || log "verify warning"

cp -f build/xerophis-signed.apk app/public/xerophis.apk
log "OK: build/xerophis-signed.apk ($(du -h build/xerophis-signed.apk | cut -f1)) — bisa diunduh di http://69.33.213.153/xerophis.apk"
