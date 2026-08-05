# Caddy Manager UI Modernization Plan

## Goal

Turn Caddy Manager into a polished internal operations console that feels fast,
calm, and trustworthy during infrastructure work. The interface should make
server state, site health, and configuration actions immediately understandable
without adding enterprise complexity.

The single product job is: **see what is healthy, identify what needs attention,
and safely take the next action.**

## Progress Checklist

### Foundation

- [x] Add graphite control-room shell and responsive navigation.
- [x] Add design tokens, paper workspace, typography hierarchy, and focus styles.
- [x] Add shared `PageHeader` and `SignalStrip` components.
- [x] Add consistent status-pill styling.

### Core Screens

- [x] Redesign Dashboard around fleet health and attention queues.
- [x] Modernize Servers page and server action hierarchy.
- [x] Modernize Sites page and health summary.
- [x] Modernize Configuration page with Active/Generated views.
- [x] Modernize Logs page with search and severity treatment.
- [x] Modernize Audit page with expandable details.
- [x] Modernize Login page.

### Modal Workflows

- [x] Open Add/Edit Site in a responsive modal.
- [x] Keep long Site forms internally scrollable.
- [x] Keep Caddyfile-managed sites read-only in the UI.
- [x] Move Server Add/Edit, Discover, and Import Preview onto the shared `Modal` primitive.
- [x] Add focus trapping to the shared `Modal` primitive.
- [x] Add unsaved-change protection to long forms.

### Responsive and Accessibility Polish

- [x] Lock background scrolling while modals are open.
- [x] Add Escape-to-close behavior for Site modals.
- [x] Add accessible labels to shared icon-only controls and pagination.
- [x] Add mobile full-screen treatment for long Site forms.
- [ ] Add keyboard-only verification for navigation, tables, and forms.
- [ ] Verify layouts at mobile, tablet, and desktop breakpoints.
- [ ] Run a visual screenshot review for every authenticated page.

### Final Cleanup

- [ ] Migrate remaining page-specific header markup to shared components.
- [ ] Remove redundant Bootstrap visual overrides where custom tokens now cover the use case.
- [ ] Add frontend component tests for modals, status pills, loading states, and error states.
- [ ] Document the UI tokens and modal usage for future contributors.

## Visual Direction

### Concept

Use a **signal-room** visual language inspired by network monitoring equipment:
deep graphite surfaces, warm white content panels, precise status colors, and a
single electric mint accent for healthy infrastructure. The UI should feel like
a deliberate tool, not a default Bootstrap admin template.

### Palette

- Ink: `#101820` for navigation and primary text
- Graphite: `#18242B` for shell surfaces
- Paper: `#F5F7F4` for the application background
- Panel: `#FFFFFF` for cards and modal surfaces
- Mint: `#39D3A2` for healthy/success actions
- Amber: `#F2B84B` for degraded or attention states
- Coral: `#E86A5B` for failures and destructive actions
- Slate: `#6E7C84` for secondary metadata

### Typography

- Display and page headings: Space Grotesk, with a system fallback
- Body and controls: IBM Plex Sans, with a system fallback
- Technical values and configuration: IBM Plex Mono
- Use compact uppercase labels only for metadata, never for primary actions

### Signature Element

Every operational page gets a small **signal strip** near the page heading:

- Current healthy count
- Attention count
- Last refresh time
- A thin mint/amber/coral indicator line

This gives the product a recognizable identity and keeps infrastructure health
visible without turning the dashboard into a wall of charts.

## Information Architecture

### Shell

- Replace the heavy Bootstrap sidebar with a narrow graphite rail on desktop.
- Use icon plus label navigation with a clear active marker.
- Add a compact environment label such as `INTERNAL / PRODUCTION`.
- Keep logout and user identity in the bottom rail area.
- On mobile, use a top bar and a full-height navigation drawer.

### Page Header

Every page should have:

- Eyebrow label describing the area
- Clear page title
- One-sentence operational description
- Primary action on the right
- Signal strip below the heading

### Density

- Use generous page margins and tighter table rows.
- Prefer one strong card or table over several decorative cards.
- Use borders and subtle background shifts instead of excessive shadows.
- Reserve color for status and action meaning.

## Core Screens

### Dashboard

- Replace generic three-card statistics with a concise operational overview.
- Lead with a health summary: servers online, sites healthy, sites failing.
- Add an attention queue showing the most recent failures and their details.
- Add a compact server strip showing status, version, and last check.
- Add quick actions: Add server, Add site, Check health, Reconcile routes.

### Servers

- Use a table with status signal, server name, hostname, Caddy version, and last action.
- Replace icon-only actions with a primary row action plus an overflow menu.
- Keep Add Server and Edit Server in the same reusable modal.
- Add a server detail modal for health, blocks, and recent operations.
- Keep Import Preview in a modal with a clear preview-to-confirm sequence.

### Sites

- Use a compact table with domain as the strongest visual field.
- Show status badge, status detail, latency, failure streak, route block, and sync state.
- Keep sites without `@id` in the existing collapsed group, but style the group as a warning section.
- Replace the separate SiteEditor page with a large responsive Add/Edit Site modal.
- Add a right-side modal summary showing the generated domain and selected Caddy block.
- Keep destructive deletion behind a confirmation dialog with the domain and server named explicitly.

### Configuration

- Use a server selector with active configuration metadata.
- Keep copy and download actions prominent but quiet.
- Add tabs for `Active` and `Generated` configuration.
- Add a reload confirmation modal showing server name, site count, and timestamp.
- Use monospace syntax styling and a sticky action bar on smaller screens.

### Logs and Audit

- Add filter controls at the top rather than burying them in the table.
- Make timestamps, actor, action, and result easy to scan.
- Use expandable rows for long details.
- Use consistent empty states that explain what the operator can do next.

### Login

- Use a focused single-panel layout with a dark signal-room background.
- Add a restrained Caddy/network mark, not a generic gradient hero.
- Make the form compact, high contrast, and keyboard-first.
- Show precise authentication errors without exposing sensitive details.

## Modal System

Create one shared modal pattern for all create/edit workflows.

- `FormModal` for Add/Edit Server and Add/Edit Site
- `PreviewModal` for import and generated configuration previews
- `ConfirmModal` for deletion and reload actions
- `DetailsModal` for server health and audit details

Each modal must support:

- Focus trapping
- Escape-key close
- Click-outside behavior where safe
- Sticky footer actions
- Loading and disabled states
- Inline validation
- Unsaved-change protection
- Mobile full-screen presentation

## Component System

Build a small internal design system instead of styling each page independently.

- `PageHeader`
- `SignalStrip`
- `StatusBadge`
- `MetricTile`
- `DataTable`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `FormModal`
- `ConfirmModal`
- `ToastStack`
- `ActionMenu`
- `HealthDetail`

Move visual tokens into a single CSS file or theme module. Bootstrap can remain
as a layout utility during migration, but product-specific components should no
longer depend on Bootstrap defaults for their visual identity.

## Interaction Rules

- Buttons use verbs: `Add site`, `Check health`, `Reconcile routes`, `Reload config`.
- Destructive actions are coral and always state the target object.
- Success feedback confirms the action and names the result.
- Error feedback explains the failure and offers retry when possible.
- Long-running actions show progress in the button and prevent duplicate clicks.
- Tables remain usable on mobile through horizontal scrolling and priority columns.
- Never rely on color alone; pair status colors with labels and icons.

## Accessibility Requirements

- Maintain visible keyboard focus rings.
- Use semantic headings and table headers.
- Add accessible labels to icon-only buttons.
- Ensure modal focus management and screen-reader announcements.
- Meet WCAG AA contrast for all status and navigation colors.
- Respect `prefers-reduced-motion`.
- Keep touch targets at least 44px on mobile.

## Implementation Phases

### Phase 1: Foundation

- Add design tokens, typography, global background, shell, and spacing system.
- Create shared page-header, signal-strip, status, loading, error, and toast components.
- Establish responsive breakpoints and focus styles.

### Phase 2: Shell and Dashboard

- Modernize desktop rail, mobile drawer, top bar, and user controls.
- Rebuild Dashboard around health summary and attention queue.

### Phase 3: Modal Workflows

- Convert SiteEditor into Add/Edit Site modal.
- Consolidate Server add/edit modal behavior.
- Add reusable confirmation, preview, and details modals.

### Phase 4: Operational Pages

- Redesign Sites and Servers tables.
- Redesign Config with Active/Generated tabs and reload confirmation.
- Improve Logs and Audit filtering and detail expansion.

### Phase 5: Polish and Verification

- Add responsive and accessibility tests.
- Add screenshot review for desktop, tablet, and mobile.
- Verify keyboard-only workflows.
- Remove redundant Bootstrap styling and unused page-specific CSS.

## Definition of Done

- The UI has a consistent visual identity across every authenticated page.
- Add/Edit Server and Add/Edit Site use shared responsive modals.
- Every data screen has intentional loading, empty, and error states.
- Health state is visible without opening a detail page.
- All primary actions are keyboard accessible and have clear feedback.
- The interface remains usable at mobile widths without losing core actions.
- No page relies on default Bootstrap colors or spacing for its primary identity.
