#!/bin/bash
set -e

ANDROID_HOME="$HOME/Library/Android/sdk"
EMULATOR="$ANDROID_HOME/emulator/emulator"
ADB="$ANDROID_HOME/platform-tools/adb"

AVD="Medium_Phone_API_35"

echo "⏳ Arrancando emulador ($AVD)..."
"$EMULATOR" -avd "$AVD" -no-snapshot &
EMU_PID=$!

echo "⏳ Esperando a que el dispositivo esté listo..."
"$ADB" wait-for-device

until "$ADB" shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do
  sleep 2
done

echo "✅ Emulador listo (PID=$EMU_PID), arrancando Expo..."
npx expo run:android
