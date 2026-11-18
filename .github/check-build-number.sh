#!/usr/bin/env bash
# Brief 003: a change to board/ must raise the build number in board/version.js.
# bash .github/check-build-number.sh <earlier checkout> <this checkout>
# Passes when board/ is unchanged, or when the build number went up. An earlier board with no version.js counts as 0.
set -u
BASE="$1"; HEAD="$2"
build_of() { if [ -f "$1/board/version.js" ]; then node -p "require('$(cd "$1" && pwd)/board/version.js').build" 2>/dev/null || echo "unreadable"; else echo 0; fi; }
if [ ! -d "$BASE/board" ]; then echo "No earlier board to compare against: nothing to check."; exit 0; fi
HB=$(build_of "$HEAD"); BB=$(build_of "$BASE")
if diff -rq "$BASE/board" "$HEAD/board" > /dev/null; then
  echo "board/ is unchanged (build $HB): the build number may stay the same."; exit 0
fi
echo "board/ changed. Build number: earlier $BB, this commit $HB."
diff -rq "$BASE/board" "$HEAD/board" | sed 's/^/  /' | head -20
if ! [[ "$HB" =~ ^[0-9]+$ ]]; then echo "FAIL: board/version.js is missing or has no whole-number build."; exit 1; fi
if [ "$HB" -le "$BB" ]; then echo "FAIL: raise the build number in board/version.js (it must be higher than $BB)."; exit 1; fi
echo "OK: the build number went up."
