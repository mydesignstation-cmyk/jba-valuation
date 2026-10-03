# Admin Site-Engineer Reassignment

This change adds a dedicated admin-only action for replacing a case’s assigned Site Engineer repeatedly while the case remains before field-visit submission. The server validates the verified actor and active target, updates only the case assignment and timestamp, and protects the cutoff with a case-row lock shared by field-visit submission. The case-detail UI and dedicated dialog exclude the current engineer, handle empty/loading/error/no-op states, and refresh affected queries without changing the Maker flow. **Watch for: no blocking concerns remain; confirmed verification limitation—focused race tests were not run because the repository has no test runner, but the recorded build and baseline classification evidence is present.**

**Verdict**: APPROVED

## High-level view

The feature is split cleanly across the protected server mutation, token-bearing data wrapper, admin-only permission, dedicated picker dialog, and case-detail action. The browser role and target list are treated as presentation inputs only: the server derives authorization from the verified session and revalidates the selected active Site Engineer.

The reassignment is limited to pre-submission cases and leaves `field_visits.engineer_id` untouched. Reassignment and submission lock the same `cases` row, so either reassignment wins and submission rechecks ownership, or submission wins and reassignment observes the visit and rejects; later stages are also protected by the guarded update.

The existing Maker assignment path remains separate. On success, the case detail, case-list prefix, my-cases, and site-engineer queries are invalidated, allowing repeated reassignment and updated engineer queues to be reflected in the UI.

<details>
<summary>Issues (0)</summary>

No blocking concerns identified.

</details>

<details>
<summary>Details</summary>

### Protected mutation and assignment boundary

`api_reassignSiteEngineer` is a dedicated mutation exposed through the existing `createServerFn` boundary rather than `api_updateCase`. It calls `requireServerUser(token, "ADMIN", "SUPER_ADMIN")`; the browser cannot supply an actor role or ID. The target is independently checked against `neon_auth."user"` for `SITE_ENGINEER` role and non-banned status, so a stale or manipulated picker result cannot select an invalid account.

The successful update sets only `cases.assigned_engineer_id` and `updated_at`. It does not modify `field_visits.engineer_id`, preserving the engineer who actually submitted the visit. The SQL guard requires an existing non-null assignment, a different target, and `ASSIGNED` or `FIELD_VISIT_PENDING`; the fallback read distinguishes missing cases, later stages, same-engineer no-ops, and update conflicts.

### Cutoff and concurrency behavior

The mutation rejects any existing field-visit row before updating the case and uses `SELECT ... FOR UPDATE` on the case row for the complete decision/update. `api_submitFieldVisit` now takes the same lock before rechecking ownership, testing for an existing visit, inserting the visit, and advancing the case. This closes the previously identified race: when reassignment obtains the lock first, submission sees the new owner and rejects; when submission obtains it first, reassignment sees the visit and rejects. Later-stage changes cannot produce a successful reassignment because the guarded update requires the eligible stages, and a later-stage update that wins first is observed after the lock is released.

The field-visit submission change is related to the required race fix rather than an unrelated workflow change. It continues to derive `engineerId` from the verified token and writes the submitted visit’s original engineer unchanged.

### Admin-only UI and picker states

The new `cases.reassignSiteEngineer` permission is assigned only to `ADMIN` and `SUPER_ADMIN`. The case-detail button additionally requires `ASSIGNED` or `FIELD_VISIT_PENDING`, a resolved field-visit query, and no existing visit, so it is absent after submission and in all later stages. These are UI gates only; the server cutoff remains authoritative.

`ReassignSiteEngineerDialog` loads the existing active-engineer list only while open, filters out `currentEngineerId`, resets stale selection when reopened or when the current assignment changes, and disables submit without a different selection. It exposes loading, fetch-error, empty-list, cancellation, submission-disabled, and mutation-error behavior. The server repeats the active-role and different-target checks, covering stale list data and no-op requests.

The success handler invalidates `['cases', caseId]`, the `['cases']` prefix, `['my-cases']`, and `['site-engineers']`. That covers the detail view, admin case lists, engineer-scoped queues, and related engineer/name data while preserving repeatable reassignment.

### Maker-flow isolation and scope

The existing Maker mutation, dialog, permission, and case-detail eligibility logic are not repurposed for site-engineer reassignment. The new action is mounted alongside the Maker action, while the Maker flow remains on `api_assignMaker` and its original stages. The diff adds no migration, schema change, database write, or `.env.local` modification; the plan file contains only recorded verification notes in addition to its existing implementation plan.

### Verification evidence

The recorded verification note reports `npm run build` passing and `git diff --check` passing. It reports `npx tsc --noEmit` failing only at the known pre-existing `CaseWithCustomerTabs.tsx:104` `exactOptionalPropertyTypes` error, and repository lint failing on the known repository-wide Prettier CRLF errors; neither is attributed to this feature. It also records that no test script or runner exists, so no focused race test was run, and that no database command, connection, migration, or write was performed. The absence of an executable focused test is a verification limitation, not a demonstrated feature defect, because the shared transaction/lock behavior is explicit in the changed server paths and the requested gate has no remaining blocking finding.

</details>

<details>
<summary>Changed files</summary>

- `src/server/api.server.ts` — protected reassignment mutation and shared case-locking for submission.
- `src/data/case.functions.ts` — token-bearing mutation contract.
- `src/lib/permissions.ts` — admin-only reassignment permission.
- `src/components/case/ReassignSiteEngineerDialog.tsx` — current-engineer exclusion and picker states.
- `src/routes/_app/cases.$caseId.index.tsx` — lifecycle-gated action, mutation handler, and cache invalidation.
- `.agents/tasks/site-engineer-reassignment-plan.md` — recorded implementation and verification evidence.

Full diff: `git diff` in `e:\codefiles\va2` (including the new untracked dialog file).

</details>
