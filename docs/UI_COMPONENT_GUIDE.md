# Caddy Manager UI Component Guide

This guide describes the small visual system used by the web application. Keep
new screens aligned with these primitives instead of introducing page-specific
visual patterns.

## Visual Tokens

The tokens live in `apps/web/src/styles/_tokens.scss` and are loaded through `apps/web/src/styles/index.scss`.

- `--ink`: primary text and dark control-room surfaces
- `--graphite`: sidebar and operational hero backgrounds
- `--paper`: application workspace background
- `--panel`: cards, tables, and modal surfaces
- `--line`: borders and separators
- `--muted`: secondary labels and supporting metadata
- `--mint`: healthy state and primary action accent
- `--amber`: degraded or attention state
- `--coral`: errors and destructive actions

Use the tokens rather than introducing new hex values in page components.

## PageHeader

Use `PageHeader` for every authenticated page:

```tsx
<PageHeader
  eyebrow="Routing inventory"
  title="Sites"
  description="Managed domains and their health signal."
  actions={<button className="btn btn-primary">Add site</button>}
  signal={
    <>
      <strong>12 healthy</strong>
      <span className="ms-auto">2 need attention</span>
    </>
  }
/>
```

Keep the eyebrow short, use plain-language titles, and make the signal strip
describe real operational state.

## Modal

Use the shared `Modal` for server dialogs, import previews, confirmations, and detail workflows. Site add/edit uses a dedicated page so long route forms have room to breathe:

```tsx
<Modal
  open={open}
  title="Edit server"
  size="lg"
  onClose={close}
  footer={
    <>
      <button className="btn btn-secondary" onClick={close}>Cancel</button>
      <button className="btn btn-primary" type="submit" form="server-form">Save changes</button>
    </>
  }
>
  <form id="server-form">...</form>
</Modal>
```

The shared modal provides background scroll locking, Escape-to-close, initial
focus, keyboard focus trapping, responsive scrolling, and accessible labeling.
Do not recreate backdrop or body-scroll logic in individual pages.

## PageShell

Authenticated pages render inside the shared `PageShell` supplied by `Layout`.
The shell provides the common page boundary and the app content region owns
vertical scrolling. Page-specific layout should be added below this boundary,
not by changing document or body overflow.

## StatusBadge

Use `StatusBadge` for server and site state. It supplies the correct label, dot,
and semantic color class for statuses such as `active`, `error`, `online`, and
`degraded`.

## Tables

- Use `DataTable` for ordinary tabular data.
- Keep the first column the strongest identifying field.
- Use `table-responsive` for mobile overflow.
- Keep action controls compact but give icon-only buttons an `aria-label`.
- Use `empty-panel` for meaningful empty states instead of plain empty rows.

## Copy and Tone

- Use sentence case.
- Prefer direct verbs such as `Add site`, `Check health`, and `Reload config`.
- Name the object affected by destructive actions.
- Explain errors in terms of what the operator can do next.
- Avoid decorative labels that do not communicate state or action.
