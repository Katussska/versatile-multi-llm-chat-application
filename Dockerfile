FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_BASE_URL
COPY backend backend
COPY frontend frontend
RUN pnpm --filter @cognify/frontend build
RUN pnpm --filter @cognify/backend build

FROM base AS prod-deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile --prod --filter @cognify/backend

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=prod-deps /app /app
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=build /app/frontend/dist /app/backend/dist/public

WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
