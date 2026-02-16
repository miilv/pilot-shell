## TDD (Test-Driven Development) - Mandatory Workflow

**⛔ STOP: Do you have a failing test? If not, write the test FIRST.**

**Core Rule:** No production code without a failing test first.

### The Red-Green-Refactor Cycle

#### 1. RED — Write one minimal test for the desired behavior
- Tests one specific behavior, focuses on behavior not implementation
- Uses real code (mocks only for external dependencies)
- **Naming:** Python: `test_<function>_<scenario>_<expected>` | TS: `it("should <behavior> when <condition>")`

#### 2. VERIFY RED — Run the test, confirm it fails
- Must fail because the feature doesn't exist (not syntax errors)
- If test passes immediately → you're testing existing behavior, rewrite it

#### 3. GREEN — Write the simplest code that passes
- Only what the test requires. No extras, no refactoring. Hardcoding is fine.

#### 4. VERIFY GREEN — Run all tests, confirm they pass
- Fix implementation if new test fails. Fix immediately if other tests break.
- Check diagnostics for type errors or lint issues.

#### 5. REFACTOR — Improve code quality (tests must stay green)
- Remove duplication, improve names, extract helpers. No new behavior.

### When TDD Applies

**Always:** New functions/methods, API endpoints, business logic, bug fixes (reproduce first), behavior changes.

**Skip:** Documentation, config updates, dependency versions, formatting-only.

**When uncertain, use TDD.**

### Recovery: Code Written Before Test

If production code was written without a test first:
1. Do NOT revert — write the test immediately (it will pass, that's fine)
2. Verify the test catches regressions
3. Apply TDD properly for remaining work

**Goal is test coverage, not ritual.** But recovery mode is the exception, not the default.

### Common Mistakes

- **Test passes immediately** → Rewrite it — you're testing existing behavior
- **Skipping verification** → Always run tests and show output, never assume
- **Testing implementation** → Test what code does, not how. Tests should survive refactoring.
- **Unnecessary mocks** → Only mock external deps (APIs, DBs, filesystem)

### Checklist

- [ ] Every new function has at least one test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass (executed and verified)
- [ ] Diagnostics clean
- [ ] Mocks only for external dependencies
