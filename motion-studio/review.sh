#!/usr/bin/env bash
# Turn a render into images Claude can review.
# ./review.sh [video=out/final.mp4] [fast moment in seconds=4.2]
set -euo pipefail
V=${1:-out/final.mp4}
T=${2:-4.2}
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
q() { ffmpeg -y -v error "$@"; }

# Contact sheet: 30 frames across the whole video (2 fps for a 15 s film), 6 across
q -i "$V" -vf "fps=30/$DUR,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png

# Strip: 12 frames around the fast moment, to catch glitches
q -ss "$(awk "BEGIN { s = $T - 0.1; print (s < 0 ? 0 : s) }")" -i "$V" \
  -vf "scale=320:-1,tile=12x1" -frames:v 1 out/strip.png

# Phone test: how it reads at 360px wide
q -i "$V" -vf "fps=15/$DUR,scale=360:-1,tile=5x3" -frames:v 1 out/phone.png

# Loop check: play it twice and watch the seam
q -stream_loop 1 -i "$V" -c copy out/loop_check.mp4

echo "out/contact.png out/strip.png out/phone.png out/loop_check.mp4"
