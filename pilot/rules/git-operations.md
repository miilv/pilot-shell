## Git Operations - Read-Only by Default

**Rule:** Read git state freely. NEVER execute git write commands without EXPLICIT user permission.

**This rule is about git commands, not file operations.** Editing files is always allowed.

### ⛔ Write Commands Need Explicit Permission

**NEVER execute without user saying "commit", "push", etc.:**
`git add`, `commit`, `push`, `pull`, `fetch`, `merge`, `rebase`, `reset`, `revert`, `stash`, `checkout`, `switch`, `restore`, `cherry-pick`, `tag`, `remote`, `submodule`

**"Fix this bug" ≠ "commit it".** Make changes → run tests → STOP → wait for explicit git instruction.

### ⛔ Never Override .gitignore

**NEVER use `git add -f`.** If a file is gitignored, tell the user — don't force-add it. Even "stage everything" excludes gitignored files.

### ⛔ Never Selectively Unstage

When the user says "commit", commit ALL staged changes as-is. Don't use `git reset HEAD` to curate the changeset.

### Read Commands — Always Allowed

`git status`, `git diff [--staged]`, `git log`, `git show`, `git branch [-a]` — use freely to understand repo state.

### When User Gives Permission

- Execute directly — don't re-ask for confirmation
- Follow commit message format from `.claude/rules/git-commits.md`
- `commit` and `push` are separate permissions

### Exceptions

- **Explicit user override:** "checkout branch X" → do it
- **Worktree during /spec:** When `Worktree: Yes`, git commits are allowed in the isolated worktree branch (not pushed, synced via squash merge after verification)
