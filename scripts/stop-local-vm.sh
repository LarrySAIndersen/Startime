#!/usr/bin/env bash
set -euo pipefail
tmux -f /exec-daemon/tmux.portal.conf kill-session -t startime-api 2>/dev/null || true
tmux -f /exec-daemon/tmux.portal.conf kill-session -t startime-web 2>/dev/null || true
echo "Startime dev-servere stoppet."
