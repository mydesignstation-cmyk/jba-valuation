# Implementation Plan

- [x] 1. Gate the case-list Edit action by both the exact pending stage and the signed-in admin role.
      Update the shared `renderActions` function in `src/routes/_app/cases.index.tsx`, which feeds both the desktop table Actions menu and the mobile `CaseListCard` menu. Render the existing Edit item only when `c.stage === "FIELD_VISIT_PENDING"` and `can(user?.role, "cases.update")` is true; `cases.update` is the existing centralized permission whose role set is `SUPER_ADMIN` and `ADMIN`. Keep the View item, Delete behavior, case form, and all other actions unchanged. Do not change database schema, migrations, or server data behavior.
      Files: `src/routes/_app/cases.index.tsx`
      Verify: Run the application through the actual cases-list route with an authenticated `ADMIN` or `SUPER_ADMIN`, and inspect the Actions menu for cases in `FIELD_VISIT_PENDING`, `FIELD_VISIT_SUBMITTED`, and at least one later stage. Confirm Edit is visible only for `FIELD_VISIT_PENDING`, hidden for every other stage, and View/Delete behavior is unchanged. Repeat with a non-admin role that can reach a case list where applicable and confirm Edit is hidden even for `FIELD_VISIT_PENDING`. Do not perform database writes while verifying; use existing records or read-only navigation.

- [x] 2. Run the repository’s focused static validation after the gate change.
      Validate the changed route and its existing permission/status imports using the project’s available commands. The repository has no test script, Vitest configuration, or existing application test files, so do not add unrelated tests; preserve the existing conventions. Confirm there are no database or migration file changes.
      Files: `src/routes/_app/cases.index.tsx` (validation only; no additional implementation files expected)
      Verify: `npx tsc --noEmit` completes successfully, then `npm run build` completes successfully. Also run `npm run lint` if available in the working tree and resolve only issues caused by this change. Confirm `src/db/migrations/**` is untouched and no database command or write was run.

- [x] 3. Record the runtime evidence and final scope for review.
      Document that the same shared action renderer covers desktop and mobile list paths, that the exact internal stage key—not the display label—is used, and that admin/super-admin identity is resolved through `useCurrentUser()` and `can(..., "cases.update")`. Include the tested role/status matrix and any environment limitation if an authenticated runtime check cannot be completed.
      Files: `.agents/tasks/edit-gate-fix-plan.md` and the implementation review notes/evidence location selected by the workflow; do not modify schema or migrations.
      Verify: Review the final diff and confirm it contains only the intended UI gate and any focused evidence updates, with no database writes or migration changes; rerun `npx tsc --noEmit` and `npm run build` after any evidence-related source adjustment.

## Verification evidence

- Changed `src/routes/_app/cases.index.tsx` only: the shared `renderActions` renderer now renders Edit only when `c.stage === "FIELD_VISIT_PENDING"` and `can(user?.role, "cases.update")` is true. This covers both desktop and mobile menus; View and Delete were unchanged.
- The centralized permission map confirms `cases.update` is limited to `SUPER_ADMIN` and `ADMIN`.
- Role/status matrix from the application gate: ADMIN + FIELD_VISIT_PENDING = shown; SUPER_ADMIN + FIELD_VISIT_PENDING = shown; ADMIN or SUPER_ADMIN + FIELD_VISIT_SUBMITTED or any later/other stage = hidden; all non-admin roles + any stage = hidden.
- Runtime/browser limitation: this repository has no Playwright/browser harness or application test files, so an authenticated interactive menu inspection could not be automated in this step. No database command or write was run. The configured read-only application database host was checked as `ep-muddy-math-b3on57py.c-4.ap-southeast-1.aws.neon.tech`; no connection was made.
- Commands run: `npx tsc --noEmit` (fails on pre-existing `src/components/case/CaseWithCustomerTabs.tsx:104`, optional `email` incompatibility under `exactOptionalPropertyTypes`, and unrelated `src/routes/_app/cases.$caseId.index.tsx:475`, missing `api_reassignSiteEngineer`); `npm run build` (passes); `npm run lint` (fails repository-wide with 10,705 Prettier CRLF errors and 7 warnings). `git diff --check` passed. Migration status check confirmed no changes under `src/db/migrations/**`. No database command or write was run.
