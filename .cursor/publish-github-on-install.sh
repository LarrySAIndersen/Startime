#!/usr/bin/env bash
# Best-effort push when a valid GH_TOKEN is injected on agent boot.
set +e
bash /workspace/scripts/push-to-github.sh
exit 0
