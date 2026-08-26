#!/usr/bin/env bash
# Xerophis — build APK dengan pipeline RESMI Android (javac -> d8 -> aapt2 -> zipalign -> apksigner).
# Mengganti jalur apktool+smali lama yang dex-nya ditolak ART di HP.
set -e
cd "$(dirname "$0")/.."
log() { echo "[apk-pro] $*"; }
fail() { echo "[apk-pro] GAGAL: $*"; exit 1; }

log "1) dependensi dasar (JDK, unzip)…"
export DEBIAN_FRONTEND=noninteractive
command -v java    >/dev/null || { apt-get update -qq; apt-get install -y -qq openjdk-17-jdk-headless || apt-get install -y -qq default-jdk; }
command -v unzip   >/dev/null || apt-get install -y -qq unzip
command -v keytool >/dev/null || fail "keytool tidak ada setelah install JDK"

T=tools/android
mkdir -p "$T" build
if [ ! -x "$T/cmdline-tools/latest/bin/sdkmanager" ]; then
  log "2) unduh Android cmdline-tools (resmi, dl.google.com)…"
  curl -fsSL -o "$T/cmdline-tools.zip" https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip || fail "unduh cmdline-tools"
  mkdir -p "$T/cmdline-tools"
  (cd "$T/cmdline-tools" && unzip -q ../cmdline-tools.zip && mv cmdline-tools latest)
else
  log "2) cmdline-tools sudah ada"
fi
export ANDROID_HOME="$PWD/$T"
yes | "$T/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null 2>&1 || true
log "3) install build-tools;34 + platform android-34…"
if ! yes | "$T/cmdline-tools/latest/bin/sdkmanager" "build-tools;34.0.0" "platforms;android-34" >/dev/null 2>&1; then
  log "   coba ulang via --no_https (banyak jaringan VPS kena SSL-intercept)…"
  if ! yes | "$T/cmdline-tools/latest/bin/sdkmanager" --no_https "build-tools;34.0.0" "platforms;android-34" >/dev/null 2>&1; then
    log "   dl.google tetap gagal — fallback ke build dalam Docker…"
    exec bash deploy/build-apk-docker.sh
  fi
fi
BT="$T/build-tools/34.0.0"
PJ="$T/platforms/android-34/android.jar"

log "4) (opsional) native libs WebRTC+libVLC dari Maven — biar APK >=70MB & engine media siap"
if [ ! -d android/libs-jni ]; then
  mkdir -p tools/cache
  if curl -fsSL -m 180 -o tools/cache/webrtc.aar https://repo1.maven.org/maven2/org/webrtc/google-webrtc/1.0.32006/google-webrtc-1.0.32006.aar \
   && curl -fsSL -m 600 -o tools/cache/libvlc.aar https://repo1.maven.org/maven2/org/videolan/android/libvlc-all/3.6.0/libvlc-all-3.6.0.aar; then
    python3 - <<'PY'
import zipfile, os
for aar in ['tools/cache/webrtc.aar', 'tools/cache/libvlc.aar']:
    z = zipfile.ZipFile(aar)
    for n in z.namelist():
        if n.startswith('jni/') and n.endswith('.so'):
            abi = n.split('/')[1]
            out = os.path.join('android/libs-jni', abi, os.path.basename(n))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            open(out, 'wb').write(z.read(n))
tot = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk('android/libs-jni') for f in fs)
print(f'[apk-pro] native libs: {tot/1048576:.1f} MB, ABI: {sorted(os.listdir("android/libs-jni"))}')
PY
  else
    log "   Maven tak terjangkau — lanjut TANPA native libs (APK tetap valid & installable)"
  fi
else
  log "4) native libs sudah ada"
fi

W=android/work
rm -rf "$W" && mkdir -p "$W/classes" "$W/out"
log "5) aapt2 compile + link…"
"$BT/aapt2" compile --dir android/res -o "$W/res.zip" || fail "aapt2 compile"
"$BT/aapt2" link -o "$W/base.apk" --manifest android/AndroidManifest.xml -I "$PJ" --auto-add-overlay "$W/res.zip" || fail "aapt2 link"

log "6) javac…"
javac -classpath "$PJ" -d "$W/classes" android/java/xerophis/MainActivity.java || fail "javac"

log "7) d8 -> classes.dex…"
"$BT/d8" --lib "$PJ" --output "$W/out" "$W"/classes/xerophis/*.class || fail "d8"

log "8) gabungkan dex + native libs…"
python3 - "$W/base.apk" "$W/out/classes.dex" "$W/final.apk" <<'PY'
import zipfile, sys, os
base, dex, out = sys.argv[1:4]
zin = zipfile.ZipFile(base)
zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    zout.writestr(item, zin.read(item.filename))
zout.write(dex, 'classes.dex', zipfile.ZIP_STORED)
libdir = 'android/libs-jni'
if os.path.isdir(libdir):
    for root, _, files in os.walk(libdir):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), libdir)
            zout.write(os.path.join(root, f), 'lib/' + rel.replace(os.sep, '/'), zipfile.ZIP_STORED)
zout.close()
print('[apk-pro] final.apk siap')
PY

log "9) zipalign + apksigner (resmi)…"
[ -f my-release-key.jks ] || keytool -genkeypair -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias -storepass xerophis123 -keypass xerophis123 -dname "CN=Pall, O=Xerophis Team Dev, C=ID"
# keystore lama passwordnya bisa beda -> regenerasi bila tak bisa dibuka
keytool -list -keystore my-release-key.jks -storepass xerophis123 >/dev/null 2>&1 || { mv -f my-release-key.jks "my-release-key.jks.old.$(date +%s)"; \
  keytool -genkeypair -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias -storepass xerophis123 -keypass xerophis123 -dname "CN=Pall, O=Xerophis Team Dev, C=ID"; }
"$BT/zipalign" -f 4 "$W/final.apk" "$W/aligned.apk"
"$BT/apksigner" sign --ks my-release-key.jks --ks-key-alias my-key-alias --ks-pass pass:xerophis123 --key-pass pass:xerophis123 \
  --out build/xerophis-signed.apk "$W/aligned.apk" || fail "apksigner sign"
"$BT/apksigner" verify --verbose build/xerophis-signed.apk | tail -8 || true

cp -f build/xerophis-signed.apk app/public/xerophis.apk
log "SELESAI: $(du -h build/xerophis-signed.apk | cut -f1) — tersedia di http://69.33.213.153/xerophis.apk"
