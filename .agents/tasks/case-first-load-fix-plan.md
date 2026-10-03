# Implementation Plan

## Root-cause diagnosis

The single production bug is a hook-order violation in `src/routes/_app/cases.$caseId.index.tsx`. `Page` always calls `useCurrentUser`, `useQueryClient`, and the case/related-record `useQuery` hooks, then returns `<DetailSkeleton />` when `isLoading` is true or the not-found/error view when `isError || !valuationCase` (currently the early returns at lines 309–327). The three `useMutation` hooks for `submitToChecker`, `submitToUploader`, and `markUploaded` are declared only after those returns (currently lines 428–487). On first navigation, the case query commonly renders once in a loading/error state and then renders again with data; the hook sequence therefore changes between renders, matching React error #310 (“Rendered fewer hooks than expected”). Clicking Try again remounts/restarts the route in a timing where the first committed render can reach the full hook list, which explains the reported retry success.

The audited `src/lib/permissions.ts` is not involved: `can()` is a pure role/permission lookup and declares no hooks. `CasePipeline`, `SubmittedFieldVisit`, `AssignMakerDialog`, and `ReassignSiteEngineerDialog` do not conditionally change hooks in their own components; their hooks are unconditional within each component, and the dialogs remain mounted by the parent only after the parent has passed its data guard. The root route has a generic `errorComponent` with a retry that invalidates/resets the router, and there is no case-route pending/error component that explains the hook error.

The Neon Auth `/auth/sign-out` request is issued only by `signOut()` in `src/lib/auth-client.ts`, called from the explicit Logout menu action in `src/components/app/AppTopbar.tsx`. No case detail loader, query function, error boundary, or retry handler calls `signOut`; `getSessionToken()` only requests `/token`, while the case queries use server functions. Therefore the sign-out 400 is separate from the hook-order crash unless browser network initiator/runtime evidence shows an unexpected caller outside this source. Do not make sign-out silently swallow or retry the 400 as part of this fix, because that could mask a real auth/session problem. During implementation, confirm the request initiator and whether the user actually clicked Logout; if it is the topbar action, inspect the server response/session-cookie state separately rather than coupling it to the case fix.

## Implementation steps

- [ ] 1. Move the three case action `useMutation` declarations in `src/routes/_app/cases.$caseId.index.tsx` above every conditional return in `Page`, while preserving their existing mutation functions, cache invalidations, toasts, dialog state updates, and error handling. Keep the hook order unconditional on every render. Because the hooks will now be created while `valuationCase` is still undefined, capture a stable id such as `const mutationCaseId = valuationCase?.id ?? caseId` and use it in mutation callbacks, or otherwise guard only the callback invocation without adding conditional hooks; do not invoke a mutation while the case is unavailable. Leave the loading and error/not-found UI behavior unchanged.
      Files: `src/routes/_app/cases.$caseId.index.tsx`
      Verify: `npx tsc --noEmit` and `npm run build` both complete successfully; `npm run lint -- src/routes/_app/cases.$caseId.index.tsx` should report no hook-rule violation (the repository-wide lint currently has pre-existing CRLF/prettier failures, so record any unrelated baseline failures rather than reformatting unrelated files).

- [ ] 2. Validate the reported lifecycle behavior in a browser against the built/dev app without using the database: sign in, hard-refresh or open a case URL directly, and capture the first render/network/console sequence; then navigate away and reopen the same case and use the 500-page Try again action. Confirm that the first navigation now reaches the case detail without React #310 or the generic 500 page, that the loading-to-data transition keeps the page mounted, and that action buttons still work for the relevant roles. In DevTools Network, inspect any `/auth/sign-out` request’s Initiator and response: case opening must not initiate it; if it only comes from the explicit topbar Logout action, record the 400 as a separate auth issue and do not change sign-out behavior in this hook-order fix. If the first-load reproduction cannot be reproduced locally, mark it as needs verification during implementation and report the exact hard-refresh/direct-navigation and retry scenarios that must be tested in the deployed app.
      Files: `src/routes/_app/cases.$caseId.index.tsx`, `src/lib/auth-client.ts`, `src/components/app/AppTopbar.tsx` (runtime inspection only unless source evidence identifies an auth defect)
      Verify: `npm run dev` or the normal local preview flow, followed by the direct-navigation and retry test above; no React error #310 and no case-triggered `/auth/sign-out` request.

- [ ] 3. Keep the change minimal and review the final diff against the existing uncommitted work. Do not modify `src/lib/permissions.ts`, database code, migrations, or auth sign-out semantics unless runtime/source evidence disproves the diagnosis. Preserve unrelated working-tree changes and document the known baseline validation failures (the current `npx tsc --noEmit` failure in `src/components/case/CaseWithCustomerTabs.tsx` and repository-wide CRLF/prettier lint noise) separately from any regression introduced by this fix.
      Files: `src/routes/_app/cases.$caseId.index.tsx`
      Verify: rerun `npx tsc --noEmit` and `npm run build`, compare their results with the baseline above, and confirm the final diff contains only the hook-order fix plus any directly evidenced auth correction.

## Verification record

- Implemented the hook-order fix in `src/routes/_app/cases.$caseId.index.tsx`: all three case action mutations are declared before loading/error returns and use the stable route `caseId` until query data exists.
- `npx tsc --noEmit`: failed only at the documented pre-existing `src/components/case/CaseWithCustomerTabs.tsx:104` exact-optional-property error (`email` may be `undefined`), with no error reported in the changed route.
- `npx eslint 'src/routes/_app/cases.$caseId.index.tsx'`: failed on three existing `prettier/prettier` formatting findings at lines 65, 213, and 415; no hook-rule violation was reported. The command was rerun with the route quoted for PowerShell.
- `npm run build`: passed successfully.
- Browser first-navigation vs retry validation could not be performed in this environment because no authenticated browser session was available. The required deployed-app check remains: hard-refresh/direct-open a case and confirm the loading-to-data transition reaches the detail page without React #310 or a generic 500, then exercise Try again and inspect that opening the case does not initiate `/auth/sign-out`.
- No database access was needed. No auth sign-out source change was made because source inspection shows sign-out is only called by the explicit topbar Logout action; the reported 400 remains a separate auth issue unless runtime initiator evidence shows otherwise.

## Follow-up verification record

- Removed the unrelated Site Engineer reassignment imports, UI, handler, and permission usage from `src/routes/_app/cases.$caseId.index.tsx`; the existing reassignment files and working-tree changes elsewhere were preserved.
- Final route diff contains only the three mutation hooks moved above the loading/error returns, using `valuationCase?.id ?? caseId` for stable callback input.
- `npx tsc --noEmit`: failed only at the pre-existing `src/components/case/CaseWithCustomerTabs.tsx:104` exact-optional-property error.
- `npx eslint 'src/routes/_app/cases.$caseId.index.tsx'`: reports the same three pre-existing Prettier findings at lines 63, 208, and 410; no hook-rule violation.
- `npm run lint`: fails on repository-wide existing CRLF/Prettier noise (10,705 errors and 7 warnings), not a case-route hook error.
- `npm run build`: passed successfully.
- No authenticated browser session is available here, so first direct navigation, retry behavior, and `/auth/sign-out` network initiator remain unverified and must be checked in the deployed app. Source inspection still shows no case-opening call to `signOut`; the 400 remains separate.

## Review follow-up verification record

- Removed the orphaned Site Engineer reassignment button from `src/routes/_app/cases.$caseId.index.tsx`; its referenced `showReassignSiteEngineer` and `setReassignEngineerOpen` symbols were undeclared and the feature was unrelated to the hook-order fix. No reassignment dialog/API or permission implementation was added.
- Confirmed the case route keeps all three `useMutation` hooks before loading/error returns, with `valuationCase?.id ?? caseId` as the stable mutation id. `src/lib/permissions.ts` remains hook-free, and the audited direct child components keep their hooks unconditional within their own component boundaries.
- `npx tsc --noEmit`: failed only at the documented pre-existing `src/components/case/CaseWithCustomerTabs.tsx:104` exact-optional-property error; no error was reported in the changed route.
- `npx eslint 'src/routes/_app/cases.$caseId.index.tsx'`: reported the same three pre-existing Prettier formatting findings in the route and no hook-rule violation.
- `npm run lint`: failed on repository-wide pre-existing CRLF/Prettier noise (`10,705` errors and `7` warnings), not a case-route hook error.
- `npm run build`: passed successfully.
- First-navigation versus retry behavior could not be runtime-validated because this environment has no authenticated browser session. The deployed-app check remains: hard-refresh/direct-open a case, verify loading-to-data has no React #310 or generic 500, then retry the scenario and inspect `/auth/sign-out` Initiator. Source inspection still finds sign-out only in the explicit topbar Logout action, so the 400 remains a separate auth issue and was not masked.
- No database access was needed.
