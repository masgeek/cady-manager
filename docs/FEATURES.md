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
- [x] Add JWT auth via `POST /api/auth/login` with database-backed password hashes and configurable JWT signing (`JWT_SECRET`)
- [x] Add swagger docs, rate limiting, CORS, and sensible error handling
- [x] Fix Fastify schema validation — convert Zod schemas to JSON Schema via zod-to-json-schema
- [x] Separate migrations from API startup — run via dedicated Docker service

## Frontend

- [x] Create @caddy-manager/web (Vite + React + Bootstrap + TanStack Query)
- [x] Create @caddy-manager/ui with shared layout and UI primitives
- [x] Create @caddy-manager/shared-api with typed API client
- [x] Add Login page
- [x] Add Dashboard page (server status, site count, health indicators)
- [x] Add Servers page (list, create, edit, delete)
- [x] Add Sites page (list, create, edit, delete)
- [x] Add Configuration viewer page
- [x] Add Logs page
- [x] Add Audit trail page
- [x] Add visual Caddy route builder with redirect, static response, file server, rewrite, and custom JSON actions
- [x] Add dynamic route preview and save review step
- [x] Add response header editing for redirect and static response routes
- [x] Add dedicated Site add/edit pages with shared scrolling layout

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
- [x] Documentation: docs/PRD.md, docs/PLAN.md, docs/FEATURES.md

## Next Backlog

- [ ] Add path, method, header, and query matchers to the visual route builder
- [ ] Add route validation and current-versus-proposed configuration comparison
- [ ] Add configuration history and rollback
- [ ] Add external route modification detection
- [ ] Add local editor drafts and recovery
- [ ] Add WebSocket or server-sent real-time updates
- [ ] Add server metrics dashboard
- [ ] Expand integration and end-to-end test coverage
- [ ] Complete security review and document findings
