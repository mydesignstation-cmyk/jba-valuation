# Version Planning & Git/GitHub Strategy

Authoritative process for how this project is versioned, branched, and released.
Goal: **no more accidental loss of work, ever.** Pair this with the enforcement
rules in `.kiro/steering/git-workflow.md`.

Repository: `origin` → https://github.com/mydesignstation-cmyk/jba-valuation.git
This repo is connected to Lovable; the connected branch syncs back, so it must
always stay in a working (buildable) state.

---

## 1. Branching model

A lightweight trunk-based model with short-lived feature branches.

- `main` — the connected, always-deployable trunk. Synced to Lovable.
  - Always builds green (`tsc --noEmit` + `npm run build`).
  - Never rebased, force-pushed, or history-rewritten.
- `feat/<short-name>` — one branch per feature or fix. Branch off `main`,
  merge back via PR, delete after merge.
- `fix/<short-name>` — bug fixes.
- `chore/<short-name>` — deps, config, docs, tooling.
- `checkpoint/<desc>` — optional throwaway branch to snapshot risky work.

Naming: lowercase, dash-separated, e.g. `feat/site-engineer-dropdown`,
`fix/case-detail-crash`.

### Why branches
Every unit of work gets its own branch and its own PR. That means work is always
pushed to the remote (a durable backup) and never lives only in an uncommitted
working tree or a stash.

---

## 2. Day-to-day workflow

1. `git switch main && git pull` — start from fresh trunk.
2. `git switch -c feat/<name>` — create a feature branch.
3. Work in small commits. Commit early and often (see §4).
4. Push the branch the first time you have anything worth keeping:
   `git push -u origin feat/<name>`. Push again after each meaningful commit.
5. Keep the branch buildable. Run `tsc --noEmit` + `npm run build` before push.
6. Open a PR into `main` (see §5). Merge when green.
7. Delete the merged branch locally and on GitHub.

**Push at least once a day for any active branch.** Unpushed local commits are
not backed up.

---

## 3. What must NEVER happen (hard rules)

These mirror `.kiro/steering/git-workflow.md`:

- No `git stash` as storage. Use a `backups/<timestamp>_<desc>/` folder instead.
- No hard deletes of tracked files without a backup copy first.
- No `git reset --hard` / `git checkout -- .` / bulk `checkout <ref> -- .`
  without a checkpoint commit or backup dump.
- No force push, rebase, amend, or squash of commits already pushed.
- No committing a partial snapshot: new components must ship with their matching
  `types`/`schemas`/`lib`. Verify with a green build before committing.

---

## 4. Commit conventions

Use Conventional Commits so history is readable and (later) automatable:

```
<type>(<optional scope>): <summary>

<optional body: what and why>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `restore`,
`checkpoint`.

Examples:
- `feat(cases): real Site Engineer dropdown from Neon Auth users`
- `restore: recover Banks/Branches pages from lost stash`
- `checkpoint: before routing refactor`

Commit small and often. A commit is the cheapest, most reliable backup.

---

## 5. Pull requests

- One PR per branch, targeting `main`.
- PR description: summary of changes, what was tested, anything blocked.
- Required before merge: `tsc --noEmit` green, `npm run build` green.
- Prefer "Squash and merge" **only** for unpushed local cleanliness within the
  branch — never squash/rewrite commits that others (or Lovable) already pulled.
- Delete the branch after merge.

---

## 6. Release versioning (SemVer + tags)

Version format `MAJOR.MINOR.PATCH` (SemVer):
- MAJOR — breaking changes (schema/data-model breaks, incompatible API).
- MINOR — new features, backward compatible.
- PATCH — bug fixes, backward compatible.

Process:
1. When `main` reaches a release-worthy state, tag it:
   `git tag -a v0.2.0 -m "v0.2.0: banks/branches/cases pages"`.
2. Push tags: `git push origin --tags`.
3. Tags are immutable restore points. Never move or delete a published tag.

Maintain a `CHANGELOG.md` (Keep a Changelog style) with an entry per release.

Current baseline: pre-1.0 (`0.x`). Treat `0.x` MINOR bumps as feature drops and
PATCH as fixes. Move to `1.0.0` when the core valuation workflow is complete.

---

## 7. Checkpoints & restore points

- Before any "big" change (see steering: 5+ files, renames/deletes, arch/schema
  changes, dep upgrades), make a checkpoint commit and push it, OR create a
  `checkpoint/<desc>` branch.
- Also create a lightweight tag for notable safe states:
  `git tag checkpoint-<desc>` (kept locally; promote to a release tag if it
  becomes a milestone).
- Keplt tags let you `git switch --detach <tag>` to inspect or branch from a
  known-good state without touching `main`.

---

## 8. Recovery playbook (if work looks lost)

Do NOT change files first — investigate and report. Search in order:

1. `git status` · `git branch -a` · `git log --oneline --all`
2. `git stash list`
3. `git reflog -30`
4. `git fsck --no-reflogs --lost-found` → `git show <sha> --stat`,
   `git show <sha>:<path>`
5. `git fetch --all` · `git branch -r`
6. The `backups/` folder

Recover into a branch/checkpoint, verify `tsc --noEmit` + `npm run build`, keep
a copy in `backups/`, then commit and push.

---

## 9. Environment & secrets

- `.env.local` and `.neon` are gitignored and must stay that way. Never commit
  secrets.
- Database URL / Neon Auth URLs live only in `.env.local`.
- The `backups/` folder must never contain secret files — code and docs only.

---

## 10. Quick reference

```bash
# start work
git switch main && git pull
git switch -c feat/my-thing
git push -u origin feat/my-thing        # back it up remotely early

# during work (commit small, push often)
git add <files> && git commit -m "feat: ..."
git push

# set work aside SAFELY (never stash)
#   copy files -> backups/<ts>_<desc>/ , add MANIFEST.txt, commit

# before any big/risky change
git commit -am "checkpoint: before <desc>" && git push

# release
git tag -a v0.X.0 -m "..." && git push origin --tags
```
