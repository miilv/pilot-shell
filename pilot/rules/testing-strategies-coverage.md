---
paths:
  - "**/test_*.py"
  - "**/*_test.py"
  - "**/tests/**"
  - "**/conftest.py"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/__tests__/**"
  - "**/*_test.go"
---

## Testing Strategies and Coverage

**Core Rule:** Unit tests for logic, integration tests for interactions, E2E tests for workflows. Minimum 80% coverage required.

### Test Type Selection

| Type | Use When | Requirements |
|------|----------|--------------|
| **Unit** | Pure functions, business logic, data transformations, validation, utilities | < 1ms each, zero external deps (mock everything), single behavior per test, `@pytest.mark.unit` |
| **Integration** | Database queries, external APIs, message queues, file I/O, auth flows | Real test dependencies, setup/teardown fixtures, cleanup after each test, `@pytest.mark.integration` |
| **E2E** | Complete user workflows, API endpoint chains, data pipelines | Test entire flow end-to-end |

```
Does function use external dependencies?
├─ NO → Unit test (mock all external calls)
└─ YES → Integration test (use real dependencies)

Is this a complete user workflow?
├─ YES → E2E test
└─ NO → Unit or integration test
```

### Test Naming Convention

**Names must be self-documenting without reading code.**

- **Python:** `test_<function>_<scenario>_<expected_result>` (e.g., `test_process_payment_with_insufficient_funds_raises_error`)
- **TypeScript/JS:** `describe("<module>") + it("should <behavior> when <condition>")`

### Running Tests

```bash
# Python
uv run pytest -q                              # Quiet mode (preferred)
uv run pytest -q -m unit                      # Unit only
uv run pytest tests/unit/test_auth.py -q      # Specific file

# TypeScript/JS
bun test                                      # Bun
npm test -- --silent                          # Jest/Vitest quiet
```

### Coverage Requirements

1. Run coverage: `uv run pytest --cov=src --cov-report=term-missing --cov-fail-under=80`
2. Verify ≥ 80% on new code
3. Add tests for uncovered critical paths

**Must cover:** All business logic, API endpoints, data transformations, validation rules, error handling paths, conditional branches.

**Exclude:** `if __name__ == "__main__"` blocks, generated code, config files, simple getters/setters.

### ⛔ CRITICAL: Mandatory Mocking in Unit Tests

**Unit tests MUST mock ALL external calls. No exceptions.**

| Call Type | MUST Mock | Example |
|-----------|-----------|---------|
| HTTP/Network | `httpx`, `urllib`, `requests` | `@patch("module.httpx.Client")` |
| Subprocess | `subprocess.run`, `subprocess.Popen` | `@patch("module.subprocess.run")` |
| File I/O | `open`, `Path.read_text` | `@patch("builtins.open")` or `tmp_path` |
| Database | SQLite, PostgreSQL | Use test fixtures |
| External APIs | Any third-party service | Mock the client |

**Why:** Real calls make tests slow, flaky, and fail offline/CI. Mock at module level (where imported, not where defined).

**Detecting unmocked calls:** Test > 1s = unmocked I/O. "Connection refused" = unmocked network. Hangs = unmocked blocking call.

### E2E Testing: Frontend/UI (MANDATORY for web apps)

Use `playwright-cli` to verify what the user sees. API tests alone are insufficient.

```bash
playwright-cli open http://localhost:3000
playwright-cli snapshot                      # Get interactive elements with refs
playwright-cli fill e1 "test@example.com"
playwright-cli click e2
playwright-cli snapshot                      # Verify result
playwright-cli close
```

See `playwright-cli.md` for full command reference.

### Testing Anti-Patterns

- **Dependent tests** — Each test must work independently with clean state
- **Testing implementation, not behavior** — Test public API outputs, not internal variables
- **Asserting on mock existence** — Test real behavior, not that mocks are present
- **Test-only methods in production code** — Create test utilities instead
- **Incomplete mock data** — Mock data must match real API/response structure completely
- **Other:** No commented-out tests, no time-dependent assertions, no real network calls in unit tests

### AI Assistant Workflow

1. Search codebase for similar test patterns
2. Determine test type based on dependencies
3. Write failing test first (TDD)
4. Reuse existing fixtures, follow naming convention
5. Implement minimal code to pass
6. Run all tests to prevent regressions
7. Verify coverage ≥ 80%
8. Execute actual program

### ⛔ MANDATORY: Fix ALL Errors (Tests, Types, Lint)

**Fix ALL verification errors before marking work complete — no exceptions.** See `verification-before-completion.md` for full policy.

### Completion Checklist

- [ ] All new functions have tests
- [ ] Tests follow naming convention
- [ ] Unit tests mock external dependencies
- [ ] All tests pass
- [ ] Coverage ≥ 80% verified
- [ ] No flaky or dependent tests
- [ ] Actual program executed and verified

**If any checkbox unchecked, testing is incomplete.**
