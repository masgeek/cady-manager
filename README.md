# Caddy Manager

Web-based management platform for administering Caddy servers through a secure, user-friendly interface. It combines a visual route builder with an advanced JSON escape hatch, backed by a dedicated API service.

## Architecture

```
Browser
  ↓
Web Application  (React + Vite + TypeScript)
  ↓
API Service      (Node.js + Fastify + TypeScript)
  ↓
Caddy Admin API  (external, user-managed Caddy instances)
```

## Repository Structure

```
caddy-manager/
├── apps/
│   ├── web          # React frontend
│   └── api          # Fastify backend
├── packages/
│   ├── shared-types # TypeScript contracts & DTOs
│   ├── shared-api   # Typed API client and request types
│   ├── ui           # Reusable React layout and UI primitives
│   ├── config       # Environment loading and validation
│   ├── db           # Drizzle schema, repositories, migrations, seeds
│   └── utils        # Shared utilities
├── docker/          # Docker Compose & configs
├── docs/            # Documentation
└── .github/         # CI/CD workflows
```

## Tech Stack

| Layer              | Technology                              |
|--------------------|-----------------------------------------|
| Frontend           | React + TypeScript + Vite + Bootstrap    |
| Backend            | Node.js + Fastify + TypeScript          |
| Database           | PostgreSQL                              |
| Validation         | Zod                                     |
| API Docs           | OpenAPI + Swagger                       |
| Package Manager    | pnpm                                    |
| Build System       | TurboRepo                               |
| Styling            | Modular SCSS                            |
| Testing            | Vitest, React Testing Library            |
| Containerization   | Docker + Docker Compose                 |

## MVP Features

- Dashboard with server status and health indicators
- Server registration (add/edit/remove Caddy endpoints)
- Visual site builder for reverse proxy, redirect, static response, file server, and rewrite routes
- Advanced custom Caddy route JSON for unsupported configurations
- Dynamic route preview and confirmation before saving
- Response header builder for redirects and static responses
- Import and preservation of arbitrary Caddy route handlers
- Configuration viewer with search/copy/download
- Configuration reload
- Health monitoring
- Log viewer with search and filters
- Audit trail
- JWT-based authentication
- Docker Compose deployment

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose (for deployment)
- PostgreSQL 16+ (or use the Docker Compose setup)
- A running Caddy instance with Admin API enabled

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev

# Run checks
pnpm typecheck
pnpm --filter @caddy-manager/web test
pnpm --filter @caddy-manager/web build

# Migrate the database and create the initial admin user
pnpm seed:admin
```

## Deployment

```bash
docker compose up -d
```

Set `CADDY_ALLOWED_HOSTS` in `.env` before starting. If Caddy runs in another
container, attach it to the generated `caddy-manager_internal` network so the
API can reach it. The API is intentionally not published directly; access it
through the web container on `WEB_PORT`.

See `docker/` for configuration details.

## Documentation

- [Plan & Architecture](docs/PLAN.md) — Full project plan and architecture document
- [PRD](docs/PRD.md) — Product requirements and key decisions
- [Features](docs/FEATURES.md) — Implemented features and current backlog
- [Priorities](docs/PRIORITIES.md) — Completed priorities and next work
- [UI Design Plan](docs/UI_DESIGN_PLAN.md) — Visual direction and interaction rules
- [UI Component Guide](docs/UI_COMPONENT_GUIDE.md) — Shared UI and layout guidance
- [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) — Route builder and platform improvement plan
- [Docker Deployment](docs/DOCKER.md) — Compose services, configuration, and operations
