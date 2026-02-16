## Execution Verification

**Core Rule:** Tests passing ≠ Program working. Always execute and verify real output.

### Unit Tests Are NOT Execution

Unit tests with mocks prove nothing about real-world behavior. After tests pass:

- CLI command → **run it**
- API endpoint → **call it**
- Frontend UI → **open with playwright-cli**
- File parsing → **parse a real file**
- Any runnable program → **run it**

### When to Execute

After tests pass, after refactoring, after changing imports/deps/config, after adding features, before marking any task complete. **If there's a runnable program, RUN IT.**

**Skip only for:** documentation-only, test-only, pure internal refactoring (no entry points), config-only changes.

### Output Correctness

**Running without errors ≠ correct output.** If code processes external data, fetch that data independently and compare:
1. Get source/expected data (API call, file read, DB query)
2. Compare against what your code produced
3. Numbers and content MUST match

### Evidence Required

Show concrete evidence, not assumptions:
- "Ran `python app.py` — output: [logs]"
- "GET /health returned 200"
- NOT "tests pass so it should work" or "I'm confident"

### When Execution Fails After Tests Pass

This is a real bug. Fix immediately → re-run tests → re-execute → add test to catch this failure type.

### Checklist

- [ ] All tests pass
- [ ] Executed actual program
- [ ] Verified output is correct (shown evidence)
- [ ] No runtime errors
- [ ] Side effects verified (files, DB, APIs)

**Default action: Execute.**
