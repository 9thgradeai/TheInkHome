# The Ink Home — Accessibility

## Implemented

- Skip link target matches the rendered `<main id="main">` (`href="#main"`).
- Skip link is the first focusable element in the DOM.
- AI assistant dialog uses `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-live="polite"` on
  the message region and `aria-busy` while loading.
- Assistant trigger uses an `aria-label`; icon-only close/submit buttons use `aria-label`.
- Like and save toggles use `aria-pressed`.
- Decorative motion/gradient surfaces use `aria-hidden="true"`.
- Focus rings declared for buttons (`:focus-visible`).

## Known gaps

- Heading hierarchy and colour-contrast ratios still need a dedicated audit pass.
- Motion-heavy canvas backgrounds are decorative only and should be disabled under
  `prefers-reduced-motion`.

## Testing

Run `npx vitest run` and `npx tsc --noEmit` to keep the surrounding surfaces type-safe.
