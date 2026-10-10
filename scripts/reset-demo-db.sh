#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="${STARHUB_DB:-${ROOT}/.local/starhub.db}"
rm -f "$DB"
echo "Demo-database slettet: $DB"
echo "Kør: bash scripts/deploy-local-vm.sh"
