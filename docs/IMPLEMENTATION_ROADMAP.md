# Caddy Manager Improvement Roadmap

This document describes the recommended implementation sequence for improving route management, the site editor, styling, and operational safety.

## Goals

- Let non-technical users create common Caddy routes safely.
- Preserve support for arbitrary Caddy JSON configurations.
- Make route changes reviewable before they reach Caddy.
- Keep the frontend maintainable as more route types are added.
- Improve visibility into synchronization and external configuration changes.

## Current Baseline

The application currently provides:

- Visual route actions for reverse proxy, redirect, static response, file server, and rewrite routes.
- Advanced custom Caddy route JSON.
- Dynamic JSON preview and a confirmation step before saving.
- Response header rows for redirect and static response routes.
- Import and preservation of non-reverse-proxy routes.
- Central page scrolling through the shared UI layout.
- Modular SCSS under `apps/web/src/styles/`.

## Phase 1: Route Builder Foundation

### 1. Extract editor components

Split `apps/web/src/pages/SiteEditor.tsx` into focused components:

- `SiteBasicsFields`
- `RouteActionSelector`
- `RouteActionFields`
- `ResponseHeadersEditor`
- `AdvancedRouteEditor`
- `RoutePreview`
- `SiteHealthFields`

Keep form state and submission orchestration in `SiteEditor.tsx`.

Acceptance criteria:

- Create and edit behavior remains unchanged.
- Each route action can be tested independently.
- The editor page contains no large action-specific JSX branches.

### 2. Centralize route generation

Move frontend preview generation into a shared route-builder module. The backend should use the same route concepts where practical, or the API should expose a preview endpoint when backend parity is required.

The builder should define:

- Route action type.
- Required fields.
- Default values.
- Caddy handler output.
- Human-readable description.
- Example route JSON.

Acceptance criteria:

- Preview JSON and submitted `routeConfig` are identical.
- Every supported action has one source of truth for defaults.

## Phase 2: Matcher Support

Add optional matchers to the visual builder:

- Path patterns, for example `/api/*`.
- HTTP methods, for example `GET` and `POST`.
- Request headers.
- Query parameters.

Example generated match object:

```json
{
  "host": ["api.example.com"],
  "path": ["/api/*"],
  "method": ["GET"]
}
```

Acceptance criteria:

- Matchers are optional and can be added or removed without editing JSON.
- Existing imported matchers are preserved when a route is edited.
- The preview clearly separates host and optional request matchers.

## Phase 3: Headers and Handler Options

Status: partially complete. Redirect and static response headers are available;
the remaining handler-specific options are future work.

Replace JSON-only header fields with reusable key/value editors wherever possible.

Support common options for each action:

- Reverse proxy: request headers, response headers, health checks, load balancing options.
- Redirect: `Location`, status code, and optional response headers.
- Static response: body, status code, and response headers.
- File server: root, browse mode, and index behavior.
- Rewrite: URI and optional path behavior.

Acceptance criteria:

- Users can add, remove, and reorder headers.
- Empty headers are not emitted into generated JSON.
- Advanced JSON remains available for unsupported options.

## Phase 4: Validation and Safe Changes

### API validation

Add a route validation service that checks:

- Route is a JSON object.
- `match` and `handle` have valid shapes.
- The route has an identifiable handler or valid custom structure.
- A generated route has the required fields for its selected action.

### Caddy validation

Before applying a route, optionally validate the resulting configuration against the Caddy admin API or a configured validation endpoint.

Acceptance criteria:

- Invalid routes fail before persistence or Caddy mutation.
- Error messages identify the failing field or handler.
- Existing routes are not deleted until the replacement route is validated.

### Change comparison

Add a review comparison showing:

- Current route JSON.
- Proposed route JSON.
- Added, removed, and changed fields.

## Phase 5: Route Lifecycle and Synchronization

Track route metadata explicitly:

- Route action or detected handler.
- Last synchronized timestamp.
- Last imported timestamp.
- Source: manager, imported, or Caddyfile.
- External modification status.

Add UI states for:

- Synced.
- Pending changes.
- Missing from Caddy.
- Changed externally.
- Validation failed.

Acceptance criteria:

- The sites table shows the route action and synchronization state.
- External changes do not get silently overwritten.
- Users can inspect the route before choosing to reconcile it.

## Phase 6: Drafts and Recovery

Add local draft persistence for the site editor:

- Save draft values to browser storage by route ID or new-site key.
- Restore drafts after accidental refresh.
- Show when a draft was last saved.
- Provide discard and reset actions.

Acceptance criteria:

- Refreshing a dirty editor does not lose the draft.
- Drafts are cleared after a successful save or explicit discard.
- Sensitive health headers are excluded or encrypted according to the security policy.

## Phase 7: Frontend Structure and Styling

Status: complete for the current baseline. The shared page shell, scrolling
behavior, and initial SCSS modules are implemented. Further splitting is
optional maintenance work.

The current SCSS structure under `apps/web/src/styles/` is:

```text
styles/
  index.scss
  _tokens.scss
  _base.scss
  _layout.scss
  _editor.scss
  _components.scss
```

Guidelines:

- Keep design tokens in `_tokens.scss`.
- Keep global element rules in `_base.scss`.
- Keep layout sizing and overflow rules in `_layout.scss`.
- Keep page-specific styles in page partials.
- Avoid adding page-specific rules to `_components.scss`.
- Use shared mixins only for repeated, meaningful patterns.

## Testing Plan

### Unit tests

- Route generation for every visual action.
- Header normalization.
- Matcher generation.
- Route action detection during edit.
- Custom route preservation.

### API tests

- Create a reverse proxy route.
- Create a static response route without an upstream.
- Update a route handler.
- Delete a route by persisted route ID.
- Reject malformed custom route JSON.

### Frontend tests

- Default action is reverse proxy.
- Switching actions changes the visible fields.
- Redirect generation creates a `Location` header and status `301` by default.
- Add/remove header rows.
- Preview updates without submitting.
- Review step blocks the API request until confirmed.

### Build and quality checks

Run before merging:

```text
pnpm typecheck
pnpm --filter @caddy-manager/web test
pnpm --filter @caddy-manager/web build
pnpm lint
```

## Recommended Delivery Order

1. Extract route builder components and shared generation logic.
2. Add matcher support.
3. Add validation and current-versus-proposed comparison.
4. Add lifecycle and external-change tracking.
5. Add drafts and recovery.
6. Expand test coverage alongside each phase.

Each phase should be committed separately with a contextual Conventional Commit message.
