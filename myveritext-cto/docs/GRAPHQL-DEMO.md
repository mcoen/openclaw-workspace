# GraphQL API (Demo Scaffold)

Endpoint:
- `POST /api/graphql`

Auth header (same as REST scaffold):
- `x-user-id: <user-id>`

## Example query
```bash
curl -X POST "$BASE_URL/api/graphql" \
  -H "Content-Type: application/json" \
  -H "x-user-id: <seeded-admin-user-id>" \
  -d '{
    "query": "query { matters { id referenceNumber title jobs { id status } } }"
  }'
```

## Example mutation
```bash
curl -X POST "$BASE_URL/api/graphql" \
  -H "Content-Type: application/json" \
  -H "x-user-id: <seeded-admin-user-id>" \
  -d '{
    "query": "mutation($input: CreateJobInput!) { createJob(input: $input) { id status scheduledStart } }",
    "variables": {
      "input": {
        "matterId": "<matter-id>",
        "scheduledStart": "2026-03-28T15:00:00.000Z",
        "location": "Remote"
      }
    }
  }'
```

## Supported operations
- Query
  - `matters`
  - `jobs`
  - `records(matterId)`
- Mutation
  - `createMatter(input)`
  - `createJob(input)`
  - `summarizeMatter(matterId, prompt)`

This GraphQL API is intentionally scoped for demo speed and can coexist with REST APIs for a hybrid architecture narrative.
