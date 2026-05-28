# Spring Boot Migration Plan

## Goal
Migrate NextLevel backend from Next.js API routes to Spring Boot with endpoint parity, keeping the current frontend functional during cutover.

## Current Status
- Branch: `tech/spring-boot`
- Spring module created: `backend-spring`
- First migrated APIs: auth, profile, captures

## Deployment Strategy
- Frontend: keep on Vercel
- Backend: deploy Spring Boot separately (Render/Railway/Azure App Service/Fly)
- Frontend points to backend via `NEXT_PUBLIC_API_BASE_URL`

## Phase Plan

### Phase 1: Foundation (Done)
- Create Spring Boot project
- Configure MongoDB and JWT security
- Implement core auth flow
- Implement first high-traffic domain (`captures`)

### Phase 2: Core Study Domains
- Exams
- Questions
- Results
- Stats

### Phase 3: Productivity Domains
- Planner
- Links
- Files
- Applications

### Phase 4: AI and Async Domains
- `captures/analyze`
- semantic search
- analytics
- Inngest workflow replacement (queue/worker)

### Phase 5: Frontend Cutover and Deletion
- Switch all frontend API calls to Spring backend
- Remove deprecated Next.js API routes once parity tests pass

## Endpoint Migration Checklist

### Completed
- `[x]` `POST /api/auth/register`
- `[x]` `POST /api/auth/login` (replacement for NextAuth credentials)
- `[x]` `GET /api/user/profile`
- `[x]` `PUT /api/user/profile`
- `[x]` `GET /api/captures`
- `[x]` `POST /api/captures`
- `[x]` `GET /api/captures/{id}`
- `[x]` `PATCH /api/captures/{id}`
- `[x]` `DELETE /api/captures/{id}`
- `[x]` `GET /api/results`
- `[x]` `POST /api/results`
- `[x]` `GET /api/results/{id}`
- `[x]` `/api/analytics`
- `[x]` `/api/applications` (+ `/{id}`)
- `[x]` `/api/exams` (+ `/{id}`)
- `[x]` `/api/files` (+ `/{id}`)
- `[x]` `/api/import`
- `[x]` `/api/inngest` (placeholder compatibility endpoint)
- `[x]` `/api/links` (+ `/{id}`)
- `[x]` `/api/planner` (+ `/{id}`)
- `[x]` `/api/questions` (+ `/{id}`)
- `[x]` `/api/roadmaps` (+ `/{id}`)
- `[x]` `/api/search/semantic`
- `[x]` `/api/stats`
- `[x]` `/api/captures/upload`
- `[x]` `/api/captures/analyze`
- `[x]` `/api/captures/reminders`

### Pending
- `[x]` Replace placeholder AI analysis in `/api/captures/analyze` and `/api/captures/upload` with Gemini service parity.
- `[x]` Replace keyword fallback in `/api/search/semantic` with Atlas Vector Search + embedding parity.
- `[ ]` Replace `/api/inngest` compatibility placeholder with a durable queue/worker implementation if production orchestration is required.

## Acceptance Criteria per Endpoint
- Same request/response shape as current frontend expects
- Same auth behavior and HTTP status semantics
- Mongo data compatibility with existing documents
- Added integration test covering happy path + unauthorized + invalid payload

## Risk Register
- NextAuth to JWT migration needs frontend session changes
- Inngest route requires background processing redesign
- Semantic search route depends on vector search and embeddings parity

## Immediate Next Slice
1. Migrate `results` routes + repository methods.
2. Migrate `exams` and `questions` routes.
3. Introduce Spring integration tests for auth/captures/profile.
4. Add frontend API base URL switch and begin traffic shadow testing.
