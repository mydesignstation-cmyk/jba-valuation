# Live Reassign Site Engineer Visibility Report

## Summary answer

The missing button is explained by the deployed source, not by an undeployed build. Commit `cf56c54` added the permission, server mutation, client function, and dialog, but the subsequent commit `866954d` removed the only `Reassign Site Engineer` JSX block from `src/routes/_app/cases.$caseId.index.tsx`. The current `main` source therefore has no site-engineer reassignment button to display for an Administrator, regardless of whether case `VAL-2026-0008` is `FIELD_VISIT_PENDING` or has an assigned engineer.

The intended server-side operation does have a complete eligibility gate: an authenticated `ADMIN` or `SUPER_ADMIN`; a target that is an active Site Engineer; an existing case in `ASSIGNED` or `FIELD_VISIT_PENDING`; no row in `field_visits`; an existing assigned engineer; and a target engineer different from the current one. The current case-detail UI does not implement the corresponding client predicate at all. The screenshot can confirm the displayed role/stage and absence of the button, but cannot prove the case's `assignedEngineerId` value or whether a `field_visits` row exists.

## Evidence

### 1. Deployment proof and repository state

- The supplied Vercel proof identifies commit `cf56c54`, titled `feat: allow admin site engineer reassignment`, as Ready in Production on `main`. This rules out diagnosing the issue as merely an unpushed or stale deployment.
- Local Git history shows `cf56c54` followed by `866954d` (`fix: stabilize case detail hooks on first load`), and `HEAD`/`origin/main` is `3cf3caa` (`docs: save workflow investigation artifacts`). The current route is therefore newer than the feature commit.
- `git show cf56c54 --stat` confirms that the feature commit touched `src/components/case/ReassignSiteEngineerDialog.tsx`, `src/data/case.functions.ts`, `src/lib/permissions.ts`, `src/routes/_app/cases.$caseId.index.tsx`, and `src/server/api.server.ts`.
- In the `cf56c54` version of `src/routes/_app/cases.$caseId.index.tsx`, lines 505–510 contained:
  `showReassignSiteEngineer && ... Reassign Site Engineer`.
- `866954d` explicitly deletes those six JSX lines from that route. The current route has no `ReassignSiteEngineerDialog` import, no `api_reassignSiteEngineer` import, no `showReassignSiteEngineer` variable, no reassignment handler/state, and no `Reassign Site Engineer` button. This is the direct visibility defect.

### 2. Current permission gate

`src/lib/permissions.ts:16,61` defines `cases.reassignSiteEngineer` and grants it to `ADMINS`, where `ADMINS` is `['SUPER_ADMIN', 'ADMIN']` (`src/lib/permissions.ts:37–38`). Thus the screenshot's `Administrator` role would satisfy the role permission if the route actually called `can(currentUser?.role, "cases.reassignSiteEngineer")`.

However, `src/routes/_app/cases.$caseId.index.tsx:181` currently computes only `canReassignMaker`; it never computes the site-engineer permission. Because no site-engineer action is mounted, the effective current UI rendering predicate is not a false boolean involving role/stage/data—it is the absence of any render path.

### 3. Intended server-side predicate

`src/server/api.server.ts:1046–1115` contains `api_reassignSiteEngineer`. Its effective success conditions are:

1. `requireServerUser(token, "ADMIN", "SUPER_ADMIN")` succeeds (`api.server.ts:1052`), so the verified server identity is an Administrator or Super Administrator.
2. The requested target exists in `neon_auth."user"` with `role = 'SITE_ENGINEER'` and `banned IS NOT TRUE` (`api.server.ts:1056–1067`).
3. The case row is found and locked (`api.server.ts:1071–1072`).
4. No `field_visits` row exists for that case (`api.server.ts:1074–1080`). The implementation treats any existing visit row as past the reassignment cutoff, including a possible `DRAFT` row.
5. The guarded update matches the case ID, stage `ASSIGNED` or `FIELD_VISIT_PENDING`, a non-null `assigned_engineer_id`, and a current engineer different from the requested target (`api.server.ts:1085–1094`).

Equivalently, the server mutation succeeds only when:

```text
adminOrSuperAdmin
AND activeTargetIsSiteEngineer
AND caseExists
AND noFieldVisitRowExists
AND stage IN {ASSIGNED, FIELD_VISIT_PENDING}
AND existingAssignedEngineerId IS NOT NULL
AND targetEngineerId != existingAssignedEngineerId
```

The transaction lock is shared with field-visit submission: `api_submitFieldVisit` locks the same case before rechecking ownership and inserting the visit (`api.server.ts` field-visit submission section). That protects the server cutoff, but it cannot make a missing client button appear.

### 4. Case and field-visit response mapping

- `src/server/api.server.ts:mapCaseRow` maps `cases.assigned_engineer_id` to `ValuationCase.assignedEngineerId`, using an empty string when the database value is null. This is the current assignment value the case-detail page could use.
- `src/server/api.server.ts:mapFieldVisitRow` maps the database status to `FieldVisit.status`, preserving `SUBMITTED` and otherwise mapping to `DRAFT` (`api.server.ts:1128–1142`).
- `api_getCaseFieldVisit` returns the single visit for `case_id` or `undefined` when no row exists (`api.server.ts:1281–1295`). The case-detail route converts `undefined` to `null` in its `fieldVisit` query (`src/routes/_app/cases.$caseId.index.tsx:286–290`) and separately exposes `fieldVisitLoading`.
- The existing case-detail query for the assigned engineer is enabled only when `valuationCase.assignedEngineerId` is truthy (`src/routes/_app/cases.$caseId.index.tsx:246–249`). This is suitable for displaying the current engineer, but it is not currently connected to a reassignment action.
- `src/components/case/ReassignSiteEngineerDialog.tsx:41–48` filters the live Site Engineer list to exclude `currentEngineerId`, so the popup itself implements the “except the current one” selection rule. The current route never mounts this dialog.

## Conclusions

1. **Confirmed root cause:** the production source's case-detail route does not render the site-engineer action. The permission and backend capability exist, but the UI integration was removed by `866954d` after `cf56c54`.
2. **The screenshot is consistent with this defect:** Administrator plus Field Visit Pending would still show no button because the route has no site-engineer button at all.
3. **Not proven by the screenshot:** it does not reveal `assignedEngineerId`, whether the case has a field-visit row, or whether the current engineer is active. Those values could affect the intended eligibility predicate, but none can explain the current absolute absence of a render path.
4. **Initial assignment is a separate behavior:** the requested wording asks admins to assign a *new* engineer because the existing engineer is busy and to exclude the current engineer. The implemented server mutation is explicitly reassignment-only: it requires a non-null existing engineer and rejects a same-engineer target. It does not provide an initial assignment action for a case whose `assignedEngineerId` is empty. Normal case creation currently requires an engineer and starts at `FIELD_VISIT_PENDING` (`src/server/api.server.ts:api_createCase`), so the normal production path likely has an existing engineer; nevertheless, the no-engineer case is not covered by this feature.

## Minimal correction needed

Restore and complete the case-detail integration in `src/routes/_app/cases.$caseId.index.tsx`: import `api_reassignSiteEngineer` and `ReassignSiteEngineerDialog`, compute an admin-only permission gate, derive pre-submission eligibility from the case stage plus the field-visit query state, maintain dialog/submission state, call the token-bearing mutation, and render the button beside the existing Maker actions. The client should require the normal pre-submission condition (`stage` `ASSIGNED`/`FIELD_VISIT_PENDING`, no field-visit row, and a non-empty current engineer ID) and let the dialog exclude that current ID; the server must remain authoritative for races and stale UI.

If the product also requires an initial assignment when `assignedEngineerId` is empty, that needs an explicitly broadened contract and server predicate rather than merely restoring the reassignment button. It should be decided whether an empty assignment is allowed in `FIELD_VISIT_PENDING` and whether the action label should be `Assign Site Engineer` in that case. No such initial-assignment behavior is present in the current implementation.

This report recommends the code correction but intentionally implements nothing. Build/deployment readiness alone does not establish that an Administrator can see or use the action; the deployed case-detail render path must be verified with an eligible real case and role after the correction.
