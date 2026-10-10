#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.dotnet:/usr/local/bin:${PATH}"
cd /workspace

if ! tmux -f /exec-daemon/tmux.portal.conf has-session -t "=startime-api" 2>/dev/null; then
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s startime-api -c /workspace -- \
    "${SHELL:-bash}" -l -c "dotnet run --project backend/Startime.Api/Startime.Api.csproj --urls http://0.0.0.0:5080"
fi

if ! tmux -f /exec-daemon/tmux.portal.conf has-session -t "=startime-web" 2>/dev/null; then
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s startime-web -c /workspace/frontend -- \
    "${SHELL:-bash}" -l -c "npm run dev -- --host 0.0.0.0 --port 4319"
fi
