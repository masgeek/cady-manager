# Caddy Manager Priorities

This roadmap is intentionally small and focused on the needs of an internal Caddy administration tool.

## P0: Production Safety

- [x] Prevent SSRF and Caddy-token leakage with outbound endpoint allowlists.
- [x] Support selecting the correct Caddy HTTP server block.
- [x] Fix Docker Compose database variables, networks, secrets, and healthchecks.
- [x] Add graceful shutdown for Fastify, cron jobs, and PostgreSQL.
- [x] Add API and Caddy operation integration tests.

## P1: Identity and Reliability

- [x] Replace environment-only authentication with database-backed password authentication.
- [x] Enforce simple global roles for admin, operator, and viewer users.
- [x] Improve audit events and actionable API error messages.
- [x] Add basic health latency and consecutive-failure information.
- [x] Add database uniqueness constraints for duplicate sites.

## P2: Operator Experience

- [x] Add configuration copy and download actions.
- [x] Add basic loading, error, and mutation feedback states in the UI.
- [x] Add a simple import preview before writing sites to the database.
- [x] Add bulk reconcile and health-check actions.

## Current Implementation

Completed: outbound request protection, Caddy server-block targeting, Docker Compose deployment hardening, graceful API/job/database shutdown, initial API/Caddy integration tests, database-backed authentication, simple global roles, improved audit/API errors, basic health latency/failure tracking, duplicate-site protection, configuration copy/download actions, basic UI feedback, simple import preview, bulk reconcile/health-check actions, arbitrary Caddy route preservation, visual route building, route preview, and modular page styling.

## Next Priorities

1. Add visual path, method, header, and query matchers.
2. Validate proposed routes before mutating Caddy or deleting an existing route.
3. Show current-versus-proposed route differences during review.
4. Track external route changes and synchronization history.
5. Add configuration history and rollback after the validation flow is stable.
