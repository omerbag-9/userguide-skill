#!/usr/bin/env bash
# Tiles screenshots into one labelled image so a whole capture run can be
# reviewed at a glance (look for blank, wrong, empty or duplicate frames).
#   contact_sheet.sh SHOTS_DIR OUT.png [GLOB]     e.g. contact_sheet.sh shots sheet-admin.png 'a-*.png'
set -euo pipefail
dir=$1; out=$2; glob=${3:-*.png}
cd "$dir"
# shellcheck disable=SC2086
montage -label '%f' $glob -tile 6x -geometry 360x225+4+20 -pointsize 13 "$out"
echo "wrote $out"
