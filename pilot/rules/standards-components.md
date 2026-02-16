---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.vue"
  - "**/*.svelte"
---

# Components Standards

**Core Rule:** Small, focused components with single responsibility. Compose complex UIs from simple pieces.

## Design Principles

- **Single responsibility:** If you need "and" to describe it, split it
- **Composition over configuration:** Combine simple components, don't add props
- **Minimal props:** Keep under 5-7. More = component doing too much
- **Explicit prop types:** Always use TypeScript interfaces with sensible defaults

## State Management

- Keep state local — only lift when multiple components need it
- If prop drilling 3+ levels, use composition or context instead

## Naming

- **Components:** PascalCase nouns (`UserCard`, `SearchInput`)
- **Props:** camelCase. Booleans: `is*`, `has*`, `should*`, `can*`
- **Events:** `on*` for props, `handle*` for internal functions

## When to Split

- Component exceeds 200-300 lines
- Multiple responsibilities or complex conditional rendering
- Part is reusable elsewhere
- Testing becomes difficult

## Checklist

- [ ] Single, clear responsibility
- [ ] Props typed with defaults
- [ ] State as local as possible
- [ ] No prop drilling beyond 2 levels
- [ ] Under 300 lines
- [ ] Tested
