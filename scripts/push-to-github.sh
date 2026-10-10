#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-ny-applikation}"
VISIBILITY="${2:-private}"

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "GH_TOKEN is not set. Add a GitHub PAT with repo scope to this environment."
  exit 1
fi

export GH_TOKEN
cd /workspace

if git remote get-url github &>/dev/null; then
  echo "Remote 'github' already exists."
else
  gh repo create "${REPO_NAME}" \
    --"${VISIBILITY}" \
    --source=. \
    --remote=github \
    --description "Ny applikation (Cursor Cloud Agent)"
fi

git push -u github main

echo "Done: https://github.com/$(gh api user -q .login)/${REPO_NAME}"
