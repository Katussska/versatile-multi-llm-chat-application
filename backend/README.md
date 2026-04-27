# Cognify Backend

NestJS backend with MikroORM (PostgreSQL) and Better Auth integration.

## Requirements

- Node.js 24+
- pnpm 9+
- PostgreSQL running locally (default: `localhost:5432`)

## Quick Start

1. Install dependencies at repository root:

```bash
pnpm install
```

2. Copy backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Ensure PostgreSQL is running and apply database migrations:

```bash
pnpm --filter @cognify/backend db:migration:up
```

4. Start backend in watch mode:

```bash
pnpm --filter @cognify/backend dev
```

Backend defaults to `http://localhost:3000`.

## Better Auth Setup

Better Auth core tables are defined as MikroORM entities and are migrated together with the rest of the backend schema.

Better Auth endpoints are mounted under:

- `/api/auth/*`

Example session endpoint:

- `GET /api/auth/get-session`

Important runtime settings:

- Nest app is started with `bodyParser: false` in `src/main.ts`
- Better Auth is mounted via `AuthModule` in `src/app.module.ts`
- CORS uses `FRONTEND_ORIGIN` (default `http://localhost:5173`)

## Environment Variables

Core variables (`backend/.env.example`):

```env
PORT=3000
HOST=localhost
PORT_FALLBACK=false
FRONTEND_ORIGIN=http://localhost:5173

MIKRO_ORM_TYPE=postgresql
MIKRO_ORM_HOST=localhost
MIKRO_ORM_PORT=5432
MIKRO_ORM_DB_NAME=cognify
MIKRO_ORM_USER=postgres
MIKRO_ORM_PASSWORD=postgres

BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-strong-secret-at-least-32-characters
GEMINI_API_KEY=replace-with-api-key
GEMINI_MODEL=gemini-2.5-flash

DB_RESET_CONFIRM=false
DB_RESET_ALLOW_NON_DEVELOPMENT=false
```

Notes:

- `BETTER_AUTH_SECRET` must be at least 32 characters in production.

## Scripts

From repository root:

```bash
pnpm --filter @cognify/backend dev
pnpm --filter @cognify/backend build
pnpm --filter @cognify/backend test
pnpm --filter @cognify/backend test:e2e
```

Database helpers:

```bash
# Apply all pending migrations.
pnpm --filter @cognify/backend db:migration:up

# Create a new migration from entity schema diff (and print generated SQL).
pnpm --filter @cognify/backend db:migration:create

# Roll back the latest executed migration.
pnpm --filter @cognify/backend db:migration:down

# List executed and pending migrations.
pnpm --filter @cognify/backend db:migration:list

# Seed the database with test data.
pnpm --filter @cognify/backend db:seed
```

Database reset (development-safe):

```bash
pnpm --filter @cognify/backend db:reset
```

## OpenAPI

- Runtime Swagger UI (non-production by default): `http://localhost:3000/api`
- Runtime JSON: `http://localhost:3000/api-json`

Export OpenAPI for frontend (two steps, backend need not be running):

```bash
# 1. Export schema to frontend/openapi.json
pnpm --filter @cognify/backend exec ts-node src/export-openapi.ts ../frontend/openapi.json

# 2. Regenerate TypeScript types in frontend/src/api/generated/schema.d.ts
pnpm --filter @cognify/frontend openapi:types
```

## Troubleshooting

- If `db:migrate` fails with connection errors, verify PostgreSQL host/port and credentials in `backend/.env`.
- If backend fails on secret in production, set a strong `BETTER_AUTH_SECRET`.
- If port 3000 is occupied and fallback is disabled, set `PORT_FALLBACK=true` or change `PORT`.
