# Caddy Manager

Web-based management platform for administering Caddy servers through a secure, user-friendly interface. Replaces raw JSON manipulation and curl-based administration with a structured UI backed by a dedicated API service.

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
│   ├── shared-api   # Typed API SDK & hooks
│   ├── ui           # Reusable React components
│   ├── config       # Shared ESLint, Prettier, tsconfig
│   └── utils        # Shared utilities
├── docker/          # Docker Compose & configs
├── docs/            # Documentation
└── .github/         # CI/CD workflows
```

## Tech Stack

| Layer              | Technology                              |
|--------------------|-----------------------------------------|
| Frontend           | React + TypeScript + Vite               |
| Backend            | Node.js + Fastify + TypeScript          |
| Database           | PostgreSQL                              |
| Validation         | Zod                                     |
| API Docs           | OpenAPI + Swagger                       |
| Package Manager    | pnpm                                    |
| Build System       | TurboRepo                               |
| Testing            | Vitest, RTL, Playwright, Supertest      |
| Containerization   | Docker + Docker Compose                 |

## MVP Features

- Dashboard with server status and health indicators
- Server registration (add/edit/remove Caddy endpoints)
- Site CRUD (reverse proxy sites)
- Configuration viewer with search/copy/download
- Configuration reload
- Health monitoring
- Log viewer with search and filters
- Audit trail
- HTTP Basic Auth
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
```

## Deployment

```bash
docker compose up -d
```

See `docker/` for configuration details.

## Documentation

- [Plan & Architecture](PLAN.md) — Full project plan and architecture document
- [PRD](PRD.md) — Product requirements and key decisions
