# Caddy Manager UI QA Checklist

Use this checklist before calling the visual modernization complete. Run it
against the built web application in a browser with a real API connection.

## Desktop

- [ ] Dashboard shows the fleet signal, attention queue, and server pulse without horizontal overflow.
- [ ] Servers header, table, Add/Edit modal, Discover modal, and Import Preview modal align correctly.
- [ ] Sites header, health summary, tables, Caddyfile-managed group, and Site modal align correctly.
- [ ] Configuration Active/Generated tabs and dark JSON viewer fit the viewport.
- [ ] Logs search, live indicator, table, and empty state are readable.
- [ ] Audit summaries and expandable details remain scannable.
- [ ] Login split layout has readable contrast and balanced spacing.

## Tablet

- [ ] Page-header actions wrap without overlapping titles or signal strips.
- [ ] Tables scroll horizontally inside their containers rather than moving the page.
- [ ] Modals remain centered with internal scrolling.
- [ ] Side navigation and top bar transition cleanly.

## Mobile

- [ ] Mobile navigation opens and closes without leaving the backdrop behind.
- [ ] Navigation buttons are easy to tap and active state is visible.
- [ ] Site and Server modals become full-screen and preserve footer actions.
- [ ] Long forms scroll internally while the page behind remains fixed.
- [ ] Tables retain readable priority columns and horizontal scrolling.
- [ ] Dashboard metric panels and attention rows stack cleanly.
- [ ] Login form fits without horizontal scrolling.

## Keyboard

- [ ] Skip or tab navigation reaches every primary action in a logical order.
- [ ] Visible focus remains clear on links, buttons, inputs, tabs, and table controls.
- [ ] Add/Edit and preview modals focus the close control when opened.
- [ ] Tab and Shift+Tab remain trapped inside open modals.
- [ ] Escape closes open modals and restores focus to the triggering control.
- [ ] Confirmation dialogs can be completed without a pointer.
- [ ] Expandable Audit details work with keyboard input.

## Assistive Technology

- [ ] Loading announcements are exposed through live regions.
- [ ] Query and mutation errors are announced as alerts.
- [ ] Icon-only controls have accessible names.
- [ ] Modal titles and dialog relationships are announced correctly.
- [ ] Status pills communicate state by text as well as color.

## Visual Consistency

- [ ] No authenticated page uses a generic Bootstrap page title as its primary header.
- [ ] Page headers use the shared `PageHeader` primitive.
- [ ] Operational summaries use the shared `SignalStrip` pattern.
- [ ] Add/Edit/Preview/Confirm flows use the shared modal foundation where possible.
- [ ] New colors and spacing use the tokens documented in `UI_COMPONENT_GUIDE.md`.
