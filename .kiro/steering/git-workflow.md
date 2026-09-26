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
