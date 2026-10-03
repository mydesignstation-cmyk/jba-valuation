# Case-list Edit action gating

The case-list Actions menu now renders Edit only when the case stage is exactly `FIELD_VISIT_PENDING` and the signed-in user has the centralized `cases.update` permission. That permission is restricted to `ADMIN` and `SUPER_ADMIN`, so other roles and every other stage—including `FIELD_VISIT_SUBMITTED`—are excluded. The condition is at the shared `renderActions` call site used by both desktop and mobile case lists; View and the existing Delete gate are unchanged.

Watch for: **confirmed, non-blocking** — there is no executable browser regression harness for the role/status menu matrix, so the recorded verification is source inspection plus static/build checks. **confirmed, non-blocking** — the working tree also contains an unrelated edit to the site-engineer reassignment plan; it is not part of the production implementation diff and should remain outside the bug-fix commit.

**Verdict**: APPROVED

## High-level view

The fix is applied where the Actions menu is actually assembled, rather than only in the edit form or a route guard. The shared renderer feeds both list layouts, and its strict stage-key comparison plus centralized permission check gives the requested admin-only behavior without changing View, Delete, case loading, or mutation behavior.

The status representation is correctly handled as an internal enum key: the server maps the database value to `ValuationCase.stage`, while `stageLabels` separately maps `FIELD_VISIT_PENDING` to the visible “Field Visit Pending” label. No database schema, migration, database write, or server data behavior is changed.

## Issues (0)

No actionable findings.

<details>
<summary>Details</summary>

### Exact gate at the shared Actions renderer

`src/routes/_app/cases.index.tsx` wraps the existing Edit item in:

```tsx
c.stage === "FIELD_VISIT_PENDING" && can(user?.role, "cases.update")
```

`renderActions` is passed to both the desktop table and the mobile `CaseListCard`, so the restriction applies consistently across the two case-list surfaces. The strict key comparison cannot match `FIELD_VISIT_SUBMITTED`, any later stage, an earlier stage, or the human-readable label. The View item remains unconditionally present, and Delete retains its existing `canDelete` condition.

### Role and status contract

`src/lib/permissions.ts` maps `cases.update` to `SUPER_ADMIN` and `ADMIN` only. `useCurrentUser()` supplies the role, and `can` returns false for missing or non-admin roles. `ValuationCase.stage` is typed as the internal `CaseStage` union; the server case mapper assigns the database stage key directly, while `stageLabels` handles display text separately. This matches the required “Field Visit Pending” behavior without the reported prefix/label leakage into “Field Visit Submitted.”

### Persistence and verification evidence

The recorded verification reports a passing `npm run build` and passing `git diff --check`. It also records the known baseline failures from `npx tsc --noEmit` and `npm run lint`, with errors outside the changed gate, and documents the absence of a browser/test harness. The recorded evidence states that no database command or write was run and that `src/db/migrations/**` is unchanged. The local production diff contains only the intended renderer change; the separate modified plan file is documentation scope, not schema or runtime behavior.

</details>

<details>
<summary>File map</summary>

- `src/routes/_app/cases.index.tsx` — gates the shared Edit action by exact pending stage and admin permission.
- `.agents/tasks/edit-gate-fix-plan.md` — records the role/status matrix and verification evidence.
- `.agents/tasks/site-engineer-reassignment-plan.md` — unrelated working-tree documentation change, not part of the production fix.

Full local implementation diff: `git diff` from `e:\codefiles\va2`.

</details>
