# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/); versioning
follows [SemVer](https://semver.org/). See `docs/VERSION_PLAN.md` for process.

## [Unreleased]

### Added
- Real Site Engineer dropdown in Add Case, sourced from Neon Auth users
  (`neon_auth."user"` where `role = 'SITE_ENGINEER'`), replacing mock data.
- Server function boundary `src/data/user.functions.ts` (createServerFn) and
  server-side `api_listSiteEngineers` / `api_getSiteEngineer` in `api.server.ts`.
- `docs/VERSION_PLAN.md` — git/GitHub branching, release, and recovery strategy.
- `backups/` folder + policy — durable safety net; never stash or hard-delete.
- Strict safety rules in `.kiro/steering/git-workflow.md` (no stash, no delete
  as storage, recovery-first, consistency guard).

### Fixed
- Recovered real Banks/Branches/Cases pages and consistent `types`/`schema`
  that were dropped when an earlier commit was assembled from a mismatched
  snapshot. Restored from dangling stash `52ce3c0` (commit `5d67e97`).

### Removed
- `src/mocks/users.ts` (mock site engineers) — replaced by real Neon Auth data.

## History (pre-changelog commits)
- `5d67e97` restore: recover real pages + consistent types/schema from lost stash
- `0211a20` Add Neon DB integration, CRUD services, forms, and git workflow steering
- `0808884` Add project README
- `5afbbd7` Added sign-in and roles
