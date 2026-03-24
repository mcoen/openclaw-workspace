#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BASE_URL:-}" || -z "${ADMIN_USER_ID:-}" || -z "${MATTER_ID:-}" ]]; then
  echo "Set BASE_URL, ADMIN_USER_ID, MATTER_ID first."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install with: sudo apt-get update && sudo apt-get install -y jq"
  exit 1
fi

header=( -H "Content-Type: application/json" -H "x-user-id: $ADMIN_USER_ID" )

echo "== 1) Matters =="
curl -s "$BASE_URL/api/matters" "${header[@]}" | jq '.data[0] | {id, referenceNumber, title}'

echo "== 2) Create job =="
JOB_JSON=$(curl -s -X POST "$BASE_URL/api/jobs" \
  "${header[@]}" \
  -d "{\"matterId\":\"$MATTER_ID\",\"scheduledStart\":\"$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%S.000Z)\",\"location\":\"Remote\",\"notes\":\"Interview demo proceeding\"}")
echo "$JOB_JSON" | jq '.data | {id,status,scheduledStart}'
JOB_ID=$(echo "$JOB_JSON" | jq -r '.data.id')

echo "== 3) Update job status =="
curl -s -X PATCH "$BASE_URL/api/jobs/$JOB_ID/status" \
  "${header[@]}" \
  -d '{"status":"IN_PROGRESS"}' | jq '.data | {id,status}'

echo "== 4) Search =="
curl -s "$BASE_URL/api/search?q=deposition&matterId=$MATTER_ID" \
  -H "x-user-id: $ADMIN_USER_ID" | jq '.data | {strategy, matterCount:(.matters|length), recordCount:(.records|length)}'

echo "== 5) AI summary =="
curl -s -X POST "$BASE_URL/api/ai/summary" \
  "${header[@]}" \
  -d "{\"matterId\":\"$MATTER_ID\",\"prompt\":\"Summarize key testimony and next actions\"}" | jq '.data | {summary,confidence,citationCount:(.citations|length)}'

echo "== 6) GraphQL =="
curl -s -X POST "$BASE_URL/api/graphql" \
  "${header[@]}" \
  -d '{"query":"query { matters { id referenceNumber title jobs { id status } } }"}' | jq '.data.matters[0] | {id,referenceNumber,title,jobCount:(.jobs|length)}'

echo "Rehearsal completed."
