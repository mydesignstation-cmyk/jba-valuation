# Site Engineer Reassignment — Findings and Implementation Plan

## Verification note (review iteration — race fix)

- Reassignment and field-visit submission now serialize on the same `cases` row lock (`FOR UPDATE`) inside transactions. Submission rechecks ownership after locking, then inserts `field_visits` and advances the case before releasing the lock; reassignment checks for an existing visit and updates only the eligible assignment fields while holding that lock.
- `npx tsc --noEmit` — **FAIL (baseline only):** the existing `src/components/case/CaseWithCustomerTabs.tsx:104` `exactOptionalPropertyTypes` error; no new errors from this feature.
- `npm run build` — **PASS:** Vite/Nitro production build completed successfully.
- `git diff --check` — **PASS**.
- Focused race test — **NOT RUN:** `package.json` has no test script or test runner, and adding a database-backed test would violate the no-database-write requirement. The two lock orderings are covered by the shared transaction structure: reassignment-first causes submission's locked ownership check to reject; submission-first causes reassignment's locked visit check to reject.
- No database command, migration, or database connection was performed. No `.env.local` change was made.

## Verification note (implementation iteration)

- `npx tsc --noEmit` — **FAIL (baseline only):** the existing `src/components/case/CaseWithCustomerTabs.tsx:104` `exactOptionalPropertyTypes` error; no new errors from this feature.
- `npm run build` — **PASS:** Vite/Nitro production build completed successfully.
- `npm run lint` — **FAIL (baseline only):** repository-wide Prettier CRLF errors (`10,681` errors, plus `7` warnings); no feature-specific lint issue was isolated.
- `git diff --check` — **PASS**.
- No database command, migration, or database connection was performed. No focused test script is defined in `package.json`.


## Summary answer

The requested admin workflow is not implemented as a dedicated site-engineer reassignment action. The repository does, however, contain a close Maker analogue: `AssignMakerDialog`, the `api_assignMaker` server mutation, admin-only `cases.reassignMaker` permission, and case-detail header actions. That pattern should be copied with different lifecycle guards and a site-engineer picker.

The reassignment should operate on `cases.assigned_engineer_id`, not on `field_visits.engineer_id`. A new admin-only mutation should allow `ADMIN` and `SUPER_ADMIN` to change the assigned engineer repeatedly while the case is still before field-visit submission (`FIELD_VISIT_PENDING`; optionally include legacy `ASSIGNED`), reject the current engineer and invalid/banned users, and atomically refuse changes once submission has won the race. No new data-model column or migration is required for the basic feature. The existing `cases.updated_at` can record the latest change, but an audit/history decision is still needed if the product requires a permanent reassignment history.

## Evidence from the repository

### 1. Existing Maker assignment flow

- `src/routes/_app/cases.$caseId.index.tsx` is the primary case-detail UI. It loads the case, current site engineer, field visit, current Maker, and assigning actor. It computes Maker eligibility from `FIELD_VISIT_SUBMITTED`/`MAKER_ASSIGNED`, then renders `Assign Maker` when unassigned and `Reassign Maker` for admins when a Maker exists. The handler obtains a Neon Auth session token, calls `api_assignMaker`, invalidates `cases/$caseId` and queue queries, and displays a toast.
- `src/components/case/AssignMakerDialog.tsx` is the reusable popup pattern. It loads live users only while open, supports assignment/reassignment copy, prevents a no-op selection, disables controls during submission, and displays loading/error/empty states. It currently lists all Makers; a site-engineer version should list site engineers and exclude the current ID from selectable options rather than preselecting it.
- `src/routes/_app/checker.index.tsx` provides a secondary Maker-assignment shortcut for Checker queue rows. It only shows assignment for `FIELD_VISIT_SUBMITTED` with no Maker and calls the same mutation.
- `src/data/case.functions.ts` is the client/server-function boundary. `assignMakerFn` validates `{ token, caseId, makerId }` and delegates to `api_assignMaker`.
- `src/server/api.server.ts` contains the authoritative `api_assignMaker`. It verifies the token using `requireServerUser(token, "CHECKER", "ADMIN", "SUPER_ADMIN")`, validates the target Maker with `api_getMaker`, and conditionally updates `assigned_maker_id`, `assigned_by_checker_id`, `stage`, and `updated_at`. Checkers require no existing Maker; admins may reassign. The SQL `WHERE` stage guard makes the assignment race-safe against later workflow states.
- `src/lib/permissions.ts` defines `cases.assignMaker` for admins/checkers and `cases.reassignMaker` for `ADMIN`/`SUPER_ADMIN`, explicitly documenting that these are UI gates only and the server is authoritative. This is the pattern to follow, but a distinct permission such as `cases.reassignSiteEngineer` is clearer than overloading Maker permissions.

### 2. Field-visit assignment and submitted lifecycle

- `src/types/index.ts` defines case stages including `ASSIGNED`, `FIELD_VISIT_PENDING`, `FIELD_VISIT_SUBMITTED`, `MAKER_ASSIGNED`, `MAKER_PENDING`, `CHECKER_PENDING`, `UPLOADER_PENDING`, and `COMPLETED`. `ValuationCase.assignedEngineerId` is the case assignment. `FieldVisit` separately has immutable-origin `engineerId` and `status: "DRAFT" | "SUBMITTED"`.
- `src/db/schema.ts` maps `cases.assigned_engineer_id` to a nullable UUID and indexes it. `field_visits.engineer_id` is a required UUID and `field_visits.case_id` is unique. The latter stores the engineer who actually created/submitted the visit and must not be rewritten during reassignment; otherwise audit/report attribution would be corrupted.
- `src/server/api.server.ts` `api_createCase` writes the selected engineer to `assigned_engineer_id` and starts the case at `FIELD_VISIT_PENDING`. `api_listMyCases` derives the authenticated engineer ID from the verified token and filters on `cases.assigned_engineer_id`.
- `src/server/api.server.ts` `requireOwnedCase` requires `SITE_ENGINEER` and checks that the case's `assigned_engineer_id` equals the verified token subject. `api_submitFieldVisit` revalidates the form, creates one `field_visits` row with `status: "SUBMITTED"`, `submitted_at`, and `engineer_id` equal to the authenticated engineer, then advances the case from `ASSIGNED` or `FIELD_VISIT_PENDING` to `FIELD_VISIT_SUBMITTED`.
- The submission path rejects a second visit and the database unique `case_id` constraint prevents duplicates. The intended cutoff for reassignment is therefore case stage `FIELD_VISIT_SUBMITTED`; the implementation should also check that no submitted visit exists so legacy/inconsistent rows cannot be reassigned.
- `api_assignMaker` allows Maker assignment only in `FIELD_VISIT_SUBMITTED` or `MAKER_ASSIGNED`, demonstrating the project convention of explicit stage constants and conditional updates. `api_submitToChecker` later advances from Maker stages to `CHECKER_PENDING`; later stages must never permit engineer reassignment.
- `src/routes/_app/cases.$caseId.field-visit.tsx` is guarded by `fieldVisit.access` and is the site-engineer form route. `src/components/case/SubmittedFieldVisit.tsx` renders submitted data read-only in the case detail view. Neither should be changed to mutate the original submitted visit's engineer.

### 3. Authentication and authorization

- `src/server/auth.server.ts` verifies the short-lived Neon Auth JWT against JWKS, takes the trusted user ID from `payload.sub`, then reads the role from `neon_auth."user"` and rejects banned/unknown users. `requireServerUser` enforces allowed roles server-side.
- `src/lib/auth-client.ts` supplies the current browser user and session token. `src/lib/route-guard.ts` restores the session and checks the centralized UI permission map before route entry.
- `src/lib/permissions.ts` grants `cases.view`, `cases.detail`, and case administration capabilities to admins. The new button must additionally be gated by a dedicated admin-only permission; the server mutation must call `requireServerUser(token, "ADMIN", "SUPER_ADMIN")` and must not trust a browser role or user ID.
- `src/server/api.server.ts` `api_listSiteEngineers` reads active (`banned IS NOT TRUE`) `SITE_ENGINEER` users from `neon_auth."user"`. `src/data/user.functions.ts` and `src/services/user.service.ts` expose that list to client components. The new dialog can reuse this read path, but the mutation must validate the selected target again server-side because list results can become stale.

### 4. Data-model and audit findings

- Basic reassignment requires no schema or migration: `cases.assigned_engineer_id` already represents the current assignment and `updated_at` already exists.
- `field_visits.engineer_id` is the original submitting engineer and must remain unchanged after reassignment. This preserves the existing PDF/report meaning and the documented immutable origin fields.
- `assigned_maker_id` has no corresponding engineer assignment history. Reusing `case_history` would require checking its schema and existing write conventions; a product decision is needed on whether “who reassigned, from whom, to whom, and when” must be permanently auditable. If yes, add a dedicated history action/record using the existing history mechanism rather than silently adding ad hoc columns. If no, `updated_at` plus the current assignment is sufficient for the requested UI behavior.
- `src/server/api.server.ts` has a generic `api_updateCase` that can update `assigned_engineer_id`, but it is not a suitable implementation: the exposed `src/data/case.functions.ts` mutation does not carry a token or perform the requested stage/role/target guards. Do not wire the new button to that generic update; add a dedicated protected mutation.

## Conclusions and recommendations

1. Add a dedicated `api_reassignSiteEngineer` flow rather than generalizing `api_assignMaker` or calling `api_updateCase`. This keeps target-role validation, admin authorization, cutoff semantics, and concurrency behavior explicit.
2. Treat `FIELD_VISIT_PENDING` as the normal eligible stage, and support legacy `ASSIGNED` only if existing production data can still have that stage before a visit. The server should require the case to be in an eligible pre-submission stage and verify that no submitted `field_visits` row exists.
3. Make the SQL update conditional on the case ID, eligible stage, and a different current engineer. Validate the target as an active `SITE_ENGINEER` before the update, then return a precise conflict/error when no row matches. To close the insert/update race around submission completely, use a transaction or a database-level conditional strategy that checks the field-visit row and case stage consistently.
4. Put the action in `src/routes/_app/cases.$caseId.index.tsx`, alongside the existing assignment header action, visible only to admins while eligible. A separate `ReassignSiteEngineerDialog.tsx` is preferable to adding more role-specific branching to `AssignMakerDialog.tsx`; it can follow the same Dialog/Select/loading/error/submit pattern.
5. In the picker, do not include the current engineer as an option. Show the current assignment in the dialog context, handle zero eligible engineers, stale selections, duplicate clicks, and mutation errors, and invalidate the case detail, case list, and site-engineer queries after success.
6. The UI hiding after submission is only presentation. The server must reject attempts after `FIELD_VISIT_SUBMITTED` and every later stage, including `MAKER_ASSIGNED`, `CHECKER_PENDING`, `UPLOADER_PENDING`, and `COMPLETED`.

## Ordered implementation plan

1. **Define the protected mutation contract and authorization.** Add a token-bearing `ReassignSiteEngineerInput` and `api_reassignSiteEngineer` export in `src/data/case.functions.ts`, plus the server implementation in `src/server/api.server.ts`. Require `ADMIN` or `SUPER_ADMIN`; validate the target through a server-side active Site Engineer lookup; reject a missing case, same-engineer no-op, non-eligible stage, submitted field visit, and invalid/banned target; perform a guarded update of `cases.assigned_engineer_id` and `updated_at`; return the mapped case. Add the client-safe wrapper only through the existing `createServerFn` boundary.
   Files: `src/server/api.server.ts`, `src/data/case.functions.ts`; optionally `src/services/case.service.server.ts` only if the project chooses to expose a service-layer wrapper.
   Verify: `npx tsc --noEmit` and `npm run build`; add/run focused mutation tests if a test harness is introduced. Expected result: unauthorized, stale, submitted, and invalid-target requests fail without changing the case; eligible admin requests succeed.

2. **Add the admin-only permission and site-engineer dialog.** Extend `Permission`/`permissionRoles` in `src/lib/permissions.ts` with a clearly named admin-only permission, then create `src/components/case/ReassignSiteEngineerDialog.tsx` based on `AssignMakerDialog.tsx`. Load `listSiteEngineers` only while open, filter out `currentEngineerId`, require a different selected target, and implement loading, fetch-error, empty-list, cancel, disabled-submit, success callback, and mutation-error-safe states. Do not modify `FieldVisit.engineerId` or present the action to non-admins.
   Files: `src/lib/permissions.ts`, `src/components/case/ReassignSiteEngineerDialog.tsx`.
   Verify: `npm run build`; manually exercise the dialog with an admin, a non-admin, a current-engineer-only list, an empty list, and a failed list load. Expected result: only a different active engineer can be submitted.

3. **Mount the action on admin case detail with lifecycle guards and cache updates.** In `src/routes/_app/cases.$caseId.index.tsx`, track dialog/submission state, compute eligibility from the case stage and submitted field-visit state, render `Reassign Site Engineer` only for the new admin permission while pre-submission, call the new mutation with `getSessionToken`, toast the result, close on success, and invalidate/update `cases/$caseId`, `/cases`, `/my-cases`, and related engineer/name queries as appropriate. Keep the existing Maker action unchanged. Consider adding an explicit current engineer label near the action so the admin understands whom they are replacing.
   Files: `src/routes/_app/cases.$caseId.index.tsx`.
   Verify: `npm run build`; manually confirm repeated reassignment works while the case remains pending, the old engineer loses the case from `my-cases`, the new engineer receives it, and the button disappears after field-visit submission or a later stage.

4. **Add focused regression coverage and resolve audit behavior.** Cover server authorization/cutoff/concurrency cases and the dialog eligibility/no-op behavior using the repository’s selected test setup (there is no test script in `package.json`, so introduce the smallest appropriate test harness only if required by the project’s testing conventions). If the product requires reassignment history, implement that as a separate schema/API change after confirming the existing case-history table and write path; otherwise document that only the current assignment and `updated_at` are retained.
   Files: relevant new test files; possibly `src/db/schema.ts` and a migration only if audit history is approved.
   Verify: `npx tsc --noEmit`, `npm run build`, and `npm run lint` after normalizing/handling the repository’s existing line-ending issue. Expected result: type/build checks pass and the new authorization/lifecycle tests pass.

## Edge cases and product decisions

- **Legacy stage:** Should `ASSIGNED` be treated as equivalent to `FIELD_VISIT_PENDING` for existing production rows, or should only the current `FIELD_VISIT_PENDING` value qualify?
- **Race with submission:** If an admin opens the popup while an engineer submits, the server must reject the late reassignment. Decide whether a transaction/stronger database constraint is required for strict serialization; the UI must refresh and explain the conflict.
- **Existing draft rows:** The current submission implementation creates a visit directly as `SUBMITTED` and rejects duplicate visits, but the schema allows `DRAFT`. Should any existing draft row block reassignment, or only `status = SUBMITTED`? Recommended: block if any visit row exists for the case, because the engineer may already have started work and the requested cutoff is the form submission boundary only if drafts are a real supported state.
- **Assignment history:** Is retaining only the latest engineer sufficient, or must the system show reassignment audit entries? The current model has no engineer assignment actor/history fields.
- **Target availability:** The existing user list excludes banned users but does not expose a workload/busy flag. “Choose a new site engineer” therefore means any active Site Engineer other than the current one; if “busy” must be computed from workload, define the workload rule and add a server-side availability query rather than relying on the picker.
- **Role wording:** The existing code treats `SUPER_ADMIN` as an admin-equivalent actor for Maker reassignment. Recommended: allow both `ADMIN` and `SUPER_ADMIN` unless product explicitly means only `ADMIN`.

## Verification performed during investigation

- `npm run build` completed successfully (`vite`/Nitro production build).
- `npx tsc --noEmit` currently fails on the pre-existing `CaseWithCustomerTabs.tsx` optional-email type mismatch (`exactOptionalPropertyTypes`), unrelated to this feature.
- `npm run lint` currently reports thousands of Prettier CRLF errors across the repository, so it is not a clean baseline verification command until line-ending configuration is addressed.
- No database command, migration, write, or server restart was performed. The report is based on source inspection and local build/type/lint checks only.
