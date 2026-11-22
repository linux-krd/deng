#!/usr/bin/env bash
# ffmpeg.wasm دابەزاندنی فایلەکانی
# بەکارهێنان: ./setup-ffmpeg.sh
set -e
TMP=$(mktemp -d)
cd "$TMP"
npm init -y >/dev/null
npm i @ffmpeg/ffmpeg@0.12.10 @ffmpeg/core@0.12.6 >/dev/null
cd - >/dev/null
rm -rf vendor/ffmpeg vendor/core
mkdir -p vendor/ffmpeg vendor/core
cp "$TMP"/node_modules/@ffmpeg/ffmpeg/dist/umd/* vendor/ffmpeg/
cp "$TMP"/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.* vendor/core/
echo "ffmpeg.wasm بە سەرکەوتوویی دانرا لە vendor/"
