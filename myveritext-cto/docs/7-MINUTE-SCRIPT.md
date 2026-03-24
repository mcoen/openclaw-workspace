# 7-Minute Demo Script (Verbatim-Friendly)

## 0:00–0:30 — Opening
“Thanks for the time. I rebuilt this as a matter-centric platform that demonstrates how I lead at both product and platform levels: UX, reliability, AI, compliance, and architecture.”

## 0:30–1:30 — Scheduling workflow
- Show `GET /api/matters`
- Create proceeding via `POST /api/jobs`
- Update status via `PATCH /api/jobs/:id/status`

Say:
“Scheduling is modeled with explicit status transitions and role-gated writes. That gives us predictable operations and cleaner auditability.”

## 1:30–2:30 — Records + upload architecture
- Show `POST /api/records/upload-url`
- Explain signed URL pattern and object key strategy
- Show `POST /api/records`

Say:
“We separate metadata from binary storage. That’s important for retention policy, legal hold controls, and secure lifecycle management.”

## 2:30–3:45 — Search + AI
- `GET /api/search?q=deposition`
- `POST /api/ai/summary` with matter id

Say:
“Search is keyword-first with a planned vector upgrade path. AI summaries are citation-oriented and confidence-tagged, so legal teams can verify outputs fast.”

## 3:45–4:45 — GraphQL
- `POST /api/graphql` query matters/jobs
- Optional `createJob` mutation

Say:
“I kept REST for operational paths and added GraphQL for cross-entity product queries. This hybrid gives strong contracts and flexibility without forcing one style everywhere.”

## 4:45–5:45 — Compliance and reliability
- Mention matter-scoped RBAC + audit trail
- Mention idempotent workflow orientation, Cloud Run deploy pattern, and smoke scripts

Say:
“Reliability and compliance are not post-launch cleanup here. They’re embedded in the request path and data model.”

## 5:45–7:00 — CTO close
“Technically, this proves speed without architectural debt. From a leadership standpoint, my 30/60/90 focus is production auth, ingestion hardening, retrieval quality, and SOC2-ready operational maturity.”

End:
“If useful, I can walk through exactly how I’d staff and sequence this roadmap to hit measurable outcomes by quarter.”
