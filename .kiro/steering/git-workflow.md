# Git Workflow Rules

## Main repository

- The main remote is `origin` → https://github.com/mydesignstation-cmyk/jba-valuation.git
- Keep pushing work here. The connected branch syncs back to Lovable, so keep it in a working state.
- Never rewrite published history: no force push, no rebase/amend/squash of commits that are already pushed.

## Commit before big refactors (checkpoint rule)

Before starting any large or risky change, create a checkpoint commit first so there is a clean point to restore to.

A change counts as "big" when it does any of the following:
- Touches many files at once (roughly 5+ files) or spans multiple modules/features.
- Renames, moves, or deletes files or folders in bulk.
- Restructures architecture (routing, data layer, services, DB schema, build config).
- Changes shared/foundational code that many other files depend on.
- Migrations or dependency upgrades that are hard to reverse.

Checkpoint procedure:
1. Make sure the working tree currently builds / is in a usable state.
2. Stage and commit the current state with a clear checkpoint message, e.g.
   `git add -A && git commit -m "checkpoint: before <describe refactor>"`
3. Push the checkpoint to `origin` so the restore point exists remotely too.
4. Then begin the refactor.

This gives a safe history point to `git revert` or restore from if the refactor goes wrong.

## Never stash, never delete as storage (backup-folder rule)

The 2026-09-26 near-loss happened because real work lived only in a `git stash`
and was almost lost. To make sure this never happens again:

- **NEVER run `git stash`.** Not `stash push`, not `stash pop`, not `stash -k`.
  If changes must be set aside, copy the affected files into a new
  `backups/<YYYY-MM-DD_HHmm>_<short-desc>/` folder (mirroring their paths) with
  a `MANIFEST.txt` describing what and why. Then continue.
- **NEVER hard-delete tracked files** with `rm -rf`, `git clean -fd`,
  `Remove-Item -Recurse -Force`, or bulk deletion without first dumping a copy
  into a `backups/` folder. Prefer `git rm` (recoverable via history) over raw
  filesystem deletes, and still back up first when in doubt.
- **NEVER `git reset --hard`, `git checkout -- .`, or `git checkout <ref> -- .`
  across many files** without a checkpoint commit or a backup dump first.
- The `backups/` folder is committed to git but is inert (never imported by the
  app). It is the durable safety net; git stash/danglings are NOT.

## Recovery-first policy (search everywhere before assuming loss)

If work seems missing or the tree looks stale/inconsistent, **investigate and
report before changing anything**. Search all recovery sources in this order:

1. `git status`, `git branch -a`, `git log --oneline --all`
2. `git stash list`
3. `git reflog -30` (find resets/clones/checkouts)
4. `git fsck --no-reflogs --lost-found` → inspect **dangling commits/blobs**
   with `git show <sha> --stat` and `git show <sha>:<path>`
5. Remote branches: `git fetch --all` then `git branch -r`
6. The `backups/` folder in this repo

Only after exhausting these do you conclude something is truly lost. When
recovering, restore into a branch or a checkpoint commit, verify with
`tsc --noEmit` + `npm run build`, and keep a copy in `backups/`.

## Consistency guard for commits

Before committing a large change, confirm the snapshot is internally
consistent — foundational files (`src/types`, `src/schemas`, `src/lib`) must
match the components that depend on them. Run `npx tsc --noEmit` and
`npm run build` and only commit when both are green. Never commit a partial mix
of new components with stale types/schema (that was the root cause of the
0211a20 incident).
