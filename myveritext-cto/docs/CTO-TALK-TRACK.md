# CTO Interview Talk Track

## 1) Vision (30 sec)
"I designed this as a matter-centric legal operations platform where UX, reliability, AI, and compliance are all system-level concerns—not bolt-ons."

## 2) Why this architecture (60 sec)
- **Next.js on Cloud Run** for rapid feature velocity and easy operationalization.
- **Postgres as system of record** for transactional integrity.
- **Redis queue pattern** for async ingestion and retries.
- **GCS for evidence artifacts** with signed URL workflows.
- **Hybrid REST + GraphQL**:
  - REST for predictable operational workflows (scheduling, upload, status updates)
  - GraphQL for product query flexibility across interconnected entities.

## 3) Reliability stance (45 sec)
- Idempotent mutation design and explicit status transitions.
- Audit logs on sensitive actions.
- Health-check oriented deploy model on Cloud Run.
- Structured baseline for observability and error tracking.

## 4) AI stance (45 sec)
- AI is introduced as an assistive layer with cited outputs.
- Summary pipeline is intentionally auditable and confidence-tagged.
- Architecture supports later evolution to retrieval-augmented QA over transcripts/exhibits.

## 5) Compliance stance (45 sec)
- Matter-scoped RBAC to reduce data leakage risk.
- Immutable action history with entity-level metadata.
- Separation of metadata and blob storage enables retention/legal-hold controls.

## 6) 30/60/90-day leadership plan
### 30 days
- Production auth integration (SSO/IdP)
- Signed URL + malware scanning + ingestion pipeline hardening
- SLO definition and baseline dashboards

### 60 days
- Semantic retrieval over transcript chunks (pgvector/OpenSearch)
- Workflow orchestration for transcript lifecycle
- Policy engine for retention, legal hold, and data exports

### 90 days
- Multi-tenant scale hardening and cost controls
- Advanced AI workflows (timeline extraction, contradiction detection)
- SOC2 readiness package and incident response runbooks

## 7) Close (15 sec)
"This prototype proves we can ship value fast without sacrificing architecture quality. My role as CTO is to institutionalize this pace with strong engineering standards and predictable delivery."
