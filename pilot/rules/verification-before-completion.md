## Verification Before Completion

**Core Principle:** Evidence before claims. No completion claims without fresh verification output in the current message.

### Workflow

1. **Identify** — What command proves this claim?
2. **Execute** — Run the full command (not cached)
3. **Read** — Check exit code, count failures, read output
4. **Confirm** — Does output actually prove the claim?
5. **Report** — State claim WITH evidence

**If you haven't run the command in this message, you cannot claim it passes.**

### What Requires Verification

| Claim | Required Evidence | Insufficient |
|-------|-------------------|-------------|
| "Tests pass" | Fresh run: 0 failures | Previous run, "should pass" |
| "Linter clean" | Linter output: 0 errors | Assumption |
| "Build succeeds" | Build exit 0 | "Linter passed" |
| "Bug fixed" | Reproducing test passes | "Code changed" |
| "Output correct" | Compared against source data | "Logs look reasonable" |
| "UI works" | playwright-cli snapshot | "API returns 200" |

### ⛔ Fix ALL Errors — No Exceptions, No Asking

When verification reveals errors, fix ALL of them. Never ask "should I fix these?" — just fix them.

**Invalid excuses:** "Pre-existing errors", "unrelated to my changes", "type errors in other files" → Fix them anyway. You found them, you own them.

### ⛔ Auto-Fix in /spec Workflow

- **must_fix** and **should_fix** → Fix immediately without asking
- **suggestions** → Implement if quick and reasonable
- The ONLY user interaction in /spec is plan approval

### Stop Signals — Verify NOW

If you're about to use uncertain language ("should", "probably"), express satisfaction ("Done!"), commit/push, mark task complete, or trust reports without checking — run verification first.

### Correct vs Incorrect

- ✅ Run `pytest` → "34 passed" → claim passes
- ❌ "Should pass now" / "Tests look correct"
- ✅ `playwright-cli snapshot` → see expected elements → "UI works"
- ❌ "API works, so frontend should work"
