# Deployment Plan — NextLevel

This document outlines a complete, production-ready deployment plan for the NextLevel project after separating the code into `frontend/` (Next.js) and `backend-spring/` (Spring Boot). It covers architecture options, CI/CD, environment variables, secrets, monitoring, scaling, and rollback.

## Goals
- Deploy frontend on Vercel for fast global CDN delivery.
- Deploy Spring Boot backend as a containerized service (recommended) or as a platform/runtime service.
- Use MongoDB Atlas for production database and Atlas Vector Search for embeddings search.
- Securely store API keys and secrets in a secrets manager.
- Provide automated CI/CD with build, test, and deployment, with safe rollbacks.

---

## Architecture (recommended)
- Frontend: Vercel (Next.js) — serverless or Edge functions for SSR if needed.
- Backend: Containerized Spring Boot app (JAR in Docker). Deploy to: Render / Azure App Service / AWS Fargate / DigitalOcean App Platform. For horizontal scaling and more control, use Kubernetes (AKS/EKS/GKE) with a container registry.
- Database: MongoDB Atlas (dedicated cluster, replica set), with a single production database named `nextlevel`.
- Embeddings & AI: Google Gemini (or other LLM provider). Store key in secrets manager.
- Background jobs: Either use a separate worker (container) that listens to Redis/Queue (e.g., BullMQ, RQ, or RabbitMQ), or use a managed job runner (Azure Functions / Cloud Run jobs / Render Cron workers).

---

## Infrastructure & Components
1. MongoDB Atlas
   - Cluster: M10+ for production (depending on traffic and Vector Search requirements).
   - Create `nextlevel` DB and `users`, `captures`, `files`, `results`, etc. collections.
   - Create a project user with least-privilege credentials and IP access restrictions.
   - Enable Atlas Vector Search and create an embeddings index on the collection used for semantic search.

2. Container Registry
   - Use GitHub Container Registry, Docker Hub, or Azure Container Registry.
   - Build images from `backend-spring/Dockerfile` and tag: `ghcr.io/<org>/nextlevel-backend:sha-<sha>`.

3. Backend Service
   - Provision target platform (Render, Azure App Service, AWS Fargate, or Kubernetes). Provide environment variables (see below) and link to the container registry.
   - Health check endpoint: `GET /actuator/health` or `GET /api/health`.
   - Configure autoscaling rules (min instances = 1, scale up based on CPU/RPS). Use readiness and liveness probes.

4. Frontend Service
   - Deploy `frontend/` to Vercel (connect repo and point to `frontend/` root for builds).
   - Set `NEXT_PUBLIC_API_BASE_URL` to the backend public URL.
   - Configure environment variables in Vercel dashboard for `NEXTAUTH_URL`, `AUTH_SECRET` (if used), and Gemini keys if frontend needs them (prefer backend-only keys).

5. Background/Worker
   - If using a durable queue, deploy a worker service container that subscribes to the queue and processes capture analysis asynchronously.
   - For simple deployments, keep the Spring Boot in-process async worker but run one dedicated worker instance to avoid duplicated processing across frontend instances.

---

## Environment Variables (minimum)
- `MONGODB_URI` — MongoDB Atlas connection string (use a secrets manager / platform secrets)
- `APP_PORT` — backend port (default 8080)
- `APP_JWT_SECRET` — 32+ byte secret for JWT signing
- `GEMINI_API_KEY` — provider API key (if using Gemini embedding/LLM)
- `SENTRY_DSN` (optional) — error monitoring
- `LOG_LEVEL` — e.g., `INFO` or `DEBUG` for staging
- `SPRING_PROFILES_ACTIVE` — set `prod` for production settings

Secrets must never be committed to the repo. Use platform or GitHub Secrets.

---

## CI/CD (GitHub Actions example)
1. Frontend pipeline (`.github/workflows/frontend.yml`)
   - Trigger: `push` to `main` or PR to `main`.
   - Steps: `checkout`, `setup-node`, `install`, `test`, `build`, `vercel/action` or `vercel` CLI deploy.
   - Set `VERCEL_TOKEN` and `VERCEL_ORG_ID` as secrets.

2. Backend pipeline (`.github/workflows/backend.yml`)
   - Trigger: push to `main` or PR.
   - Steps: `checkout`, `setup-java` (Java 21), `mvn -DskipTests package`, `docker build` -> push to registry, `deploy` to platform using CLI or API.
   - Use `DOCKER_REGISTRY`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` secrets.

3. Release strategy
   - Use branch protection on `main`.
   - Require passing CI, 1+ approving review, and security checks.

---

## Database Migration & Backups
- Take a full backup (Atlas snapshot or `mongodump`) before any destructive operation.
- For schema changes, use a migration tool (Liquibase or custom scripts) versioned in repo.
- Before deleting any `users` data, create a dump: `mongodump --uri="$MONGODB_URI" --db=nextlevel --collection=users --out=backups/users-YYYYMMDD`.

---

## Security & Secrets
- Use least-privilege DB users.
- Use HTTPS for all public endpoints.
- Ensure `APP_JWT_SECRET` is long and rotated periodically.
- Store third-party API keys in platform secrets (Vercel/Render/GCP Secret Manager/Azure Key Vault).
- Configure CORS to only allow the frontend domain.

---

## Observability
- Attach Sentry for error tracking.
- Use Prometheus + Grafana or the platform's metrics to monitor CPU, memory, response times, and request rates.
- Log in structured JSON; ship logs to a centralized platform (Papertrail, Datadog, Azure Monitor).

---

## Rollback & Canary Strategy
- Keep at least 2 prior deploy artifacts in the registry for fast rollback.
- Use canary releases (10% traffic) if supported by platform; monitor error rate for 10–15 minutes.
- Automate rollback on key threshold breaches (error rate, latency).

---

## DNS, TLS, and Domain
- Configure DNS with a CNAME/A record to the hosting platform.
- Use built-in TLS from Vercel/Render or provision via Let's Encrypt.

---

## Step-by-step Quick Run (minimum viable)
1. Create a MongoDB Atlas project and database `nextlevel`.
2. Configure GitHub repo secrets: `MONGODB_URI`, `APP_JWT_SECRET`, `GEMINI_API_KEY`, `DOCKER_...`.
3. Create GitHub Actions workflows for backend and frontend.
4. Configure Vercel to build from `frontend/` folder.
5. Configure backend service (Render or Azure) to pull the image from registry and set environment variables.

---

## Example Commands
- Build backend image locally:

```bash
cd backend-spring
mvn -DskipTests package
docker build -t ghcr.io/<org>/nextlevel-backend:latest .
docker push ghcr.io/<org>/nextlevel-backend:latest
```

- Deploy frontend to Vercel (local):

```bash
cd frontend
vercel --prod
```

- Backup users collection:

```bash
mongodump --uri="$MONGODB_URI" --db=nextlevel --collection=users --out=backups/users-$(date +%F)
```

---

## Notes & Next Steps
- Decide where to host the backend (Render / Azure / AWS). I can scaffold GitHub Actions workflows and a `Dockerfile` for `backend-spring` if you want.
- I strongly recommend keeping a dedicated worker or queue for durable background processing (Redis + separate worker container or a managed queue).

If you want, I can now:
- (A) Create GitHub Actions workflows for backend and frontend.
- (B) Add a `Dockerfile` to `backend-spring/` and a sample `render.yaml` or `azure` deploy config.
- (C) Backup and delete `users` collection (I will run `mongodump` before deletion). Please confirm which action to take next.
