# NextLevel Spring Backend

This module is the Spring Boot migration target for the existing Next.js API routes.

## Stack
- Java 21
- Spring Boot 3.5
- Spring Security + JWT
- Spring Data MongoDB

## Run
```bash
cd backend-spring
mvn spring-boot:run
```

## Environment Variables
- `MONGODB_URI` : MongoDB connection string
- `JWT_SECRET` : 64+ char HMAC secret for JWT signing
- `JWT_EXPIRATION_MILLIS` : token lifetime (default 30 days)
- `CORS_ALLOWED_ORIGINS` : comma-separated origins (default `http://localhost:3000`)

## Implemented Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `GET /api/captures`
- `POST /api/captures`
- `GET /api/captures/{id}`
- `PATCH /api/captures/{id}`
- `DELETE /api/captures/{id}`
- `GET /api/results`
- `POST /api/results`
- `GET /api/results/{id}`
- `GET|POST|PUT|DELETE /api/exams` and `/api/exams/{id}`
- `GET|POST|DELETE /api/questions` and `GET|PUT|DELETE /api/questions/{id}`
- `GET|POST /api/planner` and `PATCH|DELETE /api/planner/{id}`
- `GET|POST /api/links` and `PATCH|DELETE /api/links/{id}`
- `GET|POST /api/files` and `GET|PATCH|DELETE /api/files/{id}`
- `GET|POST /api/applications` and `PATCH|DELETE /api/applications/{id}`
- `GET|POST /api/roadmaps` and `GET|PATCH|DELETE /api/roadmaps/{id}`
- `GET /api/stats`
- `GET /api/analytics`
- `POST /api/import`
- `GET /api/search/semantic`
- `GET /api/captures/reminders`
- `POST /api/captures/analyze`
- `POST /api/captures/upload`
- `GET|POST|PUT /api/inngest` (compatibility placeholder)

## Remaining Parity Work
- Wire the frontend to the Spring backend base URL and remove any remaining direct Next.js API usage.
- Replace `/api/inngest` compatibility endpoint with a durable external queue/worker if you need production-grade async orchestration.

## Important Deployment Note
Deploy this backend to a Java-native host (Render, Railway, Azure App Service, Fly.io, etc.).
Keep the Next.js frontend on Vercel and call this backend over HTTPS.
