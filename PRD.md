# Caddy Manager — Product Requirements Document

Version: 1.0 | Status: Draft

---

## 1. Product Overview

Caddy Manager is a web-based management platform for administering Caddy web servers through a secure, user-friendly interface. It replaces raw JSON manipulation and curl-based administration with a structured UI backed by a dedicated API service.

---

## 2. Problem Statement

Managing Caddy servers today requires:

- Manual JSON configuration editing
- Direct REST API calls via `curl` or similar tools
- Command-line Caddy operations
- No configuration visibility or history
- No audit trail for changes

This creates operational risk, onboarding friction, and limited observability. Teams lack a centralized, secure interface for managing Caddy instances.

---

## 3. Target Audience

| Persona | Role | Needs |
|---|---|---|
| Platform Engineer | Manages Caddy infrastructure | Site CRUD, config visibility, health monitoring, multi-server support |
| DevOps Engineer | Deploys and maintains services | Automated workflows, audit logs, rollback capability |
| SRE | Ensures uptime and performance | Health monitoring, log access, metrics |
| Junior Operator | Follows runbooks | Simple UI for common tasks, reduced CLI dependency |

---

## 4. User Stories

### MVP Stories

| ID | Story | Priority |
|---|---|---|
| US-01 | As a user, I want to view all managed Caddy servers so I can see their status at a glance. | P0 |
| US-02 | As a user, I want to register a new Caddy server so I can manage it through the platform. | P0 |
| US-03 | As a user, I want to create a reverse proxy site so I can route traffic to my upstream services. | P0 |
| US-04 | As a user, I want to update an existing site so I can change its domain or upstream target. | P0 |
| US-05 | As a user, I want to delete a site so I can remove unused configurations. | P0 |
| US-06 | As a user, I want to view the active Caddy configuration so I can audit current settings. | P0 |
| US-07 | As a user, I want to reload Caddy configuration so my changes take effect. | P0 |
| US-08 | As a user, I want to see server health status so I can detect issues early. | P0 |
| US-09 | As a user, I want to view recent logs so I can troubleshoot problems. | P0 |
| US-10 | As a user, I want to see an audit trail of configuration changes so I know who changed what. | P0 |
| US-11 | As a user, I want to deploy the platform via Docker so I can run it in my infrastructure. | P0 |

### Phase 2 Stories

| ID | Story | Priority |
|---|---|---|
| US-12 | As an admin, I want to manage user accounts so I can control access to the platform. | P1 |
| US-13 | As an admin, I want to assign roles to users so I can enforce least-privilege access. | P1 |
| US-14 | As a user, I want to view configuration history so I can see how configs have changed over time. | P1 |
| US-15 | As a user, I want to roll back to a previous configuration so I can recover from errors. | P1 |
| US-16 | As a user, I want real-time updates via WebSocket so I see changes immediately. | P1 |
| US-17 | As a user, I want to see server metrics on a dashboard so I can monitor performance. | P1 |

---

## 5. Functional Requirements

### FR-01: Server Management

| ID | Requirement |
|---|---|
| FR-01.1 | System SHALL allow registering a Caddy server with name, hostname, and API endpoint |
| FR-01.2 | System SHALL display all registered servers with their connection status |
| FR-01.3 | System SHALL allow updating server details |
| FR-01.4 | System SHALL allow removing a server registration |

### FR-02: Site Management

| ID | Requirement |
|---|---|
| FR-02.1 | System SHALL support creating a reverse proxy site with domain, upstream target, and TLS settings |
| FR-02.2 | System SHALL display all sites with their status (active/inactive/error) |
| FR-02.3 | System SHALL support searching and filtering sites |
| FR-02.4 | System SHALL allow editing site configuration |
| FR-02.5 | System SHALL allow deleting a site |
| FR-02.6 | System SHALL validate inputs before submission |

### FR-03: Configuration Management

| ID | Requirement |
|---|---|
| FR-03.1 | System SHALL fetch and display the active Caddy configuration as formatted JSON |
| FR-03.2 | System SHALL support searching within configuration |
| FR-03.3 | System SHALL allow copying and downloading configuration |
| FR-03.4 | System SHALL expose a reload endpoint to apply Caddy configuration changes |

### FR-04: Health Monitoring

| ID | Requirement |
|---|---|
| FR-04.1 | System SHALL perform health checks against registered servers |
| FR-04.2 | System SHALL display server status (online/offline/degraded), version, and uptime |
| FR-04.3 | System SHALL surface health indicators on the dashboard |

### FR-05: Logging

| ID | Requirement |
|---|---|
| FR-05.1 | System SHALL fetch and display recent Caddy logs through the API |
| FR-05.2 | System SHALL support searching and filtering logs |
| FR-05.3 | System SHALL show log timestamps and severity levels |
| FR-05.4 | System SHALL retain a configurable maximum number of log entries (default: 1000); oldest entries SHALL be dropped when the limit is exceeded |

### FR-06: Audit Logging

| ID | Requirement |
|---|---|
| FR-06.1 | System SHALL record all configuration changes (create, update, delete) |
| FR-06.2 | System SHALL record authentication events |
| FR-06.3 | System SHALL display audit history with timestamp, user, action, and result |

### FR-07: API

| ID | Requirement |
|---|---|
| FR-07.1 | System SHALL provide a REST API for all operations |
| FR-07.2 | API SHALL validate all inputs using Zod schemas |
| FR-07.3 | API SHALL generate OpenAPI documentation |
| FR-07.4 | API SHALL return consistent error responses |

### FR-08: Authentication

| ID | Requirement |
|---|---|
| FR-08.1 | System SHALL authenticate users via a `POST /api/auth/login` endpoint that validates credentials and returns a JWT token |
| FR-08.2 | System SHALL verify credentials against configured AUTH_USERNAME and AUTH_PASSWORD environment variables |
| FR-08.3 | System SHALL reject unauthenticated requests with a 401 response |
| FR-08.4 | System SHALL require a valid JWT `Bearer` token on all authenticated API routes except `/auth/login` and `/health` |

---

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | **Security** — Caddy Admin API MUST never be publicly exposed; all access MUST go through the backend service |
| NFR-02 | **Security** — The platform SHALL enforce HTTPS-only communication |
| NFR-03 | **Security** — Input validation SHALL be applied at both API and UI layers |
| NFR-04 | **Security** — Rate limiting SHALL be implemented on API endpoints |
| NFR-05 | **Performance** — Page loads SHALL complete within 2 seconds under normal conditions |
| NFR-06 | **Reliability** — API errors SHALL never expose stack traces or internal details |
| NFR-07 | **Maintainability** — All packages SHALL share TypeScript types via the `shared-types` package |
| NFR-08 | **Testability** — Unit test coverage SHALL target 80%+ |
| NFR-09 | **Portability** — The system SHALL be deployable via Docker Compose |
| NFR-10 | **Persistence** — All persistent data (servers, sites, audit logs, users) SHALL be stored in PostgreSQL |
| NFR-11 | **Auth** — MVP SHALL use JWT token authentication with credentials configured via environment variables; users table SHALL be designed to support future OIDC/RBAC migration |

---

## 7. Architecture Constraints

- **Monorepo** — All code lives in a single repository with pnpm workspaces and TurboRepo
- **BFF Pattern** — Backend-for-Frontend; the API is the sole consumer of the Caddy Admin API
- **Provider Abstraction** — Server interaction is abstracted behind a `Provider` interface (MVP: `CaddyProvider` only)
- **Domain-Driven Design** — Code is organized by domain concept (Site, Server, Config, Audit)
- **Type Safety** — All contracts are defined as TypeScript types in `shared-types` and consumed by both frontend and backend
- **PostgreSQL Backed** — All persistent state (servers, sites, audit logs, users) is stored in PostgreSQL from MVP onward
- **Shared Config** — Environment variables are loaded and validated in a central `config` package consumed by all backend packages

---

## 8. MVP Scope

### In Scope

| Feature | Description |
|---|---|
| Dashboard | Server status, site count, health indicators |
| Server Registration | Add/edit/remove Caddy server endpoints |
| Site CRUD | Create, read, update, delete reverse proxy sites |
| Configuration Viewer | Read-only view of active Caddy config with search/copy/download |
| Configuration Reload | Trigger Caddy reload on configuration changes |
| Health Monitoring | Basic health checks, version, status display |
| Logging | Fetch and display recent logs with search/filter |
| Audit Trail | Record and display configuration and auth events |
| Docker Deployment | Docker Compose setup for web, api, migrate, and postgres services; Caddy is managed externally |

### Out of Scope (MVP)

| Feature | Rationale |
|---|---|
| Bundled Caddy container | Caddy is assumed to be running externally; the manager connects to its Admin API |
| Multi-node / cluster management | Complex; deferred to Phase 3 |
| Single Sign-On (OIDC, Azure AD, etc.) | Phase 2 |
| Role-Based Access Control (RBAC) | Phase 2 |
| Configuration history / rollback | Phase 2 |
| WebSocket live updates | Phase 2 |
| Metrics / Prometheus / Grafana | Phase 2 |
| Additional provider support (Nginx, Traefik) | Phase 3 |
| Kubernetes deployment | Phase 3 |
| Plugin system | Phase 3 |

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| MVP features implemented | 100% of US-01 through US-11 |
| Test coverage | ≥80% unit test coverage |
| TypeScript type checking | Zero errors across all packages |
| Docker deployment | One-command startup via `docker compose up` |
| API documentation | OpenAPI spec auto-generated and accessible via Swagger UI |
| Build pipeline | CI/CD passing on every push to main |

---

## 10. Release Criteria (Definition of Done)

- [ ] All MVP features implemented and verified
- [ ] Unit, integration, and E2E tests passing
- [ ] TypeScript strict mode passes across all packages
- [ ] Docker Compose deployment functional
- [ ] OpenAPI documentation generated and browsable
- [ ] ESLint passing with zero warnings
- [ ] Security review completed (no secrets, no exposed admin API, input validation in place)
- [ ] CI/CD pipeline operational

---

## 11. Technical Stack Summary

| Layer | Technology |
|---|---|
| Frontend Framework | React + TypeScript + Vite |
| Routing | React Router |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| UI Library | Material UI |
| Backend Framework | Node.js + Fastify + TypeScript |
| Validation | Zod |
| API Documentation | OpenAPI + Swagger |
| Logging | Pino |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Package Manager | pnpm |
| Build System | TurboRepo |
| Testing | Vitest, React Testing Library |
| Containerization | Docker, Docker Compose |

---

## 12. Development Milestones

| Milestone | Deliverable |
|---|---|
| M1 — Monorepo Foundation | pnpm workspace, TurboRepo config, tsconfig, ESLint, Prettier, Docker scaffolding |
| M2 — Backend API Foundation | Fastify server, health endpoint, error handling, logging, OpenAPI setup |
| M3 — Shared Packages | `shared-types`, `shared-api`, `ui`, `config`, `utils`, `db` packages published and consumable |
| M4 — Frontend Shell | Vite + React + Router + MUI + TanStack Query wired up, layout in place |
| M5 — Dashboard | Server list, health status, site count — all wired to API |
| M6 — Site Management | Full CRUD UI for sites with validation |
| M7 — Configuration Management | Config viewer, reload trigger |
| M8 — Logging | Log viewer with search and filters |
| M9 — Authentication | Basic auth setup with configurable credentials |
| M10 — Docker Deployment | Docker Compose with web, api, migrate, and postgres services; environment configuration |
| M11 — Testing & Hardening | Test coverage, security review, edge cases |
| M12 — Release Candidate | Final polish, documentation, CI/CD finalization |

---

## 13. Key Decisions

| Decision | Chosen Approach | Rationale |
|---|---|---|
| MVP Authentication | JWT tokens via `POST /api/auth/login` | Token-based auth keeps the client dumb and enables future SSO/OIDC/RBAC; JWT secret configured via `JWT_SECRET` env var |
| Data Persistence | PostgreSQL from MVP | Production-ready from day one; avoids migration pain later; single DB for all entity types |
| Log Retention | Configurable max entries (default: 1000) | Keeps MVP simple; oldest entries dropped when limit hit; limit configurable via environment variable |
| Caddy Deployment | External (user-managed) | The manager is an administration plane, not a Caddy orchestrator; users bring their own Caddy instance |
| ORM | Drizzle ORM | Type-safe SQL query builder with Drizzle Kit for migrations; lighter weight than Prisma, better PostgreSQL support than Kysely |

---

*End of Document*
