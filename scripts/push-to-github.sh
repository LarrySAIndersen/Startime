#!/usr/bin/env bash
set -euo pipefail

GITHUB_REPO="${1:-LarrySAIndersen/Startime}"
REMOTE_URL="https://github.com/${GITHUB_REPO}.git"

cd /workspace

if [[ -n "${GH_TOKEN:-}" ]]; then
  export GH_TOKEN
  if git push "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPO}.git" main 2>/dev/null; then
    echo "Pushed to https://github.com/${GITHUB_REPO}"
    exit 0
  fi
  echo "GH_TOKEN push failed; trying gh credential helper…"
fi

if env -u GH_TOKEN gh auth status -h github.com &>/dev/null; then
  env -u GH_TOKEN git push -u "${REMOTE_URL}" main
  echo "Pushed to https://github.com/${GITHUB_REPO}"
  exit 0
fi

echo "No working GitHub credentials (GH_TOKEN write or gh auth login)."
exit 1
