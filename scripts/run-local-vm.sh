#!/usr/bin/env bash
# Start React (Vite) + .NET API on this machine (dev mode).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.dotnet:/usr/local/bin:${PATH}"

cd "$ROOT"
bash .cursor/install-dotnet.sh
dotnet restore backend/Startime.Api/Startime.Api.csproj
npm ci --prefix frontend

bash .cursor/start.sh
echo ""
echo "Startime kører:"
echo "  Web:  http://127.0.0.1:4319"
echo "  API:  http://127.0.0.1:5080/api/health"
echo "Stop: bash scripts/stop-local-vm.sh"
