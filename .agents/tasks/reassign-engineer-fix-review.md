# Admin-only Site Engineer reassignment in Field Visit Pending

The case detail page now restores the admin Site Engineer reassignment action and connects it to the existing selection dialog and server mutation. Visibility is constrained to `FIELD_VISIT_PENDING`, a settled field-visit query, an existing assigned engineer, a non-submitted visit, and the existing admin permission. The server mutation now distinguishes a `DRAFT`/non-submitted visit from a submitted visit while retaining authorization, target validation, the existing-assignment requirement, and the case-row transaction lock. Watch for: **confirmed** verification caveat—the recorded TypeScript check remains non-green because of a pre-existing unrelated error, although the build and diff check passed.

**Verdict**: APPROVED

## High-level view

The route restores the complete reassignment flow without introducing initial assignment: the action is visible only for administrators on an eligible `FIELD_VISIT_PENDING` case, and the dialog excludes the current engineer before submitting the selected replacement.

The server remains authoritative. It validates the authenticated admin role and active Site Engineer target, locks the case row, rejects exactly `SUBMITTED` field-visit rows, and updates only cases with an existing engineer in the permitted pre-submission stages.

The available verification evidence covers the changed source with a successful production build and `git diff --check`; the only TypeScript failure is recorded at an unchanged unrelated component.

<details>
<summary>Issues (1)</summary>

1. **Pre-existing TypeScript failure** (**confirmed**) — `npx tsc --noEmit` still reports the unrelated optional-email error in `CaseWithCustomerTabs.tsx:104`; resolve that baseline issue separately, but it does not block this two-file change because the changed files have no reported errors and the production build passed.

</details>

<details>
<summary>Details</summary>

### Visibility gate and reassignment flow

`showReassignSiteEngineer` combines the admin-only `cases.reassignSiteEngineer` permission with the exact `FIELD_VISIT_PENDING` stage, completed field-visit loading, a non-empty current engineer, and a visit status other than `SUBMITTED`. This prevents the button from appearing for the listed later or earlier stages, for an unassigned case, or after submission. The dialog is mounted with the current engineer ID and filters that ID from the active engineer list, so this remains reassignment rather than an initial-assignment path.

The handler uses the authenticated session token, refreshes the case and relevant case queues after success, and leaves server errors visible through the existing toast path. The server call remains authoritative if the case changes after the page renders.

### Server cutoff and race protection

`api_reassignSiteEngineer` now selects the field-visit status inside the existing transaction and rejects only an exact `SUBMITTED` status. A missing visit or a non-submitted/DRAFT row therefore remains eligible for an otherwise valid reassignment. The case row is still locked before the visit decision and update, and the existing guarded update still requires `ASSIGNED` or `FIELD_VISIT_PENDING`, a non-null current engineer, and a different target. The verified `ADMIN`/`SUPER_ADMIN` check and active, non-banned `SITE_ENGINEER` target validation remain intact.

The lock preserves serialization with field-visit submission: concurrent operations cannot both pass their respective cutoff checks against the same case row. A null assigned engineer still cannot be converted into an initial assignment by this mutation.

### Verification coverage

The recorded evidence in `reassign-engineer-fix-plan.md` reports `npm run build` and `git diff --check` passing. It also records `npx tsc --noEmit` failing only at the pre-existing optional-email error in `CaseWithCustomerTabs.tsx:104`, with no errors in either changed file. No database, migration/schema, generated-output, or environment-secret files were changed, and the reviewed diff contains only the requested route and server files.

</details>

<details>
<summary>File map</summary>

- `src/routes/_app/cases.$caseId.index.tsx` — restores the admin-only button, dialog wiring, and reassignment handler.
- `src/server/api.server.ts` — permits non-submitted field-visit rows and rejects submitted rows while preserving transaction safeguards.

Full diff: `git diff` from the repository root.

</details>
