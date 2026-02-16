---
paths:
  - "**/*.css"
  - "**/*.scss"
  - "**/*.sass"
  - "**/*.less"
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.html"
  - "**/*.vue"
  - "**/*.svelte"
---

# Design Standards

**Rule:** Commit to a clear aesthetic direction. Every visual choice must be intentional, not default.

## Design Direction Before Code

1. **Purpose** — What does this communicate? Trust? Energy? Precision?
2. **Audience** — Developers? Consumers? Enterprise?
3. **Tone** — Minimalist, editorial, brutalist, playful, luxurious, etc.
4. **Differentiator** — One memorable visual element

**Then commit.** A bold direction is always better than a directionless hedge.

## Typography

- **Display font** for personality (headings, hero), **body font** for readability (paragraphs, UI)
- Limit to 2 fonts (3 max with monospace). Use weight variation before adding fonts.
- **Avoid defaults:** Inter, Roboto, Arial, Space Grotesk signal no design thought
- **Good choices:** Playfair Display, JetBrains Mono, Outfit, DM Sans, Cabinet Grotesk, IBM Plex Sans

## Color

- **Clear hierarchy:** Primary (CTAs) → Accent (highlights) → Neutral (text, borders) → Semantic (success, error)
- Don't distribute colors evenly. Don't rely on color alone (WCAG 4.5:1).
- **Dark mode:** Design separately — don't just invert. Use deep navy, not pure black; off-white, not pure white.

## Spacing & Layout

- Generous whitespace — cramped signals low quality
- Consider asymmetric splits, overlapping elements, varied widths, full-bleed sections
- Negative space as a deliberate element

## Motion

- Every animation serves a purpose: guide attention, feedback, or continuity
- Max 500ms for UI elements. Never animate layout properties (use transform/opacity).
- **Always respect** `prefers-reduced-motion`

## AI Aesthetic Anti-Patterns

Avoid: purple gradients on white, symmetric 3-column grids, rounded cards with light shadow, blue CTAs, gradient text everywhere — these signal "AI-generated."

## Checklist

- [ ] Clear aesthetic direction established
- [ ] Intentional font choices
- [ ] Color palette with hierarchy
- [ ] Generous spacing
- [ ] Purposeful animations with `prefers-reduced-motion`
- [ ] Doesn't match AI aesthetic anti-patterns
- [ ] WCAG AA contrast (4.5:1)
