# Features

## Infrastructure

- [x] Initialize pnpm monorepo with workspace structure
- [x] Add turbo build/dev/lint/typecheck orchestration
- [x] Simplify package.json manifests (main/types→src, remove common scripts, remove exports)

## Backend — Packages

- [x] Create @caddy-manager/shared-types with TypeScript interfaces and const arrays
- [x] Create @caddy-manager/config with env loading, validate(), buildDatabaseUrl()
- [x] Create @caddy-manager/db with Drizzle ORM schema (users/servers/sites/audit_events)
- [x] Add Drizzle Kit migrations (0000_initial, 0001_add_username_column)
- [x] Add repository pattern with Zod schemas for servers, sites, users
- [x] Add database seed scripts (seed, seed-demo, purge, purge-demo)
- [x] Create @caddy-manager/utils with shared utilities

## Backend — API (Fastify)

- [x] Create @caddy-manager/api with Fastify server
- [x] Add health endpoint (US-08)
- [x] Add server CRUD routes (US-01, US-02)
- [x] Add site CRUD routes (US-03, US-04, US-05)
- [x] Add config viewer and reload endpoint (US-06, US-07)
- [x] Add logs endpoint (US-09)
- [x] Add audit trail endpoint (US-10)
- [x] Add Caddy integration provider with config reload, health check, status, logs
- [x] Add JWT auth via `POST /api/auth/login` with configurable credentials (AUTH_USERNAME/AUTH_PASSWORD, JWT_SECRET)
- [x] Add swagger docs, rate limiting, CORS, and sensible error handling
- [x] Fix Fastify schema validation — convert Zod schemas to JSON Schema via zod-to-json-schema
- [x] Separate migrations from API startup — run via dedicated Docker service

## Frontend

- [x] Create @caddy-manager/web (Vite + React + MUI + TanStack Query)
- [x] Create @caddy-manager/ui with shared MUI components
- [x] Create @caddy-manager/shared-api with typed API client
- [x] Add Login page
- [x] Add Dashboard page (server status, site count, health indicators)
- [x] Add Servers page (list, create, edit, delete)
- [x] Add Sites page (list, create, edit, delete)
- [x] Add Configuration viewer page
- [x] Add Logs page
- [x] Add Audit trail page

## Database

- [x] Add username column to users table (schema, migration, types, repository, seeds, config)

## DevOps

- [x] Docker: API Dockerfile (tsup build, production runtime)
- [x] Docker: migrations Dockerfile (drizzle-kit migrate + seed)
- [x] Docker: web Dockerfile (Vite build, Nginx serve) + nginx.conf
- [x] Docker: docker-compose.yml with db, migrate, api, and web services
- [x] Docker: .dockerignore
- [x] GitHub Actions: CI workflow (typecheck, lint, build)
- [x] GitHub Actions: Docker workflow (multi-arch build & push for api/web/migrate)
- [x] Documentation: PRD.md, PLAN.md, FEATURES.md

## Backlog (Phase 2)

- [ ] User management (US-12)
- [ ] Role-based access control (US-13)
- [ ] Configuration history / snapshots (US-14)
- [ ] Configuration rollback (US-15)
- [ ] WebSocket real-time updates (US-16)
- [ ] Server metrics dashboard (US-17)
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Unit test coverage ≥80%
- [ ] Security review
