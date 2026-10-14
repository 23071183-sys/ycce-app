#!/bin/bash
# Start the full YCCE dev stack over tunnels so nothing breaks when Wi-Fi changes.
#
#   1. Backend (port 3000) against the local Postgres
#   2. A public tunnel for that API
#   3. Expo in tunnel mode, pointed at the API tunnel
#
# Both the app and the API become reachable from any network, so switching
# Wi-Fi (or moving to cellular) no longer requires editing an IP by hand.

set -euo pipefail

APP_DIR="/Users/yash/ycce-app"
BACKEND_DIR="/Users/yash/ycce-app-backend"
DB_URL="postgresql://$(whoami)@localhost:5432/ycce_app_db"
API_PORT=3000
LOG_DIR="${TMPDIR:-/tmp}/ycce-dev"

mkdir -p "$LOG_DIR"

cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "${LT_PID:-}" ] && kill "$LT_PID" 2>/dev/null || true
  [ -n "${BE_PID:-}" ] && kill "$BE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# --- 1. Backend ---------------------------------------------------------
if lsof -nP -iTCP:$API_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "✓ Backend already running on port $API_PORT"
else
  echo "→ Starting backend..."
  ( cd "$BACKEND_DIR" && LOCAL_DATABASE_URL="$DB_URL" node server.js > "$LOG_DIR/backend.log" 2>&1 ) &
  BE_PID=$!
  for _ in $(seq 1 30); do
    curl -sf -o /dev/null --max-time 2 "http://localhost:$API_PORT/api/announcements/general" && break
    sleep 1
  done
  if ! curl -sf -o /dev/null --max-time 3 "http://localhost:$API_PORT/api/announcements/general"; then
    echo "✗ Backend failed to start. Last lines:"
    tail -20 "$LOG_DIR/backend.log"
    exit 1
  fi
  echo "✓ Backend up on port $API_PORT"
fi

# --- 2. API tunnel ------------------------------------------------------
# localtunnel's free service intermittently fails to assign a subdomain, so
# retry rather than aborting the whole stack on a transient failure.
API_URL=""
for attempt in 1 2 3 4 5; do
  echo "→ Opening API tunnel (attempt $attempt)..."
  : > "$LOG_DIR/tunnel.log"
  npx --yes localtunnel --port $API_PORT > "$LOG_DIR/tunnel.log" 2>&1 &
  LT_PID=$!

  CANDIDATE=""
  for _ in $(seq 1 25); do
    CANDIDATE=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' "$LOG_DIR/tunnel.log" 2>/dev/null | head -1 || true)
    [ -n "$CANDIDATE" ] && break
    sleep 1
  done

  # A URL alone isn't enough — confirm it actually reaches the backend.
  if [ -n "$CANDIDATE" ] && curl -sf -o /dev/null --max-time 25 \
      -H 'bypass-tunnel-reminder: 1' "$CANDIDATE/api/announcements/general"; then
    API_URL="$CANDIDATE"
    break
  fi

  echo "  tunnel attempt $attempt failed, retrying..."
  kill "$LT_PID" 2>/dev/null || true
  LT_PID=""
  sleep 3
done

if [ -z "$API_URL" ]; then
  echo "✗ API tunnel failed after 5 attempts. Last lines:"
  tail -20 "$LOG_DIR/tunnel.log"
  exit 1
fi
echo "✓ API tunnel live: $API_URL"

# --- 3. Expo ------------------------------------------------------------
export EXPO_PUBLIC_API_URL="$API_URL/api"
echo "→ Starting Expo (tunnel mode); app will call $EXPO_PUBLIC_API_URL"
echo ""

cd "$APP_DIR"
npx expo start --tunnel --clear
