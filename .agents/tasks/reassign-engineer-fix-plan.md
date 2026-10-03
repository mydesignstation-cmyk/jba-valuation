# Implementation Plan

## Findings and decisions

The current `src/routes/_app/cases.$caseId.index.tsx` contains the case query, field-visit query, Maker action wiring, and `AssignMakerDialog`, but it does not import or render `ReassignSiteEngineerDialog`, does not import/call `api_reassignSiteEngineer`, and has no Site Engineer reassignment state or handler. The existing `src/lib/permissions.ts` permission `cases.reassignSiteEngineer` already grants access only to `ADMIN` and `SUPER_ADMIN`; preserve that permission instead of duplicating role logic in the UI.

The existing `ReassignSiteEngineerDialog` already loads active Site Engineers through `listSiteEngineers` and excludes the current engineer ID. The existing server function already verifies `ADMIN`/`SUPER_ADMIN`, validates an active `SITE_ENGINEER` target, requires a non-null existing assignment, rejects a same-engineer target, and locks the case row in the same transaction pattern as field-visit submission. Only its field-visit-row cutoff needs correction: a `DRAFT`/non-submitted row must remain reassignment-eligible, while a `SUBMITTED` row must be rejected.

No initial assignment is being added: the action must require an existing `assignedEngineerId`. No `.env.local`, migration/schema, generated `.output`, or database work is part of this correction.

## Ordered implementation steps

- [x] 1. Restore the case-detail Site Engineer reassignment integration with the exact visibility gate. Import `api_reassignSiteEngineer` from `@/data/case.functions` and `ReassignSiteEngineerDialog` from `@/components/case/ReassignSiteEngineerDialog`; add reassignment dialog-open/submitting state and a handler that obtains the session token, calls the existing client server function with the case ID and selected target, shows success/error feedback, refreshes the case and relevant case-list queries, and closes the dialog on success. Render the `Reassign Site Engineer` button beside the existing case actions and mount the dialog using the current engineer ID.
      The button’s single render predicate must require all of: `can(currentUser?.role, "cases.reassignSiteEngineer")` (therefore only `ADMIN`/`SUPER_ADMIN`), `valuationCase.stage === "FIELD_VISIT_PENDING"` exactly (not `ASSIGNED`, `FIELD_VISIT_SUBMITTED`, `MAKER_ASSIGNED`, or any later stage), `!fieldVisitLoading` so field-visit data has settled, `valuationCase.assignedEngineerId` so this remains reassignment rather than initial assignment, and `fieldVisit?.status !== "SUBMITTED"` so no submitted visit can expose the action. A missing visit is allowed by this predicate; a returned `DRAFT` visit is also allowed. Keep the dialog’s current-engineer exclusion and active-engineer list behavior unchanged.
      Files: `src/routes/_app/cases.$caseId.index.tsx`
      Verify: `npx tsc --noEmit` reports no new errors attributable to this change; `npm run build` succeeds; inspect the built/type-checked route behavior against these cases: ADMIN/SUPER_ADMIN + settled `FIELD_VISIT_PENDING` + existing engineer + no visit or `DRAFT` => button visible; same with `SUBMITTED`, loading field-visit data, null/empty assigned engineer, `ASSIGNED`, `FIELD_VISIT_SUBMITTED`, `MAKER_ASSIGNED`, or any later stage => button hidden; non-admin roles => button hidden.

- [x] 2. Correct the server cutoff without weakening authorization or race protection. In `api_reassignSiteEngineer` in `src/server/api.server.ts`, select the existing field-visit row’s `status` while inside the existing transaction after `SELECT ... FROM cases ... FOR UPDATE`, and reject only when that status is exactly `"SUBMITTED"`. Permit an existing `"DRAFT"`/other non-submitted row to proceed. Preserve the current `requireServerUser(token, "ADMIN", "SUPER_ADMIN")` authorization, active non-banned Site Engineer target validation, existing stage/assigned-engineer/current-target predicates, current-engineer exclusion, and the shared case-row lock with `api_submitFieldVisit`; do not add a null-assignment/initial-assignment path. Keep the error for a submitted visit clear and consistent with the existing cutoff error.
      Files: `src/server/api.server.ts`
      Verify: `npx tsc --noEmit` reports no new errors; `npm run build` succeeds; review or test the server decision matrix: DRAFT/no visit permits an eligible admin reassignment, SUBMITTED rejects it, missing case/invalid target/non-admin/same target/null current engineer/stage outside the server’s allowed pre-submission stages remain rejected, and concurrent submission/reassignment still serializes on the case-row lock.

- [x] 3. Run final focused validation and preserve the existing worktree.

## Verification note

Ran from `e:\codefiles\va2` on this iteration:

- `npx tsc --noEmit` — failed only with the known pre-existing `src/components/case/CaseWithCustomerTabs.tsx:104` optional-email `TS2379` error; no errors were reported in the changed files.
- `npm run build` — passed successfully.
- `git diff --check` — passed successfully.

No database command was run. No `.env.local`, migration/schema, or generated `.output` file was changed. The source diff is limited to `src/routes/_app/cases.$caseId.index.tsx` and `src/server/api.server.ts`; the plan and existing untracked task artifacts are preserved.

## Constraints

- Never run `git stash`, `git reset`, `git checkout`, `git clean`, or any discard operation.
- Never amend, rebase, squash, force-push, or rewrite published history.
- Preserve existing valid work and do not create a checkpoint for this focused two-file correction.
- Do not touch `.env.local`, migrations/schema, generated `.output` files, or any database.
- Keep current-engineer exclusion, target validation, server-side `ADMIN`/`SUPER_ADMIN` authorization, and race protection through the shared case-row transaction lock.
- Do not add initial assignment when `assigned_engineer_id` is null.
