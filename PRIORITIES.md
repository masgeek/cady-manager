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
- [ ] Improve audit events and actionable API error messages.
- [ ] Add basic health latency and consecutive-failure information.
- [ ] Add database uniqueness constraints for duplicate sites.

## P2: Operator Experience

- [ ] Add configuration copy and download actions.
- [ ] Add basic loading, error, and mutation feedback states in the UI.
- [ ] Add a simple import preview before writing sites to the database.
- [ ] Add bulk reconcile and health-check actions.

## Current Implementation

Completed: outbound request protection, Caddy server-block targeting, Docker Compose deployment hardening, graceful API/job/database shutdown, initial API/Caddy integration tests, database-backed authentication, and simple global roles. The next active item is improved audit events and API errors.
