---
paths:
  - "**/models/**"
  - "**/models.py"
  - "**/schema.prisma"
  - "**/schema/**"
  - "**/entities/**"
---

# Models Standards

**Core Rule:** Models define data structure and integrity. No business logic, no API calls.

## Naming

- **Models:** Singular PascalCase (`User`, `OrderItem`)
- **Tables:** Plural snake_case (`users`, `order_items`)
- Avoid: `data`, `info`, `record`, `entity`

## Required Fields

- `created_at` and `updated_at` timestamps on every model
- Explicit primary keys (UUIDs for distributed, auto-increment for simplicity)

## Data Integrity at DB Level

Use constraints, not just application validation: `unique=True`, `nullable=False`, `CheckConstraint`, `ForeignKey` with explicit `ondelete`.

## Data Types

| Data | Use | Avoid |
|------|-----|-------|
| Money | DECIMAL(10,2) | FLOAT |
| Boolean | BOOLEAN | TINYINT |
| Timestamps | TIMESTAMP/DATETIME | VARCHAR |
| JSON | JSON/JSONB | TEXT |
| UUIDs | UUID | VARCHAR(36) |

## Indexes & Relationships

- Index foreign keys and columns in WHERE/JOIN/ORDER BY. Don't over-index.
- Define both sides of relationships with explicit cascade behavior.

## Scope

**In models:** Fields, relationships, simple properties, data validation, constraints.
**Not in models:** Business logic, API calls, complex calculations, emails.

## Checklist

- [ ] Singular model, plural table
- [ ] Primary key, timestamps
- [ ] NOT NULL on required fields, UNIQUE where appropriate
- [ ] Foreign keys with cascade behavior
- [ ] Indexes on queried columns
- [ ] Appropriate data types
- [ ] Relationships on both sides
