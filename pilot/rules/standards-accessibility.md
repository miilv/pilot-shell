---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.html"
  - "**/*.vue"
  - "**/*.svelte"
---

# Accessibility Standards

**Core Rule:** Build accessible interfaces for all users, including those using assistive technologies.

## Semantic HTML First

Use native elements that convey meaning: `<button>` for actions, `<a>` for navigation, `<nav>`/`<main>`/`<header>`/`<footer>` for landmarks, `<label>` for form inputs.

## Keyboard Navigation

- Tab moves focus through interactive elements; Enter/Space activates; Escape closes modals
- Focus indicators must be clearly visible — never remove without alternative
- Only use `tabIndex` 0 or -1. Never create keyboard traps.

## Form Labels

Every input must have an associated label. Use `aria-label` for icon-only buttons, `aria-describedby` for help text.

## Images

- Informative: descriptive alt text (under 150 chars)
- Decorative: `alt=""`

## Color Contrast

- Normal text: 4.5:1 ratio | Large text (≥18pt): 3:1 ratio
- Never convey information by color alone — add icons or text

## ARIA

Use semantic HTML first, ARIA second. Don't override native semantics. All interactive ARIA roles need keyboard support. Use `aria-live="polite"` for dynamic content.

## Heading Hierarchy

One `<h1>` per page. Don't skip levels. Don't choose headings based on visual size.

## Checklist

- [ ] Interactive elements keyboard accessible
- [ ] Visible focus indicators
- [ ] Images have appropriate alt text
- [ ] Form inputs have labels
- [ ] Color contrast meets WCAG (4.5:1 text)
- [ ] Logical heading hierarchy
- [ ] No information conveyed by color alone
- [ ] Tested with keyboard navigation
