#!/bin/bash
# Footline local launcher for macOS: serves this folder and opens the game in its own app window.
cd "$(dirname "$0")"
PORT=8723; URL="http://localhost:$PORT/game.html"
if ! command -v python3 >/dev/null; then echo "python3 is needed (macOS will offer to install it)."; read -r; exit 1; fi
python3 -m http.server $PORT >/dev/null 2>&1 &
SRV=$!; sleep 1
if [ -d "/Applications/Google Chrome.app" ]; then open -na "Google Chrome" --args --app="$URL" --window-size=1600,1000
elif [ -d "/Applications/Microsoft Edge.app" ]; then open -na "Microsoft Edge" --args --app="$URL" --window-size=1600,1000
else open "$URL"; fi
echo "Footline is running at $URL"; echo "Close this window (or press Enter) to stop the game server."
read -r; kill $SRV
