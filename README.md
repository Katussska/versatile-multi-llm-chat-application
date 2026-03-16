# Cognify

## MVP pro chat aplikaci s více modely

Cognify je monorepo aplikace rozdělená na frontend a backend. Aktuální verze projektu je postavená na vlastním backendu v NestJS a na React frontend aplikaci. Repo dnes obsahuje hlavně základ MVP: chat layout, výběr modelu, strom konverzace, lokální API klient generovaný z OpenAPI a připravený datový model pro další rozvoj.

## Obsah

- [Cíle projektu (finální vize)](#cíle-projektu-finální-vize)
- [Použité technologie](#použité-technologie)
- [Aktuální stav MVP](#aktuální-stav-mvp)
- [Struktura repozitáře](#struktura-repozitáře)
- [Požadavky](#požadavky)
- [Instalace a setup](#instalace-a-setup)
- [Spuštění projektu](#spuštění-projektu)
- [Užitečné commandy](#užitečné-commandy)
- [API a OpenAPI](#api-a-openapi)
- [Datový model](#datový-model)
- [Licence](#licence)

## Cíle projektu (finální vize)

Cílem finální verze Cognify je nabídnout aplikaci, kde uživatelé mohou pohodlně pracovat s více LLM modely v jednom prostředí, sdílet konverzace a mít dobrou kontrolu nad historií, profilem i limity použití.

Plánovaná cílová funkcionalita:

- multi-LLM chat s možností přepínat modely
- větší podpora větvení konverzací a orientace v historii
- group chat scénáře (více uživatelů v jedné konverzaci)
- autentizace a správa uživatelských profilů
- admin funkce pro monitoring a limity spotřeby
- robustní backend API pro další rozvoj klienta

## Použité technologie

### Frontend

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui a Radix UI
- React Router
- TanStack Query
- better-auth
- @daveyplate/better-auth-tanstack
- React Hook Form + Zod
- i18next
- openapi-fetch + openapi-react-query

### Backend

- NestJS 11
- TypeScript
- MikroORM 7
- PostgreSQL 16
- Swagger / OpenAPI

### Tooling

- pnpm workspaces
- Docker Compose pro lokální PostgreSQL
- ESLint
- Prettier
- Jest

## Aktuální stav MVP

V repozitáři je momentálně hotové nebo připravené hlavně toto:

- chat rozložení aplikace se sidebarem, vstupem zprávy a obsahem konverzace
- výběr modelu v UI
- zobrazení a přepínání panelu se stromem konverzace
- základ témování a přepínání vzhledu
- lokalizace pro češtinu a angličtinu
- backend v NestJS s OpenAPI dokumentací
- export OpenAPI schématu do frontendu a generování TypeScript typů
- základní entitní model pro `User`, `Chat`, `Message`, `Model` a `Token`
- příprava rout pro přihlášení a profil
- připravený React Query auth wiring (`AuthQueryProvider`, `createAuthClient`, `createAuthHooks`)
- smoke test `useSession` na route `/profile`

Některé části jsou zatím jen scaffold nebo placeholder a nejsou dokončené end-to-end:

- Better Auth je napojený na backend (`/api/auth/*`) a připravený pro FE integraci
- profilová stránka je zatím jen základní placeholder
- admin panel zatím není implementovaný
- group chat workflow zatím není implementovaný
- reálné napojení na LLM providery a perzistence chatu ještě není dodělaná v produkční podobě

README odlišuje finální vizi od skutečného stavu MVP, aby bylo jasné, co je už implementované a co je ještě plán.

## Struktura repozitáře

```text
.
|- backend/    NestJS API, OpenAPI export, MikroORM, testy
|- frontend/   React aplikace ve Vite, komponenty, routy, generovaný API klient
|- docker-compose.yml
|- package.json
```

## Požadavky

- Node.js 20+
- pnpm 10+
- Docker + Docker Compose

Pokud nemáte `pnpm`, doporučená instalace je přes Corepack:

```bash
corepack enable
corepack prepare pnpm@10.27.0 --activate
```

## Instalace a setup

### 1. Instalace závislostí

```bash
pnpm install
```

### 2. Spuštění PostgreSQL

```bash
docker compose up -d db
```

Databáze poběží lokálně na `localhost:5432` s těmito hodnotami:

- database: `cognify`
- user: `postgres`
- password: `postgres`

### 3. Nastavení backendu

Zkopírujte env soubor:

```bash
cp backend/.env.example backend/.env
```

Výchozí obsah odpovídá lokálnímu Docker PostgreSQL setupu:

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
```

Po nastavení `.env` vytvořte Better Auth tabulky v DB:

```bash
pnpm --filter @cognify/backend auth:migrate
```

Poznámka k portu backendu:

- `pnpm dev` spouští backend s `NODE_ENV=development`
- pokud chcete, aby backend při obsazeném portu automaticky přešel na další volný port, nastavte `PORT_FALLBACK=true` nebo proměnnou z `backend/.env` odeberte
- pokud necháte `PORT_FALLBACK=false`, backend při konfliktu portu skončí chybou

### 4. Nastavení frontendu

Vytvořte soubor `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Frontend tuto proměnnou vyžaduje explicitně. Pokud backend v lokálním vývoji poběží na jiném portu, aktualizujte i `VITE_API_URL`.

Poznámka k Better Auth:

- frontend je připravený na TanStack Query auth hooky
- backend vystavuje Better Auth endpointy na `/api/auth/*`
- FE auth klient (`createAuthClient`) komunikuje s backendem přes `VITE_API_URL`

### 5. Co se instaluje

Po `pnpm install` se nainstalují všechny balíčky ze všech workspace částí:

- root tooling a workspace skripty
- backend dependencies (`@nestjs/*`, `@mikro-orm/*`, `jest`, `eslint`...)
- frontend dependencies (`react`, `vite`, `tailwindcss`, `radix`, `zod`...)

Není potřeba instalovat balíčky ručně po jednotlivých složkách.

## Spuštění projektu

### Vývojový režim celého monorepa

```bash
pnpm dev
```

Tím se paralelně spustí:

- backend na `http://localhost:3000`
- frontend na `http://localhost:5173`

### Spuštění jen backendu

```bash
pnpm be dev
```

### Spuštění jen frontendu

```bash
pnpm fe dev
```

## Užitečné commandy

### Build celého projektu

```bash
pnpm build
```

### Synchronizace OpenAPI a frontend typů

```bash
pnpm openapi:sync
```

Tento command:

1. vyexportuje OpenAPI schéma z backendu do `frontend/openapi.json`
2. vygeneruje TypeScript typy do `frontend/src/api/generated/schema.d.ts`

Backend kvůli tomu nemusí běžet.

### Reset databáze

```bash
pnpm db:reset
```

Reset je chráněný bezpečnostními proměnnými a je určený hlavně pro lokální development.

### Better Auth migrace

```bash
pnpm --filter @cognify/backend auth:migrate
```

Vytvoří (nebo doplní) tabulky potřebné pro Better Auth v PostgreSQL.

### Backend testy

```bash
pnpm --filter @cognify/backend test
pnpm --filter @cognify/backend test:e2e
```

### Frontend kontrola

```bash
pnpm --filter @cognify/frontend lint
pnpm --filter @cognify/frontend typecheck
```

## API a OpenAPI

- Swagger UI je v developmentu dostupné na `http://localhost:3000/api`
- runtime OpenAPI je standardně zapnuté mimo production
- export schématu pro frontend řeší skript `pnpm openapi:sync`
- backend má povolené CORS pro `FRONTEND_ORIGIN` (default `http://localhost:5173`)

## Datový model

Backend už obsahuje základní entity pro další implementaci aplikace:

- `User`
- `Chat`
- `Message`
- `Model`
- `Token`

Tyto entity jsou spravované přes MikroORM a ukládají se do PostgreSQL.

## Licence

Projekt je součástí bakalářské práce na Fakultě informatiky a elektroniky VSB-TUO.

Licence je MIT, viz soubor `LICENSE`.
