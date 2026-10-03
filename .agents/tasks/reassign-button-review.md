# Administrator visibility for pre-submission Site Engineer reassignment

The change fixes the reported visibility failure by treating a non-submitted field-visit row as still pre-submission, instead of hiding reassignment whenever any row exists. The case-detail button remains gated by the centralized `cases.reassignSiteEngineer` permission and by the `ASSIGNED`/`FIELD_VISIT_PENDING` lifecycle condition. The role path is consistent: auth produces the exact `ADMIN` role, the page passes it to `can()`, and the permission map grants the permission to `ADMIN` and `SUPER_ADMIN`. The server mutation continues to authorize only those admin roles and independently rejects reassignment after a submitted visit.

Watch for: **possible** runtime data-state ambiguity remains if a row that the UI maps to `DRAFT` is actually treated as submitted by a separate business flow; the documented implementation has no draft-save mutation, and the requested button gate is correctly based on the exposed visit status.

**Verdict**: APPROVED

## High-level view

The UI now exposes the action for an authenticated Administrator on an `ASSIGNED` or `FIELD_VISIT_PENDING` case once the field-visit query settles, including when the returned visit is non-submitted. It still suppresses the action for non-admin roles, submitted visits, later case stages, and the loading state.

Authorization remains layered rather than weakened: the centralized UI permission map controls visibility, while `api_reassignSiteEngineer` retains its `requireServerUser(token, "ADMIN", "SUPER_ADMIN")` check and validates the replacement engineer against Neon Auth. The existing dialog excludes the current engineer from its choices, and the server rechecks the target and lifecycle conditions.

The verification note records a successful production build and `git diff --check`; it also distinguishes the known `CaseWithCustomerTabs` optional-email TypeScript error and repository-wide CRLF lint noise from feature regressions. No database access or environment-file change was performed, and the existing local reassignment work was kept uncommitted.

<details>
<summary>Issues (1)</summary>

1. **Draft-row mutation cutoff (possible)** — the UI can open reassignment for a visit mapped as `DRAFT`, while the server rejects any existing `field_visits` row; keep this contract aligned if a draft-save flow is introduced, or narrow the UI gate to the server’s actual cutoff.

</details>

<details>
<summary>Details</summary>

### Administrator role reaches the corrected button predicate

The role dependency is internally consistent and **confirmed** by the inspected sources. `auth-client.ts` accepts only known uppercase role values and returns `role: "ADMIN"`; the page calls `can(currentUser?.role, "cases.reassignSiteEngineer")`; and `permissionRoles` defines that permission for `ADMINS`, whose values are `"SUPER_ADMIN"` and `"ADMIN"`. Therefore a real Administrator is not excluded by a `Administrator`/`ADMIN` label mismatch. The button is rendered directly from `showReassignSiteEngineer` in the case-detail header.

The corrected lifecycle predicate is **confirmed** to require `ASSIGNED` or `FIELD_VISIT_PENDING`, a settled field-visit query, and a visit status other than `SUBMITTED`. This makes `ADMIN + FIELD_VISIT_PENDING + DRAFT` visible, while `ADMIN + FIELD_VISIT_SUBMITTED` or later, `ADMIN + SUBMITTED`, non-admin roles, and a still-loading visit query remain hidden. A submitted `field_visits` row is mapped to `status: "SUBMITTED"`, so it also closes the UI window even if the case response has not yet caught up.

### Dialog and server authorization remain aligned

The reassignment dialog is **confirmed** to filter out `currentEngineerId`, require a different selected engineer before submission, and load the available engineers only while open. The server independently validates that the selected Neon Auth user has role `SITE_ENGINEER` and is not banned, so a stale or manipulated picker cannot select an ineligible target.

The server-side authorization is **confirmed** to remain admin-only through `requireServerUser(token, "ADMIN", "SUPER_ADMIN")`; the diff does not broaden that check. Its case update is limited to `ASSIGNED` and `FIELD_VISIT_PENDING`, requires an existing assignment, rejects selecting the current engineer, and rejects any existing field-visit row. The submission path and reassignment path use the same case-row lock, preserving the cutoff under concurrent operations rather than relying only on the UI.

### Verification evidence and preserved workspace state

The verification evidence is **confirmed** to distinguish the known baseline `CaseWithCustomerTabs.tsx:104` `exactOptionalPropertyTypes` failure and repository-wide CRLF Prettier errors from new feature errors. It records `npm run build` and `git diff --check` as passing, plus a truth-table check covering draft, submitted, non-admin, later-stage, and loading states. The note also records no database command, migration, `.env.local` modification, stash, reset, checkout, discard, or history rewrite. The working tree status shows the reassignment implementation remains uncommitted alongside the pre-existing task artifacts.

The remaining data-state caveat is **possible**, not a release blocker for this requested UI fix: the UI now permits opening the dialog for a non-submitted visit row, but the server mutation rejects any existing `field_visits` row. The verification note explains that the application has no draft-save mutation and that the requested cutoff is submission, so this is a consistency check for future data flows rather than evidence that the button visibility fix is incorrect.

</details>

<details>
<summary>File map</summary>

- `src/routes/_app/cases.$caseId.index.tsx` — centralizes the corrected visibility predicate and renders/handles the button.
- `src/lib/permissions.ts` — grants the UI permission to `ADMIN` and `SUPER_ADMIN`.
- `src/components/case/ReassignSiteEngineerDialog.tsx` — provides the replacement-engineer picker and excludes the current engineer.
- `src/data/case.functions.ts` — exposes the reassignment server function to the client route.
- `src/server/api.server.ts` — enforces admin authorization, target validation, lifecycle checks, and submission/reassignment locking.
- `.agents/tasks/reassign-button-fix-plan.md` — records the diagnosis and verification evidence.

The complete local change can be inspected with `git diff` in `e:\codefiles\va2` together with the untracked dialog file.

</details>
