#!/usr/bin/env bash
set -euo pipefail

REFERENCE_REPO="${REFERENCE_ORIGIN_REPO:-origin.cursor.com/git/larrysanders/stardesk}"
REFERENCE_DIR="/workspace/.reference/stardesk"
CLONE_URL="https://origin.cursor.com/git/${REFERENCE_REPO#origin.cursor.com/git/}"

mkdir -p /workspace/.reference

if [[ -d "${REFERENCE_DIR}/.git" ]]; then
  git -C "${REFERENCE_DIR}" fetch --depth 1 origin main 2>/dev/null || \
    git -C "${REFERENCE_DIR}" fetch --depth 1 origin master 2>/dev/null || true
  git -C "${REFERENCE_DIR}" pull --ff-only 2>/dev/null || true
  exit 0
fi

if git clone --depth 1 "${CLONE_URL}" "${REFERENCE_DIR}" 2>/dev/null; then
  echo "Reference app synced from ${REFERENCE_REPO}"
else
  echo "Reference repo not available to this agent token yet (${REFERENCE_REPO})."
fi
