#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BASE_URL:-}" || -z "${ADMIN_USER_ID:-}" ]]; then
  echo "Usage: BASE_URL=... ADMIN_USER_ID=... [MATTER_ID=...] ./scripts/smoke.sh"
  exit 1
fi

auth_header=()
if [[ -n "${ID_TOKEN:-}" ]]; then
  auth_header=( -H "Authorization: Bearer ${ID_TOKEN}" )
fi

header=( -H "Content-Type: application/json" -H "x-user-id: ${ADMIN_USER_ID}" "${auth_header[@]}" )

echo "[1/5] GET /api/matters"
curl -sf "${BASE_URL}/api/matters" "${header[@]}" | jq '.data | length' >/dev/null

echo "[2/5] GET /api/jobs"
curl -sf "${BASE_URL}/api/jobs" "${header[@]}" | jq '.data | length' >/dev/null

echo "[3/5] GET /api/search"
curl -sf "${BASE_URL}/api/search?q=demo" "${header[@]}" | jq '.data.strategy' >/dev/null

echo "[4/5] POST /api/graphql"
curl -sf -X POST "${BASE_URL}/api/graphql" "${header[@]}" \
  -d '{"query":"query { matters { id referenceNumber } }"}' | jq '.data.matters' >/dev/null

if [[ -n "${MATTER_ID:-}" ]]; then
  echo "[5/5] POST /api/ai/summary"
  curl -sf -X POST "${BASE_URL}/api/ai/summary" "${header[@]}" \
    -d "{\"matterId\":\"${MATTER_ID}\",\"prompt\":\"Summarize recent proceedings\"}" | jq '.data.summary' >/dev/null
else
  echo "[5/5] Skipping AI summary (MATTER_ID not set)"
fi

echo "Smoke test passed."
