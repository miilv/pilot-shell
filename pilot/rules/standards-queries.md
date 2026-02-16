---
paths:
  - "**/*.sql"
  - "**/queries/**"
  - "**/repository/**"
  - "**/repositories/**"
  - "**/dao/**"
---

# Queries Standards

**Core Rule:** Secure, performant queries using parameterized statements, eager loading, and strategic indexing.

## SQL Injection Prevention — Mandatory

**NEVER concatenate user input into SQL.** Always parameterized queries or ORM methods. Applies to all user input: query params, form data, URLs, headers, cookies.

## N+1 Prevention

Use eager loading: `joinedload` for one-to-one/small one-to-many, `selectinload` for large collections.

## Performance

- **Select only required columns** — not `SELECT *`
- **Filter in DB, not app** — don't load all records then filter in Python
- **Avoid leading wildcards** — `LIKE '%term'` can't use indexes
- **Set query timeouts:** Simple 1-2s, reports 10-30s, background 60s+

## Transactions

Use for multiple related writes that must succeed/fail together and read-then-write scenarios (with `FOR UPDATE`).

## Checklist

- [ ] All user input parameterized
- [ ] No N+1 queries
- [ ] Only required columns selected
- [ ] Indexes on WHERE/JOIN/ORDER BY columns
- [ ] Related writes in transactions
- [ ] Timeouts set
- [ ] Tested with realistic data volumes
