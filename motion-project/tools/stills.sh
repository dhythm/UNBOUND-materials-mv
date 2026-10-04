#!/bin/sh
# 指定フレームの静止画を out/full/ へ（1回のバンドルで連続描画）
cd "$(dirname "$0")/.." || exit 1
for fr in "$@"; do
  npx remotion still Unbound "out/full/f$fr.png" --frame="$fr" --log=error 2>&1 | grep -v PackFileCache
done
