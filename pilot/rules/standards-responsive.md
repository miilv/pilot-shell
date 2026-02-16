---
paths:
  - "**/*.css"
  - "**/*.scss"
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.html"
  - "**/*.vue"
  - "**/*.svelte"
---

# Responsive Design Standards

**Rule:** Mobile-first with consistent breakpoints, fluid layouts, relative units, and touch-friendly targets.

## Mobile-First — Mandatory

Start with mobile layout, enhance with `min-width` media queries. Tailwind breakpoints: `sm:640`, `md:768`, `lg:1024`, `xl:1280`, `2xl:1536`. Check existing breakpoints — never use arbitrary values.

## Fluid Layouts

- `width: 100%` + `max-width` instead of fixed widths
- Grid: `1fr`, `minmax()`, `auto-fit`/`auto-fill`
- Container queries for component-level responsiveness

## Units

- `rem` for font sizes, spacing, layout | `em` for component-relative | `%` for parent-relative | `px` only for borders/shadows | `ch` for text widths (`max-width: 65ch`)

## Touch Targets

Minimum 44x44px (iOS) / 48x48px (Android). Add padding to small icons.

## Typography

- Body: 16px min | Small: 14px min | Line height: 1.5 body, 1.2 headings
- Fluid: `font-size: clamp(2rem, 5vw, 3rem)`

## Images

Use `srcset` and `sizes` for responsive images.

## Checklist

- [ ] Mobile-first layout
- [ ] Project's standard breakpoints
- [ ] Fluid layouts, no fixed widths
- [ ] Relative units (rem/em)
- [ ] Touch targets ≥ 44x44px
- [ ] Readable without zoom (16px+ body)
- [ ] No horizontal scrolling on mobile
- [ ] Tested at 375px, 768px, 1024px, 1440px
