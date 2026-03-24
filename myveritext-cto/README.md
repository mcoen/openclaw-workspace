# MyVeritext 2.0 CTO Demo

Greenfield platform prototype designed for a fast, interview-ready demonstration of technical leadership.

## Focus areas
- UX for legal workflows
- Reliability and operational excellence
- AI assistance with citations
- Compliance and auditability
- Scalable architecture on GCP

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Docs
- `docs/ARCHITECTURE.md`
- `docs/DELIVERY-PLAN.md`
- `docs/GCP-DEPLOY.md`
- `docs/DB-SCHEMA.md` (ER diagram)
- `docs/OBJECT-MODEL.md` (class/object model)
- `docs/API-DEMO.md` (REST endpoint + header usage)
- `docs/GRAPHQL-DEMO.md` (GraphQL endpoint and examples)

## Current implementation status
- ✅ Next.js scaffold
- ✅ Demo landing/control panel
- ✅ Architecture and delivery docs
- ✅ Prisma schema (organizations, matters, jobs, records, memberships, audit)
- ✅ API scaffolding (`/api/matters`, `/api/jobs`, `/api/jobs/:id/status`)
- 🔄 In progress: RBAC enforcement, transcript/exhibit pipelines, AI endpoints
