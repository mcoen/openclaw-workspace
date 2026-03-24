# API Demo Quickstart

## Auth model (current demo scaffold)
Pass a seeded user id in request header:

- `x-user-id: <user-id>`

> In this scaffold, RBAC is matter-scoped and role-aware. Next step will plug this into real auth/session middleware.

## Endpoints

### Matters
- `GET /api/matters`
- `POST /api/matters`

### Jobs
- `GET /api/jobs`
- `POST /api/jobs`
- `PATCH /api/jobs/:id/status`

### Records
- `GET /api/records`
- `POST /api/records`

### Search
- `GET /api/search?q=<query>&matterId=<optional>`

### Records upload URL scaffold
- `POST /api/records/upload-url`

### AI Summary
- `POST /api/ai/summary`

### GraphQL
- `POST /api/graphql`

## Sample summary request
```bash
curl -X POST "$BASE_URL/api/ai/summary" \
  -H "Content-Type: application/json" \
  -H "x-user-id: <seeded-admin-user-id>" \
  -d '{
    "matterId": "<matter-id>",
    "prompt": "Summarize recent testimony and next actions"
  }'
```

## Seed data
After migrations:
```bash
node prisma/seed.mjs
```
