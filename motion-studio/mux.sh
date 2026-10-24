#!/usr/bin/env bash
# Mix audio to −14 LUFS and put it on a silent render.
# ./mux.sh out/silent.mp4 out/score_raw.wav out/final.mp4
set -euo pipefail
V=$1; A=$2; OUT=$3

# Pass 1: measure loudness. Pass 2: apply it linearly so the mix keeps its dynamics.
M=$(ffmpeg -hide_banner -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$M" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true"

ffmpeg -y -v error -i "$V" -i "$A" -filter:a "$LN" -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
