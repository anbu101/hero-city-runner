#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/anbu/dev/hero-city-runner"
LOG_FILE="/tmp/hero-city-runner-server.log"
DEV_PORT=5173
PREVIEW_PORT=4173

cd "$ROOT_DIR"

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [[ -z "${IP}" ]]; then
  IP="$(ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}')"
fi

cleanup_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Port ${port} is busy. Closing old process..."
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 0.4
  fi
}

wait_until_ready() {
  local port="$1"
  local attempts=0
  while [[ "${attempts}" -lt 60 ]]; do
    if curl -sSf "http://127.0.0.1:${port}" >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 0.25
  done
  return 1
}

start_and_wait() {
  local mode="$1"
  local port="$2"
  : >"${LOG_FILE}"
  echo "Starting ${mode} server on port ${port}..."
  if [[ "${mode}" == "dev" ]]; then
    npm run dev >"${LOG_FILE}" 2>&1 &
  else
    npm run preview >"${LOG_FILE}" 2>&1 &
  fi
  SERVER_PID=$!
  if wait_until_ready "${port}"; then
    return 0
  fi
  kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
  return 1
}

SERVER_PID=""
trap 'if [[ -n "${SERVER_PID}" ]]; then kill "${SERVER_PID}" 2>/dev/null || true; fi' EXIT INT TERM

cleanup_port "${DEV_PORT}"
cleanup_port "${PREVIEW_PORT}"

if start_and_wait "dev" "${DEV_PORT}"; then
  echo
  echo "Server is ready."
  echo "Open on laptop: http://localhost:${DEV_PORT}"
  if [[ -n "${IP}" ]]; then
    echo "Open on phone:  http://${IP}:${DEV_PORT}"
    if curl -sSf "http://${IP}:${DEV_PORT}" >/dev/null 2>&1; then
      echo "LAN self-check: PASS (this Mac can reach its LAN URL)."
    else
      echo "LAN self-check: FAIL (LAN URL not reachable from this Mac)."
      echo "Likely firewall or network isolation issue."
    fi
  else
    echo "Could not detect local IP automatically."
  fi
  echo "If phone still fails, verify both devices are on the same Wi-Fi."
  echo
  tail -f "${LOG_FILE}"
  exit 0
fi

echo "Dev server failed to become reachable. Trying preview fallback..."
npm run build

if start_and_wait "preview" "${PREVIEW_PORT}"; then
  echo
  echo "Preview server is ready."
  echo "Open on laptop: http://localhost:${PREVIEW_PORT}"
  if [[ -n "${IP}" ]]; then
    echo "Open on phone:  http://${IP}:${PREVIEW_PORT}"
    if curl -sSf "http://${IP}:${PREVIEW_PORT}" >/dev/null 2>&1; then
      echo "LAN self-check: PASS (this Mac can reach its LAN URL)."
    else
      echo "LAN self-check: FAIL (LAN URL not reachable from this Mac)."
      echo "Likely firewall or network isolation issue."
    fi
  else
    echo "Could not detect local IP automatically."
  fi
  echo
  tail -f "${LOG_FILE}"
  exit 0
fi

echo "Could not start a reachable server."
echo "Last server log lines:"
tail -n 60 "${LOG_FILE}" || true
exit 1
