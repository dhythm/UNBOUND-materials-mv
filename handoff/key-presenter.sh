#!/bin/zsh
set -euo pipefail
TASK_ROOT="${0:A:h:h}"
TASK_INPUT="$TASK_ROOT/video-inbox/presenter-green.mp4"
TASK_OUTPUT="$TASK_ROOT/video-inbox/presenter-alpha.webm"
if [[ ! -f "$TASK_INPUT" ]]; then
  print -u2 'video-inbox/presenter-green.mp4 がまだありません。Seedanceの人物動画を保存してください。'
  exit 1
fi
if [[ -e "$TASK_OUTPUT" ]]; then
  print -u2 '出力が既にあります。確認してから別名にしてください。'
  exit 1
fi
# Starting parameters only: sample the ACTUAL delivered background and inspect hair/skin edges.
# RGB colorkey is performed BEFORE compositing, so the orange motion graphics are unaffected.
ffmpeg -n -i "$TASK_INPUT" -vf 'fps=30,format=rgba,colorkey=0x00B140:0.18:0.08,despill=type=green:mix=0.5' -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 18 -b:v 0 -c:a libopus "$TASK_OUTPUT"
print 'Alpha WebM generated. Verify alpha with a decoder that supports VP9 alpha; do not rely on a player showing a black background.'
