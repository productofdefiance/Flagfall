#!/usr/bin/env bash
# Brief 003: a change to board/ must raise the build number in board/version.js.
# Brief 007: it must also change the game version (`game`, vX.YY.ZZ) in board/version.js.
# bash .github/check-build-number.sh <earlier checkout> <this checkout>
# Passes when board/ is unchanged, or when the build number went up and the game version changed.
# An earlier board with no version.js counts as build 0; one with no game version counts as "none".
set -u
BASE="$1"; HEAD="$2"
game_of() { if [ -f "$1/board/version.js" ]; then node -p "require('$(cd "$1" && pwd)/board/version.js').game || 'none'" 2>/dev/null || echo "unreadable"; else echo none; fi; }
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
HG=$(game_of "$HEAD"); BG=$(game_of "$BASE")
echo "Game version: earlier $BG, this commit $HG."
if ! [[ "$HG" =~ ^v[0-9]+\.[0-9]{2}\.[0-9]{2}$ ]]; then echo "FAIL: board/version.js needs a game version written vX.YY.ZZ (the brief states it)."; exit 1; fi
if [ "$HG" = "$BG" ]; then echo "FAIL: board/ changed but the game version is still $HG. Set the version the brief states."; exit 1; fi
echo "OK: the build number went up and the game version changed."
