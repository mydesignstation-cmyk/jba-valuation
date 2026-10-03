# Implementation Plan

## Confirmed root cause

The button is hidden by an over-broad field-visit eligibility check in `src/routes/_app/cases.$caseId.index.tsx:384-388`:

```tsx
const engineerReassignable =
  (valuationCase.stage === "ASSIGNED" || valuationCase.stage === "FIELD_VISIT_PENDING") &&
  !fieldVisitLoading &&
  !fieldVisit;
const showReassignSiteEngineer = canReassignSiteEngineer && engineerReassignable;
```

For an eligible Administrator whose case is `FIELD_VISIT_PENDING`, `canReassignSiteEngineer` is true, and the stage check is true, but any returned `field_visits` row makes `!fieldVisit` false. The requested cutoff is a **submitted** field visit, not merely the presence of an unsent/draft row. The current `api_getCaseFieldVisit` returns any row by `case_id`, and `mapFieldVisitRow` represents a non-`SUBMITTED` row as `status: "DRAFT"`; therefore the current UI condition suppresses the button for a pending case with a draft visit. This is the single confirmed gating defect.

The role path was traced and is not the cause: `src/types/index.ts` defines `ADMIN` in the `Role` union; `src/lib/auth-client.ts:94-105` accepts only the exact uppercase role values and returns `role: "ADMIN"`; `roleLabels` displays that value as `Administrator`; `src/lib/permissions.ts` grants `cases.reassignSiteEngineer` to `ADMINS = ["SUPER_ADMIN", "ADMIN"]`; and `src/lib/route-guard.ts` passes the same `user.role` into `can()`. No role normalization or permission-map mismatch exists in the inspected code.

## Verification performed

- `git status --short` confirmed the existing local reassignment work is uncommitted. It was preserved; no stash, reset, checkout, discard, database access, or `.env.local` change was performed.
- `git diff` confirmed the permission, dialog, client mutation, server mutation, and case-detail changes are present as local work. The relevant button JSX is at approximately lines 555-561, guarded only by `showReassignSiteEngineer`.
- `npx tsc --noEmit` ran and failed only on the pre-existing `src/components/case/CaseWithCustomerTabs.tsx:104` `exactOptionalPropertyTypes` error. No error was reported from the reassignment files.
- `npm run build` ran successfully and produced the Vite/Nitro production build.
- An executable Node truth table evaluated the current and corrected predicates: for `ADMIN + FIELD_VISIT_PENDING + { status: "DRAFT" }`, the current predicate is `false` and the corrected predicate is `true`; for `{ status: "SUBMITTED" }`, both are `false`; non-admin, later-stage, and loading cases remain `false` under the corrected predicate.
- No database query or write was used to reproduce the case, in accordance with the project database rule. The runtime data point to verify during implementation is that VAL-2026-0008's case-detail query returns a non-submitted visit row while its case stage remains `FIELD_VISIT_PENDING`.

## Ordered implementation steps

- [x] 1. Narrow the case-detail UI eligibility predicate to distinguish draft/non-submitted visits from submitted visits. Replaced the `!fieldVisit` term in `src/routes/_app/cases.$caseId.index.tsx` with `fieldVisit?.status !== "SUBMITTED"`, while retaining the existing `!fieldVisitLoading` and `ASSIGNED`/`FIELD_VISIT_PENDING` stage checks. The existing `canReassignSiteEngineer` permission gate remains unchanged.
      Files: `src/routes/_app/cases.$caseId.index.tsx`
      Verify: run `npx tsc --noEmit` and `npm run build`; build must pass, and TypeScript must show no new errors beyond the known `CaseWithCustomerTabs.tsx:104` baseline error. Re-run the eligibility truth table for draft, submitted, non-admin, later-stage, and loading inputs.

- [x] 2. Preserved the authorization and lifecycle invariants while reviewing the resulting diff. The button remains absent for roles other than `ADMIN` and `SUPER_ADMIN`; absent while the field-visit query is loading; absent at `FIELD_VISIT_SUBMITTED` and every later stage; and absent whenever the returned field-visit row has `status: "SUBMITTED"`. No permission, route-guard, server authorization, schema, migration, or `.env.local` changes were made.
      Files: `src/routes/_app/cases.$caseId.index.tsx` (predicate fix); existing `src/lib/permissions.ts` and `src/server/api.server.ts` reviewed and preserved.
      Verify: `git diff --check` passed and `npm run build` passed. A static eligibility truth table confirmed the admin/draft case is visible while submitted, non-admin, later-stage, and loading cases are hidden. The existing popup and server-side target/current-engineer checks remain unchanged.

## Verification note (2026-09-26)

- `npx tsc --noEmit`: failed only with the known baseline `src/components/case/CaseWithCustomerTabs.tsx:104` `exactOptionalPropertyTypes` optional-email error; no new errors were reported in the reassignment change.
- `npm run build`: passed.
- `npm run lint`: failed with the known repository-wide Prettier CRLF line-ending baseline (`10710` problems, predominantly `Delete ␍`); this was not caused by the focused change.
- `git diff --check`: passed.
- Static truth table: `ADMIN + FIELD_VISIT_PENDING + DRAFT` => visible; `ADMIN + ... + SUBMITTED` => hidden; non-admin, `FIELD_VISIT_SUBMITTED`/later, and loading => hidden.
- Role trace: `auth-client.ts` accepts the exact `ADMIN` role and labels it `Administrator`; `cases.$caseId.index.tsx` passes `currentUser.role` to `can(currentUser?.role, "cases.reassignSiteEngineer")`; `permissions.ts` grants that permission to `ADMIN` and `SUPER_ADMIN`. Therefore an authenticated Administrator reaches the corrected visible-button predicate for an eligible pending case.
- No database connection, query, write, migration, or `.env.local` modification was performed. Browser verification was not run in this step; runtime data should still be checked through the normal UI if needed.

- [ ] 3. Validate the reported case in the deployed/local browser without changing data outside the normal requested reassignment flow. Sign in as an Administrator, open VAL-2026-0008 directly, wait for the case and field-visit queries to settle, and confirm the stage/visit status shown in the loaded response. If the visit row is `DRAFT`, confirm the corrected button appears; if it is `SUBMITTED` or no longer `FIELD_VISIT_PENDING`, document that the required guard correctly hides it and investigate the stale screenshot/data state separately rather than weakening the guard.
      Files: runtime verification only; no additional source files unless the browser evidence disproves the diagnosis.
      Verify: normal `npm run dev`/preview flow and browser console/network inspection; no database command, migration, or environment-file modification.

## Scope and assumptions

This is a focused UI gating fix. The current application has no draft-save mutation—the normal field-visit submission creates a `SUBMITTED` row and advances the case stage—so the change does not alter the server cutoff or field-visit ownership. If runtime evidence shows that an inconsistent `DRAFT` row must also be accepted by the server, stop and report that as a separate server behavior decision; do not weaken authorization or silently change the server mutation as part of this UI-only fix.
