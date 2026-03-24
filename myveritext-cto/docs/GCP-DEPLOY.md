# GCP Deploy Guide (Cloud Run)

## Services
- Cloud Run: `myveritext-cto-web`
- Cloud Run: `myveritext-cto-worker`
- Cloud SQL (Postgres): `myveritext-cto-pg`
- Memorystore Redis: `myveritext-cto-redis`
- GCS bucket: `myveritext-cto-files`

## Prereqs
- gcloud authenticated
- Billing-enabled GCP project
- Artifact Registry enabled

## Quick start commands
```bash
export PROJECT_ID="Veritext"
export REGION="us-central1"
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com sqladmin.googleapis.com redis.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
```

## Build + deploy web (authenticated)
```bash
cd myveritext-cto

gcloud artifacts repositories create myveritext \
  --repository-format=docker \
  --location="$REGION" \
  --description="MyVeritext CTO demo images" || true

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION="$REGION",_REPO="myveritext"
```

## Demo URL
After deploy:
```bash
gcloud run services describe myveritext-cto-web --region "$REGION" --format='value(status.url)'
```

## Notes
- Keep secrets in Secret Manager.
- For Friday demo, this can run as a single web service with feature flags while worker services are promoted after demo.
