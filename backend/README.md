# Cognify Backend

NestJS backend with MikroORM (PostgreSQL) and Better Auth integration.

## Requirements

- Node.js 22+
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

3. Ensure PostgreSQL is running and create Better Auth schema/tables:

```bash
pnpm --filter @cognify/backend auth:migrate
```

4. Start backend in watch mode:

```bash
pnpm --filter @cognify/backend dev
```

Backend defaults to `http://localhost:3000`.

## Better Auth Setup

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
BETTER_AUTH_SCHEMA=auth
BETTER_AUTH_SECRET=replace-with-a-strong-secret-at-least-32-characters

DB_RESET_CONFIRM=false
DB_RESET_ALLOW_NON_DEVELOPMENT=false
```

Notes:

- `BETTER_AUTH_SECRET` must be at least 32 characters in production.
- `BETTER_AUTH_SCHEMA` defaults to `auth`.
- Better Auth CLI config (`src/auth.config.ts`) loads `backend/.env` automatically.

## Scripts

From repository root:

```bash
pnpm --filter @cognify/backend dev
pnpm --filter @cognify/backend build
pnpm --filter @cognify/backend test
pnpm --filter @cognify/backend test:e2e
```

Better Auth helpers:

```bash
pnpm --filter @cognify/backend auth:prepare-db
pnpm --filter @cognify/backend auth:migrate
pnpm --filter @cognify/backend auth:generate
```

Database reset (development-safe):

```bash
pnpm --filter @cognify/backend db:reset
```

## OpenAPI

- Runtime Swagger UI (non-production by default): `http://localhost:3000/api`
- Runtime JSON: `http://localhost:3000/api-json`

Export OpenAPI for frontend:

```bash
pnpm --filter @cognify/backend openapi:export
```

## Troubleshooting

- If `auth:migrate` fails with connection errors, verify PostgreSQL host/port and credentials in `backend/.env`.
- If backend fails on secret in production, set a strong `BETTER_AUTH_SECRET`.
- If port 3000 is occupied and fallback is disabled, set `PORT_FALLBACK=true` or change `PORT`.
