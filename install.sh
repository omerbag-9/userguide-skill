#!/usr/bin/env bash
# Installs the userguide skill without the plugin system.
#
#   curl -fsSL https://raw.githubusercontent.com/omerbag-9/userguide-skill/main/install.sh | bash
#   curl -fsSL …/install.sh | bash -s -- --project          # this repo only: ./.claude/skills
#   curl -fsSL …/install.sh | bash -s -- --dir ~/.codex/skills   # any agent's skills folder
set -euo pipefail

REPO="omerbag-9/userguide-skill"
REF="${USERGUIDE_REF:-main}"
DEST="${HOME}/.claude/skills"

while [ $# -gt 0 ]; do
  case "$1" in
    --project) DEST="$(pwd)/.claude/skills" ;;
    --dir) shift; DEST="$1" ;;
    --ref) shift; REF="$1" ;;
    -h|--help) sed -n '2,8p' "$0" 2>/dev/null || true; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }
command -v tar >/dev/null || { echo "tar is required" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fsSL "https://codeload.github.com/${REPO}/tar.gz/${REF}" | tar -xz -C "$tmp"
src="$(find "$tmp" -mindepth 3 -maxdepth 3 -type d -path '*/skills/userguide' | head -n 1)"
[ -n "$src" ] || { echo "Could not find skills/userguide in ${REPO}@${REF}" >&2; exit 1; }

mkdir -p "$DEST"
rm -rf "${DEST}/userguide"
cp -R "$src" "${DEST}/userguide"
echo "Installed userguide into ${DEST}/userguide"
echo "Open Claude Code in any project and type /userguide"
