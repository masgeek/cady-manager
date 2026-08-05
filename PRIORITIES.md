# Caddy Manager Priorities

This roadmap is ordered by production risk first, then reliability, then product expansion.

## P0: Production Safety

- [x] Prevent SSRF and Caddy-token leakage with outbound endpoint allowlists.
- [x] Support selecting the correct Caddy HTTP server block.
- [x] Fix Docker Compose database variables, networks, secrets, and healthchecks.
- [x] Add graceful shutdown for Fastify, cron jobs, and PostgreSQL.
- [x] Add API and Caddy operation integration tests.

## P1: Identity and Reliability

- [ ] Replace environment-only authentication with database-backed password authentication.
- [ ] Enforce roles and server-scoped permissions.
- [ ] Move JWT handling to secure HttpOnly cookies or short-lived rotating tokens.
- [ ] Add desired-state tracking for pending, applied, failed, and drifted site changes.
- [ ] Add configuration snapshots, diffs, validation, and rollback.
- [ ] Add health history, latency, failure counts, retries, and bounded concurrency.
- [ ] Improve structured audit events, error responses, and operational logging.
- [ ] Add database uniqueness constraints and indexes.

## P2: Operator Experience

- [ ] Add configuration diff, preview, copy, download, and validate-only workflows.
- [ ] Add drift detection and import preview with conflict resolution.
- [ ] Add bulk site sync, reconcile, health-check, and maintenance-mode actions.
- [ ] Add loading, error, retry, and mutation feedback states throughout the UI.
- [ ] Add pagination and filtering for sites, logs, and audit events.
- [ ] Add notifications through webhooks, email, Slack, or PagerDuty.

## P3: Platform Features

- [ ] Add Prometheus metrics and OpenTelemetry tracing.
- [ ] Add server groups and environment-aware safeguards.
- [ ] Add richer Caddy routing: paths, multiple upstreams, load balancing, retries, and headers.
- [ ] Add OIDC/SSO and service accounts for automation.
- [ ] Add GitOps export/import and approval workflows.
- [ ] Add real-time health and deployment updates.

## Deferred

- [ ] Preserve unmanaged Caddy configuration during reloads.
  Deferred because unrelated configuration is maintained in the Caddy configuration source and is intentionally outside Caddy Manager's managed state.

## Current Implementation

Completed: outbound request protection, Caddy server-block targeting, Docker Compose deployment hardening, graceful API/job/database shutdown, and initial API/Caddy integration tests. The next active item is database-backed authentication and authorization.
