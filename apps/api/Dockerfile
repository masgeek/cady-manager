# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /repo

RUN corepack enable

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/config/package.json      packages/config/
COPY packages/db/package.json          packages/db/
COPY packages/shared-api/package.json  packages/shared-api/
COPY apps/api/package.json             apps/api/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/api/ apps/api/

# tsup bundles @caddy-manager/* inline
RUN pnpm --filter @caddy-manager/api build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /repo

RUN corepack enable

# Install production dependencies only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/config/package.json      packages/config/
COPY packages/db/package.json          packages/db/
COPY packages/shared-api/package.json  packages/shared-api/
COPY apps/api/package.json             apps/api/

RUN pnpm install --prod --frozen-lockfile

# Copy the bundled API output
COPY --from=builder /repo/apps/api/dist apps/api/dist/

EXPOSE 3500
CMD ["node", "apps/api/dist/index.js"]
