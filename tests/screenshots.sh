#!/usr/bin/env bash
# Regenerate the desktop README screenshots from the smoke page with headless Chrome.
# The phone screenshot (docs/img/trace-phone-light.png) is taken by hand in a browser with device emulation,
# because headless Chrome without emulation lays the page out at desktop width regardless of --window-size.
# Usage: tests/screenshots.sh [path to chrome binary]
set -euo pipefail
cd "$(dirname "$0")/.."
CH="${1:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
if [ ! -x "$CH" ]; then
  CH="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
fi
if [ -z "$CH" ]; then
  echo "no Chrome or Chromium binary found; pass its path as the first argument" >&2
  exit 1
fi
node tests/build-smoke.js
OUT="tests/out"
mkdir -p docs/img
for theme in light dark; do
  { printf '<script>document.documentElement.setAttribute("data-theme","%s");</script>\n' "$theme"; cat "$OUT/smoke-trace.html"; } > "$OUT/$theme.html"
  "$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 --window-size=1400,900 \
    --screenshot="docs/img/trace-desktop-$theme.png" "file://$PWD/$OUT/$theme.html#step4" >/dev/null 2>&1
done
ls -la docs/img
