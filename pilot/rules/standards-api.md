---
paths:
  - "**/routes/**"
  - "**/api/**"
  - "**/controllers/**"
  - "**/endpoints/**"
  - "**/handlers/**"
---

# API Standards

## RESTful Design

- Resource-based URLs: `GET /users`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`
- Plural nouns for collections. Limit nesting to 2-3 levels.
- Query params for filtering (`?status=active`), sorting (`?sort=created_at`), pagination (`?page=2&limit=50`), search (`?q=john`)

## URL Conventions

Lowercase with hyphens or underscores — check existing endpoints and match. Never camelCase.

## HTTP Status Codes

| Range | Codes |
|-------|-------|
| **Success** | `200` OK, `201` Created (+Location header), `204` No Content |
| **Client Error** | `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `422` Unprocessable |
| **Server Error** | `500` Internal, `503` Unavailable |

## Response Structure

```json
// Success
{ "data": { ... }, "meta": { "timestamp": "..." } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

## Validation & Security

- Validate at API boundary: required fields, formats, business rules
- Never expose internal errors (stack traces, DB errors, file paths)

## Checklist

- [ ] REST principles followed
- [ ] Consistent URL naming
- [ ] Correct HTTP methods and status codes
- [ ] Validation at boundary
- [ ] Structured error responses
- [ ] Tests cover success and error cases
