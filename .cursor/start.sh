#!/usr/bin/env bash
set -euo pipefail

cd /workspace

if ! tmux -f /exec-daemon/tmux.portal.conf has-session -t "=star-hub-api" 2>/dev/null; then
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s star-hub-api -c /workspace/apps/api -- \
    "${SHELL:-bash}" -l -c "python3 -m uvicorn app.main:app --host 0.0.0.0 --port 5080"
fi

if ! tmux -f /exec-daemon/tmux.portal.conf has-session -t "=star-hub-web" 2>/dev/null; then
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s star-hub-web -c /workspace/apps/web -- \
    "${SHELL:-bash}" -l -c "AUTH_DEV_BYPASS=1 NEXT_TELEMETRY_DISABLED=1 npm run dev -- --hostname 0.0.0.0 --port 4319"
fi
