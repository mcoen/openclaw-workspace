# MyVeritext 2.0 – Architecture (CTO Demo)

## Goals
- Better UX for legal workflow operations
- Higher reliability and operational clarity
- Practical AI capabilities with citations and guardrails
- Compliance-ready controls and traceability
- Scalable architecture deployable on GCP quickly

## Stack
- **Web app/API**: Next.js 15 + TypeScript
- **Database**: Cloud SQL (PostgreSQL 16)
- **Vector search**: pgvector extension in Postgres
- **Queue/cache**: Memorystore Redis + BullMQ worker
- **Storage**: Google Cloud Storage (signed URLs)
- **Observability**: OpenTelemetry + Sentry + Cloud Logging
- **Runtime**: Cloud Run (web + worker)
- **CI/CD**: Cloud Build
- **AI**: OpenAI (summaries, extraction, Q&A with citations)

## Domain modules
1. **Identity & Access**
   - Users, orgs, roles, matter-scoped permissions
2. **Scheduling**
   - Jobs (create/edit/cancel), calendar status, reminders
3. **Records**
   - Transcript/exhibit metadata, file versions, signed access
4. **Search**
   - Full-text + semantic retrieval over transcript chunks
5. **AI Services**
   - Proceeding summary, entities/timeline, Q&A with references
6. **Compliance & Audit**
   - Immutable access logs, retention/holds, exportable activity log

## High-level request flow
1. User requests upload or action via app
2. API validates RBAC + writes metadata to Postgres
3. Upload saved to GCS with signed URLs
4. Event enqueued in Redis for async processing
5. Worker chunks/transforms text, stores embeddings
6. Search/AI endpoints retrieve with citation references
7. All sensitive actions recorded in audit trail

## Reliability and security baseline
- Idempotency keys on mutating APIs
- Retry policy with dead-letter queue for background jobs
- Health/readiness endpoints for Cloud Run
- Structured logging with correlation IDs
- Encryption in transit + at rest
- Principle of least privilege for service accounts

## Friday demo boundaries
- Focus on product-critical flows and confidence-inspiring architecture
- Keep AI features explainable and citation-backed
- Avoid over-complex microservices before proving workflow value
