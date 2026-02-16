---
paths:
  - "**/migrations/**"
  - "**/migrate/**"
  - "**/alembic/**"
  - "**/db/migrate/**"
---

# Migration Standards

## Core Principles

- **Reversible:** Every migration MUST have a working rollback. If irreversible, document why.
- **One logical change per migration:** Add a table, add a column, create an index — not all at once.
- **Never modify deployed migrations:** Create a new one to fix issues.

## Naming

Timestamps + descriptive: `20241118120000_add_email_to_users.py`. Name answers "what does this do?"

## Schema Changes

- **Adding NOT NULL columns:** Always specify `server_default` to avoid table locks
- **Removing columns:** Multi-step — deploy code that stops using it, then remove
- **Renaming columns:** Add new → write both → backfill → read new → remove old

## Indexes

- Use concurrent creation on large tables (`postgresql_concurrently=True`)
- Naming: `idx_<table>_<columns>`

## Data Migrations

- Separate from schema changes — never mix in one migration
- Batch process large datasets. Make idempotent (safe to re-run).

## Zero-Downtime

New migrations must work with currently deployed code. Deploy order: migration first, then new code.

## Red Flags — STOP

Modifying deployed migration, dropping column without multi-step plan, missing rollback, mixing schema+data, NOT NULL without default on large table, non-concurrent index on production.

## Checklist

- [ ] Descriptive timestamp-based name
- [ ] Rollback implemented and tested
- [ ] Ran up and down successfully
- [ ] No schema+data mixed
- [ ] Large indexes use concurrent creation
- [ ] NOT NULL columns have defaults
- [ ] Backwards compatible with deployed code
