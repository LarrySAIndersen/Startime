#!/usr/bin/env bash
# Build React and serve everything from .NET on one port (typical lokal VM/prod-test).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.dotnet:/usr/local/bin:${PATH}"
PUBLISH_DIR="${ROOT}/.local/publish"
PORT="${STARTIME_PORT:-5080}"

cd "$ROOT"
bash .cursor/install-dotnet.sh
dotnet restore backend/Startime.Api/Startime.Api.csproj
npm ci --prefix frontend
npm run build --prefix frontend

WWW="${ROOT}/backend/Startime.Api/wwwroot"
rm -rf "$WWW"
cp -a frontend/dist "$WWW"

dotnet publish backend/Startime.Api/Startime.Api.csproj -c Release -o "$PUBLISH_DIR"

bash scripts/stop-local-vm.sh 2>/dev/null || true
tmux -f /exec-daemon/tmux.portal.conf kill-session -t startime-prod 2>/dev/null || true

tmux -f /exec-daemon/tmux.portal.conf new-session -d -s startime-prod -c "$PUBLISH_DIR" -- \
  "${SHELL:-bash}" -l -c "STARHUB_DB=${ROOT}/.local/starhub.db ASPNETCORE_ENVIRONMENT=Production ASPNETCORE_URLS=http://0.0.0.0:${PORT} dotnet Startime.Api.dll"

echo ""
echo "Startime (build + en port) kører på http://127.0.0.1:${PORT}"
echo "Stop: tmux -f /exec-daemon/tmux.portal.conf kill-session -t startime-prod"
