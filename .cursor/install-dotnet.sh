#!/usr/bin/env bash
set -euo pipefail

if command -v dotnet >/dev/null 2>&1; then
  dotnet --version
  exit 0
fi

curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
bash /tmp/dotnet-install.sh --channel 8.0 --install-dir "${HOME}/.dotnet"
sudo ln -sf "${HOME}/.dotnet/dotnet" /usr/local/bin/dotnet
dotnet --version
