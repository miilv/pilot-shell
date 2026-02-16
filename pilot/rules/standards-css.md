---
paths:
  - "**/*.css"
  - "**/*.scss"
  - "**/*.sass"
  - "**/*.less"
  - "**/*.module.css"
---

# CSS Standards

**Rule:** Follow project methodology consistently, use design tokens, leverage framework patterns.

## Identify Methodology First

Check existing codebase: **Utility-first** (Tailwind), **CSS Modules**, **BEM**, or **CSS-in-JS** (styled-components). Once identified, use exclusively — never mix.

## Design Tokens

Always use tokens over hardcoded values: `var(--color-primary)` not `#3b82f6`. Check for existing tokens before creating new ones.

## Framework Patterns

Work with the framework, not against it. If you need `!important` or deep overrides, reconsider your approach.

## Custom CSS

Only for: complex animations, unique effects not in framework, third-party integration, browser-specific fixes.

## Performance

Avoid: importing entire frameworks for few components, duplicate styles, overly specific selectors (`.a .b .c .d`), large inline styles.

## Checklist

- [ ] Followed project CSS methodology
- [ ] Used design tokens, not hardcoded values
- [ ] Leveraged framework utilities
- [ ] No `!important` or deep overrides
- [ ] No unused styles
