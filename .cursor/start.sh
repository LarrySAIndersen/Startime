#!/usr/bin/env bash
set -euo pipefail

cd /workspace
PORT="${PORT:-4319}"

if ! tmux -f /exec-daemon/tmux.portal.conf has-session -t "=dev-server" 2>/dev/null; then
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s dev-server -c /workspace -- \
    "${SHELL:-bash}" -l -c "npm run dev -- --hostname 0.0.0.0 --port ${PORT}"
fi
