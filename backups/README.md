# Backups

Safety net for this project. **Nothing is ever stashed or hard-deleted** — when
a file or snapshot needs to be set aside, a copy is dumped here first.

## Why this exists

On 2026-09-26 a large piece of in-progress work (real Banks/Branches/Cases
pages + matching `types`/`schema`) was only living in a `git stash` and was
nearly lost when a mismatched snapshot got committed. The work was recovered
from a dangling stash commit (`52ce3c0`), but it was a close call.

To prevent a repeat, the rule is now: **never rely on `git stash` or deletion
as storage.** Put a copy in this folder instead.

## Layout

Each backup is a timestamped folder:

```
backups/YYYY-MM-DD_HHmm_<short-description>/
  <mirrored file paths...>
  MANIFEST.txt          # what/why, and how to restore
```

## Rules (see .kiro/steering/git-workflow.md for the authoritative version)

1. Never run `git stash`. If you must set changes aside, copy the affected
   files into a new `backups/<timestamp>_<desc>/` folder first.
2. Never `git clean -fd`, `rm -rf`, or bulk-delete tracked files without first
   copying them into a backup folder.
3. Before any risky/large change, make a checkpoint commit AND (if files are
   being removed/replaced) drop copies here.
4. Backups are kept in git history but this folder is otherwise inert — it is
   never imported by the app.

## Restoring from a backup

Copy the file(s) back to their original path, then run `tsc --noEmit` and
`npm run build` before committing.
