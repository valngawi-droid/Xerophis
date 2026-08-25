#!/usr/bin/env bash
# dijalankan DI DALAM container Android SDK
set -e
log() { echo "[apk-inner] $*"; }
fail() { echo "[apk-inner] GAGAL: $*"; exit 1; }
AH=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}
if [ -z "$AH" ] || [ ! -d "$AH/build-tools" ]; then
  for cand in /opt/android-sdk /usr/local/lib/android/sdk /root/android-sdk /opt/android-sdk-linux /usr/lib/android-sdk; do
    if [ -d "$cand/build-tools" ]; then AH=$cand; break; fi
  done
fi
[ -d "$AH/build-tools" ] || { echo "[apk-inner] isi container:"; ls -la /opt /usr/local 2>/dev/null | head -30; fail "ANDROID_HOME tidak ketemu"; }
BT=$(ls -d "$AH"/build-tools/* | sort -V | tail -1)
PJ=$(ls -d "$AH"/platforms/android-* | sort -V | tail -1)/android.jar
log "SDK: $BT"

# font emoji resmi (24MB) dari GitHub biar emoji konsisten + isi APK berbobot nyata
mkdir -p android/assets/fonts
[ -s android/assets/fonts/NotoColorEmoji.ttf ] || \
  curl -fsSL -m 600 -o android/assets/fonts/NotoColorEmoji.ttf https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf \
  || log "emoji font gagal diunduh — lanjut tanpa"

W=android/work
rm -rf "$W" && mkdir -p "$W/classes" "$W/out"
log "aapt2 compile+link…"
"$BT/aapt2" compile --dir android/res -o "$W/res.zip" || fail "aapt2 compile"
"$BT/aapt2" link -o "$W/base.apk" --manifest android/AndroidManifest.xml -I "$PJ" --auto-add-overlay "$W/res.zip" || fail "aapt2 link"
log "javac…"
javac -classpath "$PJ" -d "$W/classes" android/java/xerophis/MainActivity.java || fail "javac"
log "d8…"
"$BT/d8" --lib "$PJ" --output "$W/out" "$W"/classes/xerophis/*.class || fail "d8"
log "paket dex + assets + native libs…"
python3 - "$W/base.apk" "$W/out/classes.dex" "$W/final.apk" <<'PY'
import zipfile, sys, os
base, dex, out = sys.argv[1:4]
zin = zipfile.ZipFile(base)
zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    zout.writestr(item, zin.read(item.filename))
zout.write(dex, 'classes.dex', zipfile.ZIP_STORED)
for base_dir, prefix in [('android/assets', 'assets'), ('android/libs-jni', 'lib')]:
    if os.path.isdir(base_dir):
        for root, _, files in os.walk(base_dir):
            for f in files:
                rel = os.path.relpath(os.path.join(root, f), base_dir)
                zout.write(os.path.join(root, f), prefix + '/' + rel.replace(os.sep, '/'), zipfile.ZIP_DEFLATED)
tot = 0
for base_dir in ['android/assets', 'android/libs-jni']:
    if os.path.isdir(base_dir):
        for r, _, fs in os.walk(base_dir):
            for f in fs: tot += os.path.getsize(os.path.join(r, f))
print(f'[apk-inner] bundled assets+libs: {tot/1048576:.1f} MB')
PY
log "zipalign + apksigner…"
[ -f my-release-key.jks ] || keytool -genkeypair -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias -storepass xerophis123 -keypass xerophis123 -dname "CN=Pall, O=Xerophis Team Dev, C=ID"
keytool -list -keystore my-release-key.jks -storepass xerophis123 >/dev/null 2>&1 || { mv -f my-release-key.jks "my-release-key.jks.old.$(date +%s)"; \
  keytool -genkeypair -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias -storepass xerophis123 -keypass xerophis123 -dname "CN=Pall, O=Xerophis Team Dev, C=ID"; }
"$BT/zipalign" -f 4 "$W/final.apk" "$W/aligned.apk"
"$BT/apksigner" sign --ks my-release-key.jks --ks-key-alias my-key-alias --ks-pass pass:xerophis123 --key-pass pass:xerophis123 \
  --out build/xerophis-signed.apk "$W/aligned.apk" || fail "apksigner sign"
"$BT/apksigner" verify --verbose build/xerophis-signed.apk | tail -6 || true
mkdir -p app/public
cp -f build/xerophis-signed.apk app/public/xerophis.apk
