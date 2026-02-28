#!/usr/bin/env bash
set -euo pipefail

API_URL="https://api-k.devdove.site/v1/chat/completions"

if [ -z "${DEVDOVE_API_KEY:-}" ]; then
  echo "DEVDOVE_API_KEY is not set"
  exit 1
fi

payload='{"messages":[{"role":"system","content":"Return ONLY JSON: {\"t\":\"Test\",\"i\":[[\"A\",\"block\",\"\"],[\"B\",\"block\",\"\"]],\"v\":[[[[0,0,0],[1,4,0]],[[0,1]]]],\"_\":{\"f\":\"compact\",\"v\":\"1.0\"}}"},{"role":"user","content":"test"}],"temperature":0}'

for model in "gemini-3.1-pro-preview" "gemini-3-flash-preview"; do
  echo "=== ${model} ==="
  curl -sS "${API_URL}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${DEVDOVE_API_KEY}" \
    -d "{\"model\":\"${model}\",${payload}}"
  echo
  echo
 done
