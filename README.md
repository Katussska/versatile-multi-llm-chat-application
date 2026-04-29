# Cognify

Multi-model AI chat application — NestJS backend + React frontend as a pnpm monorepo.

## Contents

- [Project Goals](#project-goals)
- [Tech Stack](#tech-stack)
- [Current State](#current-state)
- [Repo Structure](#repo-structure)
- [Quick Setup (for testing)](#quick-setup-for-testing)
- [Running the Project](#running-the-project)
- [Useful Commands](#useful-commands)
- [API & OpenAPI](#api--openapi)
- [Data Model](#data-model)
- [License](#license)

---

## Project Goals

Cognify aims to be a comfortable environment for working with multiple LLM models in one place, with conversation history, branching, user profiles, and admin controls.

Planned features:

- multi-LLM chat with model switching
- conversation branching and history navigation
- group chat (multiple users in one conversation)
- user auth and profile management
- admin panel with usage monitoring and limits
- robust backend API for further client development

---

## Tech Stack

### Frontend

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- React Router 6
- TanStack Query
- Better Auth + @daveyplate/better-auth-tanstack
- React Hook Form + Zod
- i18next (Czech / English)
- openapi-fetch + openapi-react-query

### Backend

- NestJS 11 + TypeScript
- MikroORM 7 + PostgreSQL 16
- Better Auth (session-based, mounted at `/api/auth/*`)
- Google Generative AI (Gemini)
- Anthropic SDK (Claude)
- OpenAI SDK (ChatGPT)
- Swagger / OpenAPI

### Tooling

- pnpm workspaces
- Docker Compose (local PostgreSQL)
- ESLint + Prettier
- Jest

---

## Current State

What is implemented end-to-end:

- full auth flow: register, login, session management (Better Auth)
- sidebar with chat list and new chat creation
- chat history: list, create, rename, soft delete (with confirmation)
- message actions: copy, regenerate — any assistant message can be regenerated using the currently selected model, even if the original response came from a different provider (e.g. regenerate a Gemini reply with Claude)
- real-time streaming chat via SSE (`POST /chats/:id/stream`) — response streams word-by-word with animated rendering
- stop-streaming button to abort an in-flight response
- user message saved to DB before streaming; assistant reply saved after stream completes
- per-session chat history (context preserved within a session)
- auto-scroll to latest message during streaming
- markdown rendering of AI responses
- model selector UI with per-provider model variants
- per-message model icon displayed in chat
- dark/light theme switching
- profile page: update display name, read-only email, change password (with live validation rules), language switcher (CS/EN)
- cost/budget overview on profile page (total spending, reset date)
- Czech/English localization (i18next)
- admin panel (`/admin`, accessible to admin users only):
  - KPI cards: total users, active users, most-used model
  - activity chart — daily message count, selectable period (1 day / 1 week / 2 weeks / 1 month)
  - cost charts — spending by provider and model
  - user management: create, edit (email / password / admin role), delete
  - budget management: set per-user dollar limit with a reset date
  - admin stats filterable by provider and model
- per-user **dollar budget** limit enforced at stream time (HTTP 429 when exceeded, auto-reset after reset date); cost computed from `ModelPricing`; one global limit per user regardless of provider
- per-message cost recorded in `UsageLog.cost` (USD) using provider-specific pricing
- admin role enforced via `RolesGuard` on both `AdminController` and `UserController` admin endpoints
- admin API endpoints: `/admin/users`, `/admin/stats`; user management also accessible via `/users/*` (CRUD, budget management); message versioning via `PATCH /chats/:chatId/messages/:messageId/activate`
- automated data cleanup (`CleanupModule`): runs nightly at midnight — hard-deletes soft-deleted chats and users after 30 days, purges `UsageLog` entries older than 90 days
- **message versioning**: regenerated responses are kept as inactive versions instead of being deleted; prev/next navigation between versions is shown directly below each assistant message

Currently supported LLM providers:

- **Gemini** (Google) — fully integrated; available models: `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`
- **Claude** (Anthropic) — fully integrated; available models: `claude-haiku-4-5-20251001`, `claude-sonnet-4-5`, `claude-opus-4-7`
- **ChatGPT** (OpenAI) — fully integrated; available models: `gpt-5.4-nano`, `gpt-5.4-mini`, `gpt-5.4`, `gpt-5.5`

All models are registered in the database via `db:seed` along with their pricing data. The active model is selected per-message in the UI — no env var required.

Work in progress / placeholders:

- conversation branching (not yet implemented)
- group chat (not yet implemented)

---

## Repo Structure

```text
.
├── backend/          NestJS API, entities, migrations, Gemini integration
├── frontend/         React app, components, routes, generated API client
├── docker-compose.yml
└── package.json
```

---

## Quick Setup (for testing)

### Prerequisites

- Node.js 24+
- pnpm 10+
- Docker + Docker Compose

Install pnpm via Corepack if needed:

```bash
corepack enable
corepack prepare pnpm@10.27.0 --activate
```

### Step 1 — Install dependencies

```bash
pnpm install
```

### Step 2 — Start PostgreSQL

```bash
docker compose up -d db
```

Database runs at `localhost:5432`:

| Key      | Value      |
|----------|------------|
| database | `cognify`  |
| user     | `postgres` |
| password | `postgres` |

### Step 3 — Configure backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in at least these values (everything else works out of the box for local dev):

```env
# Generate a strong secret: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-here

# Get a free API key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key

# Get an API key at https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key

# Get an API key at https://platform.openai.com/api-keys
OPENAI_API_KEY=your-openai-api-key
```

Models available in chat are seeded automatically via `db:seed`. Each provider's models are registered in the database along with their pricing data (`ModelPricing`). No model env var is required — the active model is selected per-message in the UI.

Full default `.env` for reference:

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

ANTHROPIC_API_KEY=replace-with-api-key

OPENAI_API_KEY=replace-with-api-key

DB_RESET_CONFIRM=false
DB_RESET_ALLOW_NON_DEVELOPMENT=false
DB_BOOTSTRAP_ON_EMPTY=true
DB_SEED_ON_EMPTY=true
```

### Step 4 — First-run database bootstrap (automatic)

When the backend starts against a fresh/empty database, it automatically:

- applies all pending MikroORM migrations
- runs the default seeders (`DatabaseSeeder`)

This bootstrap is skipped when the database is already initialized.

You can still run migrations manually if needed:

```bash
pnpm be db:migration:up
```

You can disable first-run automation in `backend/.env`:

```env
DB_BOOTSTRAP_ON_EMPTY=false
DB_SEED_ON_EMPTY=false
```

### Step 5 — Configure frontend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Step 6 — Seed a test account (optional)

```bash
pnpm be db:seed
```

This creates a ready-to-use account:

| Field    | Value                |
|----------|----------------------|
| Email    | `test@cognify.local` |
| Password | `Test123456!`        |

You can override the defaults via env vars in `backend/.env`:

```env
SEED_TEST_USER_EMAIL=you@example.com
SEED_TEST_USER_PASSWORD=YourPassword123!
SEED_TEST_USER_NAME=Your Name
```

Running the seeder again is safe — it updates the existing user instead of creating a duplicate.

### Step 7 — Start the app

```bash
pnpm dev
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/api/docs>

Log in at <http://localhost:5173/login> with the credentials from Step 6 and start chatting.

---

## Running the Project

| Command          | What it does                          |
|------------------|---------------------------------------|
| `pnpm dev`       | Backend + frontend concurrently       |
| `pnpm be dev`    | Backend only (NestJS watch mode)      |
| `pnpm fe dev`    | Frontend only (Vite, port 5173)       |
| `pnpm build`     | Build both packages                   |

> If `PORT_FALLBACK=false` (default), the backend will error on port conflict. Set `PORT_FALLBACK=true` to auto-pick the next free port.

---

## Docker Deployment (Single Image)

The repository now contains a multi-stage Docker build in `Dockerfile` that:

- builds frontend (`frontend/dist`)
- builds backend (`backend/dist`)
- copies frontend build into backend static assets
- serves both frontend and API from one container (`:3000`)

Build locally:

```bash
docker build -f Dockerfile -t cognify:local .
```

Run locally:

```bash
docker run --rm -p 3000:3000 --env-file backend/.env -e HOST=0.0.0.0 cognify:local
```

When serving frontend and backend from the same host, set these to the same public URL in production:

```env
BETTER_AUTH_URL=https://your-domain.example
FRONTEND_ORIGIN=https://your-domain.example
```

`FRONTEND_ORIGIN` also supports comma-separated values for multi-origin deployments.

---

## Useful Commands

### Database

```bash
pnpm be db:migration:up      # Apply pending migrations
pnpm be db:migration:create  # Generate migration from entity diff
pnpm be db:migration:down    # Rollback last migration
pnpm be db:reset             # Drop and re-run all migrations (dev only)
pnpm be db:seed              # Seed data
```

### OpenAPI sync (run after backend contract changes)

```bash
pnpm --filter @cognify/backend exec ts-node src/export-openapi.ts ../frontend/openapi.json
pnpm fe openapi:types
```

Step 1 exports the schema to `frontend/openapi.json`, step 2 regenerates TypeScript types in `frontend/src/api/generated/schema.d.ts`. The backend does not need to be running for this.

### Tests

```bash
pnpm be test          # Unit tests
pnpm be test:e2e      # E2E tests
pnpm be test:cov      # Coverage
```

### Lint & type check

```bash
pnpm be lint          # Backend ESLint (auto-fix)
pnpm be format        # Backend Prettier
pnpm fe lint          # Frontend ESLint
pnpm fe typecheck     # Frontend TypeScript check
```

---

## API & OpenAPI

- Swagger UI (dev only): <http://localhost:3000/api/docs>
- OpenAPI JSON export: `frontend/openapi.json`
- CORS is controlled by `FRONTEND_ORIGIN` in `backend/.env` (default: `http://localhost:5173`)

---

## Data Model

Entities managed by MikroORM and stored in PostgreSQL:

| Entity | Purpose |
| ------ | ------- |
| `User` | App users; `role` (USER/ADMIN) |
| `Chat` | Conversations (soft delete supported) |
| `Message` | Individual messages; `path` (user/model), `parentMessageId` (tree structure), `versionGroupId` + `isActive` (versioning) |
| `Model` | Available LLM models; references `ModelPricing` for cost calculation |
| `ModelPricing` | Per-model pricing: `inputPrice`, `outputPrice`, optional `thinkingOutputPrice`, `inputPriceLongCtx`, `outputPriceLongCtx` |
| `Token` | Per-user **dollar budget**: `dollarLimit`, `usedDollars`, `resetAt`; one record per user |
| `UsageLog` | Per-message token log: `promptTokens`, `completionTokens`, `cost` (USD) |
| `Session` | Better Auth sessions |
| `Account` | Better Auth OAuth accounts |
| `Verification` | Better Auth email verification |

---

## License

This project is part of a bachelor's thesis at FEI VSB-TUO.

Licensed under MIT — see `LICENSE`.
