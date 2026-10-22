# Assignment Read/Acceptance Investigation

## Summary answer

The fastest and safest first release is **Option B: a minimal server-recorded “read by site engineer” status/tag**, not accept/reject. The existing workflow already assigns a case and exposes it in the engineer’s authenticated “My Cases” queue; it has no assignment-response state or rejection semantics. Add a nullable `engineer_read_at` timestamp (and optionally `engineer_read_by_id` only if the assignment can later be transferred) to `cases`. Set it once, server-side, when the assigned engineer opens the case detail, then show an `Unread`/`Read` badge in the admin Cases list and case detail. This answers the stated admin question without changing pipeline stages or blocking field-visit work.

Accept-only is the reasonable second step if the business needs an explicit commitment. Accept/reject is slower and riskier because rejection requires a reason, reassignment/notification rules, stage semantics, and handling cases that are rejected or never acted on.

## Evidence and current flow

- `src/db/schema.ts`, `cases` table: assignment is currently represented by `assigned_engineer_id`; the table has `stage`, timestamps, and audit-like IDs for later Maker/checker/uploader actions, but no read, accepted, rejected, or assignment-event columns. Existing indexes include `cases_assigned_engineer_id_idx` and `cases_stage_idx`.
- `src/types/index.ts`, `ValuationCase`: the domain object exposes `assignedEngineerId`, `stage`, creation/update timestamps, and downstream actor IDs. There is no assignment acknowledgement/read property. `CaseHistoryEntry` exists as a type, but no persisted history table/API was found, so it is not an immediately usable audit mechanism.
- `src/server/api.server.ts`, `api_createCase`: a new case stores `assigned_engineer_id` and starts at `FIELD_VISIT_PENDING`. This means assignment and work readiness already happen in one operation; adding an acceptance stage would alter the existing state machine.
- `src/server/api.server.ts`, `api_listMyCases`: the server authenticates the Neon Auth token, derives the engineer ID from the verified `sub`, and returns only rows where `assigned_engineer_id` matches. This is the correct security boundary for a read mutation too; do not accept an engineer ID from the browser as authority.
- `src/data/case.functions.ts`: client/server wrappers already provide `api_listMyCases`, `api_getCase`, assignment/reassignment, and downstream transition functions. A new authenticated POST wrapper is the natural place for `api_markCaseRead`.
- `src/routes/_app/my-cases.tsx`: the site engineer sees assigned cases in Pending/Completed tabs and opens `/cases/$caseId`; cards/tables currently show case number, customer, bank, branch, stage, and date, but no acknowledgement state.
- `src/routes/_app/cases.$caseId.index.tsx`: case detail already loads `api_getCase`, resolves the assigned engineer, loads the field visit, and renders `CasePipeline`. This is the best place to mark the case read on initial successful load for the assigned engineer, with a query invalidation/update afterward.
- `src/routes/_app/cases.index.tsx`: the admin list loads `api_listCases`, resolves engineer names, and displays each case in mobile cards and desktop rows. This is the primary admin placement for an `Unread`/`Read` badge or small eye icon beside the existing stage badge.
- `src/components/app/CaseListCard.tsx`: the shared mobile card already supports optional engineer/actions content and renders the stage badge. Add an optional read-status prop only if the status must appear on mobile; otherwise keep the admin desktop row and detail header as the first release.
- `src/components/case/CasePipeline.tsx`: this is explicitly a read-only stage tracker. Do not add read status as a pipeline milestone; “seen” is an observation/audit signal, not workflow progress.
- `src/lib/permissions.ts`: admins can view cases and reassign engineers; site engineers can view case detail and their own cases. The new server mutation should independently require `SITE_ENGINEER` and verify ownership, rather than relying only on UI permissions.
- `src/routes/_app/dashboard.tsx`: site engineers receive only `api_listMyCases`, while admins receive `api_listCases`. Returning the read timestamp through the existing case mapping automatically makes it available to the admin dashboard/list without exposing other engineers’ cases to the site engineer.

## Recommended implementation locations

1. **Database:** add `engineer_read_at` to `cases` in `src/db/schema.ts`, nullable timestamp with timezone, plus an index only if admin unread filtering is needed at scale. Generate and apply the additive Drizzle migration using the project’s configured Neon database.
2. **Domain mapping:** add optional `engineerReadAt?: string` to `ValuationCase` in `src/types/index.ts`; map `row.engineer_read_at` in `mapCaseRow` in `src/server/api.server.ts`. Preserve `null` as `undefined`/empty at the API boundary consistently with existing optional values.
3. **Server mutation:** add `api_markCaseRead(token, caseId)` in `src/server/api.server.ts`. Require a verified `SITE_ENGINEER`; update only when `assigned_engineer_id = verified user.id` and `engineer_read_at IS NULL`; set `updated_at` only if that matches existing timestamp conventions, and return the mapped case. The conditional update makes repeated opens idempotent and avoids changing the original read time.
4. **Client function:** expose the authenticated POST through `src/data/case.functions.ts`, accepting `{ token, caseId }` and passing the token through the existing server-function boundary.
5. **Engineer UI:** in `src/routes/_app/cases.$caseId.index.tsx`, after the case is loaded and ownership is known, call the mutation once for a site engineer. Invalidate or update `['cases', caseId]` and `['my-cases']` as appropriate. Avoid marking read from the admin view or from list rendering; opening the detail page is the unambiguous “saw the file” event.
6. **Admin UI:** in `src/routes/_app/cases.index.tsx`, display `Read` with the timestamp or `Not read`/`Unread` alongside the existing stage badge. The case detail header can repeat the same signal for audit visibility. If mobile parity is required, pass an optional read-status prop through `src/components/app/CaseListCard.tsx`.

## Why not accept/reject first

- **Accept-only** needs a new explicit action and an `accepted_at` field, but it still leaves “opened/read but not accepted” ambiguous unless read tracking is also added. It is a good follow-up after read tracking if managers need commitment reporting.
- **Accept/reject** needs at minimum rejection reason, rejected state, who rejected, rejected time, admin handling/reassignment, and clear rules for whether rejected cases remain in the engineer queue. The current `CaseStage` and server transitions have no such states or rules.
- Reusing `stage` for `READ`, `ACCEPTED`, or `REJECTED` would pollute the existing valuation pipeline and break the meaning of `FIELD_VISIT_PENDING`, which currently means work is waiting on the engineer.

## Caveats and recommended follow-up

- “Read” means the authenticated engineer successfully opened the case detail, not that they read every field or downloaded a document. Label the UI “Opened by site engineer” if that distinction matters.
- On reassignment, clear `engineer_read_at` in the same authorized reassignment operation so the new engineer starts unread. The existing reassignment implementation is in `src/server/api.server.ts` (`api_reassignSiteEngineer`) and is called from `src/data/case.functions.ts` and `src/routes/_app/cases.$caseId.index.tsx`.
- If the product later needs a complete audit trail (multiple assignments, reads by multiple users, accept/reject actions), introduce a dedicated `case_assignment_events` table rather than overloading the single case row. That is a larger change and should preserve the simple read timestamp as the current-state summary.
- Existing list APIs return all case rows for admins, so the timestamp will be available without a new endpoint. Ownership and role checks remain mandatory on the write endpoint.
- Project `package.json` defines `npm run build` and `npm run lint`; it does not define a test script. After implementation, run `npm run build` and `npm run lint`, plus the Drizzle migration/apply commands required by the project’s database workflow.

## Conclusion

Implement a nullable `cases.engineer_read_at`, set it once when the assigned site engineer opens case detail through a verified-token server mutation, and show the result in the admin Cases list/detail. This is the smallest change that directly answers “has the site engineer seen it?” without introducing a new workflow state, rejection policy, or reassignment lifecycle. Add accept-only later only if the business needs an explicit acknowledgement beyond proof of opening.
