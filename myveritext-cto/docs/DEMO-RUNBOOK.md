# Friday Demo Runbook (MyVeritext 2.0)

## Goal
Demonstrate technical leadership across UX, reliability, AI, compliance, and architecture in 5–8 minutes.

## Pre-demo checklist (T-30 min)
- Confirm Cloud Run service URL is up.
- Confirm seeded org/user/matter exists.
- Confirm you have:
  - `ADMIN_USER_ID`
  - `MATTER_ID`
- Verify endpoints return 200 with `x-user-id` header.
- Open the architecture diagram and object model in separate tabs.

## Demo flow (recommended)

### 1) Open with product framing (30 sec)
- “I rebuilt this as a matter-centric platform with reliability and compliance as first-class concerns.”
- Show landing panel and five pillars.

### 2) Show scheduling capability (60 sec)
- `GET /api/jobs`
- `POST /api/jobs` (create a new proceeding)
- `PATCH /api/jobs/:id/status` (move to IN_PROGRESS or COMPLETED)

### 3) Show records + upload workflow (60 sec)
- `POST /api/records/upload-url` (signed-upload shape)
- `POST /api/records` (save transcript/exhibit metadata)
- `GET /api/records`

### 4) Show search + AI (90 sec)
- `GET /api/search?q=deposition`
- `POST /api/ai/summary` with prompt and matterId
- Highlight citation-backed response structure and auditability

### 5) Show GraphQL value (60 sec)
- `POST /api/graphql` with `matters` query
- `POST /api/graphql` with `createJob` mutation
- Explain hybrid API strategy: REST for operational endpoints, GraphQL for cross-object product queries

### 6) Close with architecture + execution (60–90 sec)
- Open `docs/ARCHITECTURE.md` + DB/Object visuals
- Explain tradeoffs chosen for speed-to-value and scale path
- End on how this becomes production-hard in 30/60/90 days

## Fallback plan (if API call fails)
- Show latest successful curl logs from smoke test output
- Keep narrative focused on architecture decisions + rollout maturity
- Mention known gaps and explicit next milestones

## Command snippets

### Set environment
```bash
export BASE_URL="https://myveritext-cto-web-dvp6tlh2sa-uc.a.run.app"
export ADMIN_USER_ID="<seeded-admin-user-id>"
export MATTER_ID="<seeded-matter-id>"
```

### GraphQL quick query
```bash
curl -s -X POST "$BASE_URL/api/graphql" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $ADMIN_USER_ID" \
  -d '{"query":"query { matters { id referenceNumber title } }"}' | jq
```

### AI summary quick call
```bash
curl -s -X POST "$BASE_URL/api/ai/summary" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $ADMIN_USER_ID" \
  -d "{\"matterId\":\"$MATTER_ID\",\"prompt\":\"Summarize key testimony\"}" | jq
```
