#!/usr/bin/env bash
# Shrinks PNG screenshots in place (typically 50-60% smaller) with no visible
# loss for UI captures. Uses pngquant when present, else ImageMagick PNG8.
#   compress.sh DIR
set -euo pipefail
cd "$1"
before=$(du -sh . | cut -f1)
if command -v pngquant >/dev/null; then
  pngquant --force --ext .png --quality 70-90 --skip-if-larger -- *.png || true
else
  for f in *.png; do convert "$f" -colors 256 "PNG8:$f"; done
fi
echo "screenshots: $before -> $(du -sh . | cut -f1)"
