# Stable hook order for first-load case details

The case-detail page now creates its three workflow mutations before the loading and not-found/error returns, using the route `caseId` until the loaded record supplies its canonical id. This directly addresses the reported first-navigation transition from query loading/error state to loaded data, where the previous render path skipped mutation hooks and React reported error #310. The change does not alter Neon Auth sign-out behavior; source inspection keeps `/auth/sign-out` confined to the explicit topbar Logout action. The recorded validation shows a successful production build and no hook-rule error, while the authenticated browser reproduction remains unexecuted.

Watch for: **confirmed** runtime coverage is still missing for direct first navigation and the `/auth/sign-out` network initiator, so the deployed smoke check should still be completed; this is a verification gap rather than a source-level hook-order defect.

**Verdict**: APPROVED

## High-level view

The page-level hook sequence is now stable across the query lifecycle, with mutation callbacks retaining the route id needed before case data exists. The audited child boundaries and pure permission lookup do not introduce another conditional-hook path.

No auth implementation was changed. `signOut()` is called by the explicit Logout menu action and clears the local user cache in its `finally` block, while case opening uses server case queries and does not call it. The reported 400 therefore remains a separate auth/session investigation, not something this fix silently absorbs.

<details>
<summary>Issues (1)</summary>

1. **First-navigation runtime coverage** — **confirmed**: the recorded evidence says no authenticated browser session was available, so direct first-load, retry/remount behavior, and the `/auth/sign-out` initiator were not observed. Run the deployed smoke check before release; no additional code change is indicated by the source review.

</details>

<details>
<summary>Details</summary>

### Page-level mutation hooks now follow the query lifecycle safely

The previous route shape placed `submitToChecker`, `submitToUploader`, and `markUploaded` after the `isLoading` and `isError || !valuationCase` returns. A first render that returned a skeleton or error therefore executed fewer hooks than a later data render. The reviewed implementation declares all three `useMutation` calls immediately after the other unconditional queries and before either return, so the sequence is stable for loading, error, not-found, loaded, and subsequent refetch renders.

The mutation functions use `valuationCase?.id ?? caseId`. The fallback is stable for the route and is only consumed by buttons rendered after the successful data guard, so it avoids introducing a new conditional hook or an invalid pre-load mutation call. The existing success callbacks still update the route cache and invalidate the relevant queues; the move does not change server authorization or workflow semantics.

### Child component and permission boundaries do not reintroduce the violation

`CasePipeline` has no hooks. `SubmittedFieldVisit` has no hooks in the displayed component body, while its download-button child owns its state unconditionally when that child is mounted. `AssignMakerDialog` and `ReassignSiteEngineerDialog` each call their state, query, and effect hooks at component top level; their `enabled` flags control query work, not hook invocation. Conditional JSX in the parent can mount these components based on loaded case data, but it cannot alter the parent hook list. `can()` in `src/lib/permissions.ts` is a pure lookup with no hook calls, so role transitions cannot create a hook-order mismatch there.

### Neon Auth 400 remains outside this change

The route diff contains no sign-out, session-cookie, retry, or error-boundary modification. In the inspected source, `AppTopbar` is the caller of `signOut()` and invokes it only from the user-selected Logout menu item; case-detail query functions and the route retry path do not call it. Swallowing a sign-out response would be a separate concern because `signOut()` currently clears local state in `finally` even if the request returns 400, but that behavior predates and is untouched by this fix. Coupling it to the case hook change would risk hiding a genuine auth/session failure.

### Validation and production scope

The supplied verification record reports a passing `npm run build`, no hook-rule violation in the focused ESLint result, and only documented baseline TypeScript and formatting/lint failures. No database access or auth source change was made. The remaining gap is explicitly runtime validation in an authenticated deployed session: hard-refresh/direct-open a case, observe loading-to-data transition without React #310 or a 500 page, then inspect whether opening the case produces any `/auth/sign-out` request and confirm the request is only associated with explicit Logout if present.

</details>

<details>
<summary>File map</summary>

- `src/routes/_app/cases.$caseId.index.tsx` — places the three case mutations before early returns and preserves route-id callback behavior; the current working-tree removal of the orphaned site-engineer button is unrelated to the hook fix.
- `src/lib/permissions.ts` — audited pure role/permission lookup; no change required.
- `src/lib/auth-client.ts` — audited existing sign-out behavior; no change required.
- `src/components/app/AppTopbar.tsx` — audited the sole source-level sign-out caller; no change required.

Full implementation comparison: `git diff cf56c54^ cf56c54 -- src/routes/_app/cases.$caseId.index.tsx`.
</details>
