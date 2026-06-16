# Caddy Manager

## Comprehensive Project Plan & Architecture Document

Version: 1.0

---

# 1. Executive Summary

Caddy Manager is a modern web-based management platform for administering Caddy servers through a secure and user-friendly interface.

The platform will provide:

* Site management
* Reverse proxy management
* Configuration management
* Deployment workflows
* Health monitoring
* Logging
* Audit history
* Multi-server support
* Role-based access control

The system will be designed from day one as a modular, extensible platform rather than a simple frontend for the Caddy Admin API.

The architecture follows:

* Monorepo
* Domain-driven design principles
* Backend-for-Frontend (BFF)
* Shared type-safe contracts
* Future multi-node support

---

# 2. Objectives

## Business Objectives

Provide a simpler alternative to managing Caddy through:

* Raw JSON
* REST requests
* Command-line operations

Reduce operational complexity.

Improve deployment confidence.

Provide configuration visibility.

Enable centralized administration.

---

# 3. Success Criteria

The MVP is considered successful when users can:

* View managed servers
* Create reverse proxy sites
* Update sites
* Delete sites
* View configuration
* Reload Caddy
* Monitor health
* View logs

Without directly interacting with the Caddy Admin API.

---

# 4. Architecture Principles

## Separation of Concerns

Frontend should contain:

* Presentation
* State management
* User interactions

Backend should contain:

* Business logic
* Validation
* Security
* Caddy integration

---

## Type Safety

All applications share:

* Models
* DTOs
* API contracts

Using TypeScript packages.

---

## Security First

The Caddy Admin API must never be publicly exposed.

All access must occur through the backend service.

---

## Extensibility

The architecture must support future:

* Multiple Caddy servers
* Authentication providers
* Configuration history
* Metrics
* Cluster management

Without major redesign.

---

# 5. High-Level Architecture

Browser
↓
Web Application
↓
API Service
↓
Caddy Integration Layer
↓
Caddy Admin API

Future:

Browser
↓
Web
↓
API
↓
Provider Layer
├── Caddy
├── Nginx
├── Traefik
└── HAProxy

---

# 6. Monorepo Structure

caddy-manager/

apps/
├── web
├── api

packages/
├── shared-types
├── shared-api
├── ui
├── config
├── utils

docs/

docker/

.github/

package.json
pnpm-workspace.yaml
turbo.json

---

# 7. Technology Stack

## Frontend

React

TypeScript

Vite

React Router

TanStack Query

React Hook Form

Zod

Material UI

---

## Backend

Node.js

Fastify

TypeScript

Zod

OpenAPI

Swagger

Pino Logging

---

## Build System

pnpm Workspaces

TurboRepo

---

## Testing

Vitest

React Testing Library

Playwright

Supertest

---

## Deployment

Docker

Docker Compose

Future Kubernetes Support

---

# 8. Domain Model

## Server

Represents a managed Caddy instance.

Properties:

* id
* name
* hostname
* apiEndpoint
* status
* version

---

## Site

Represents a reverse proxy site.

Properties:

* id
* domain
* upstream
* tlsEnabled
* status
* serverId

---

## Route

Represents routing configuration.

Properties:

* id
* host
* path
* upstream

---

## ConfigurationSnapshot

Stores historical configuration.

Properties:

* id
* timestamp
* serverId
* configuration

---

## AuditEvent

Records user actions.

Properties:

* id
* userId
* action
* entity
* timestamp

---

## User

Properties:

* id
* email
* role

---

# 9. Package Design

## shared-types

Purpose:

Shared contracts.

Examples:

Site

Server

User

AuditEvent

HealthResponse

---

## shared-api

Purpose:

Typed API SDK.

Contains:

* HTTP client
* DTOs
* API hooks

Used by frontend.

---

## ui

Reusable components.

Examples:

Layout

DataTable

JsonViewer

StatusBadge

ConfirmDialog

SiteForm

---

## config

Shared tooling.

Contains:

* ESLint
* Prettier
* TSConfig
* Vitest

---

## utils

Shared utilities.

Examples:

Date formatting

Validation

Error helpers

Logging helpers

---

# 10. Backend Design

## API Layer

Handles:

* Request validation
* Authentication
* Authorization
* Response formatting

---

## Service Layer

Contains business logic.

Examples:

SiteService

ServerService

ConfigService

AuditService

---

## Provider Layer

Abstracts web server implementations.

Interface:

Provider
├── CaddyProvider
├── NginxProvider
├── TraefikProvider

MVP implements only:

CaddyProvider

---

## Repository Layer

Future persistence support.

Examples:

SiteRepository

UserRepository

AuditRepository

---

# 11. Frontend Design

## Pages

### Dashboard

Displays:

* Server status
* Site count
* Configuration version
* Health indicators

---

### Sites

Displays:

* Site list
* Search
* Filters
* Actions

---

### Site Editor

Allows:

* Create site
* Update site
* Validate inputs

---

### Configuration Viewer

Allows:

* Read configuration
* Search
* Copy
* Download

---

### Logs

Displays:

* Recent logs
* Search
* Filters

---

### Audit History

Displays:

* Configuration changes
* User actions

---

### Settings

Displays:

* User settings
* Server settings

---

# 12. API Endpoints

## Servers

GET /api/servers

GET /api/servers/:id

POST /api/servers

PUT /api/servers/:id

DELETE /api/servers/:id

---

## Sites

GET /api/sites

POST /api/sites

PUT /api/sites/:id

DELETE /api/sites/:id

---

## Configuration

GET /api/config

POST /api/config/reload

GET /api/config/history

POST /api/config/rollback

---

## Health

GET /api/health

---

## Logs

GET /api/logs

---

## Audit

GET /api/audit

---

# 13. Security Architecture

## Authentication

Phase 1

Local admin account

Phase 2

OIDC

Azure AD

Google

GitHub

Keycloak

---

## Authorization

Roles:

Admin

Operator

Viewer

---

## Security Controls

HTTPS only

Input validation

Rate limiting

Audit logging

Session expiration

Secure cookies

CSRF protection

---

# 14. Audit Logging

Track:

* Site creation
* Site deletion
* Site updates
* Configuration reloads
* Authentication events

Store:

Timestamp

User

Action

Result

---

# 15. Configuration Management

## Current Configuration

Read active configuration.

---

## Configuration History

Store snapshots.

---

## Rollback

Allow restoring previous configurations.

---

## Validation

Validate configuration before deployment.

---

# 16. Logging

## MVP

Fetch logs through API.

---

## Future

Live log streaming.

WebSocket support.

---

# 17. Monitoring

## MVP

Health checks.

Version information.

Uptime.

---

## Future

Prometheus metrics.

Grafana dashboards.

OpenTelemetry traces.

---

# 18. Testing Strategy

## Unit Tests

Coverage target:

80%+

---

## Component Tests

Forms

Tables

Hooks

---

## API Tests

Routes

Validation

Authentication

---

## Integration Tests

Provider layer

Caddy communication

---

## End-to-End Tests

Critical user flows.

---

# 19. CI/CD

Pipeline stages:

1. Install
2. Lint
3. Type Check
4. Test
5. Build
6. Docker Build
7. Publish

---

# 20. Docker Architecture

Services:

web

api

caddy

Future:

postgres

redis

worker

---

# 21. MVP Scope

Included:

* Dashboard
* Site CRUD
* Configuration Viewer
* Reload Configuration
* Health Monitoring
* Logs
* Audit Logging
* Docker Deployment

Excluded:

* Multi-node support
* SSO
* RBAC
* Rollbacks
* Metrics dashboard

---

# 22. Phase 2 Roadmap

* User management
* Role-based permissions
* Configuration history
* Rollbacks
* WebSocket updates
* Metrics dashboard
* Multi-server support

---

# 23. Phase 3 Roadmap

* Cluster management
* Agent-based architecture
* OpenTelemetry
* Prometheus integration
* Kubernetes deployment
* Backup and restore
* Plugin system

---

# 24. Development Milestones

Milestone 1
Monorepo Foundation

Milestone 2
Backend API Foundation

Milestone 3
Shared Packages

Milestone 4
Frontend Shell

Milestone 5
Dashboard

Milestone 6
Site Management

Milestone 7
Configuration Management

Milestone 8
Logging

Milestone 9
Authentication

Milestone 10
Docker Deployment

Milestone 11
Testing & Hardening

Milestone 12
Release Candidate

---

# 25. Definition of Done

The project is complete when:

* All MVP features are implemented
* Tests pass
* Docker deployment works
* API documentation is generated
* Type checking passes
* Security review completed
* CI/CD pipeline operational
* User documentation available

End of Document
