# Standardize displayed dates to DD/MM/YYYY

The date-display change centralizes presentation in `src/lib/date-format.ts` and routes the identified case, entity, dashboard, field-visit, submitted-report, and PDF displays through the shared helpers. Date-only values render with zero-padded day and month plus a four-digit year; existing date-time displays retain their time while using the same date portion. The final source scan reports no remaining user-facing locale date formatters, and the unrelated Field Visit tab-disable edit has been removed from the final source diff. **Watch for:** **confirmed** repository-wide type-checking remains limited by one pre-existing `exactOptionalPropertyTypes` error outside this change, although the recorded build passed and the focused formatter check passed.

**Verdict**: APPROVED

## High-level view

The shared formatter provides one presentation path for date-only and date-time values. It treats `YYYY-MM-DD` values as local calendar components, avoiding timezone drift, and produces unambiguous `DD/MM/YYYY` output such as `10/02/2026`; timestamp displays retain hours and minutes without changing their underlying values.

Coverage extends across created-date list/card displays, case detail audit timestamps, field-visit screens, submitted field-visit audit text, and PDF output. The final source scan found only intentionally non-display calendar metadata and numeric chart formatting as remaining locale-related uses, and the reviewed source changes do not alter parsing, input values, serialization, storage, or API/database behavior.

The final route diff removes the previously bundled Field Visit tab behavior change, leaving the quick fix presentation-only. Recorded verification includes a passing build, a focused formatter spot-check, a clean `git diff --check`, and confirmation that no database commands were run. **confirmed** The repository-wide type check still reports one unrelated pre-existing error in `CaseWithCustomerTabs.tsx`; this limits global type-check evidence but does not identify a defect in the date-format change.

<details>
<summary>Issues (0)</summary>

No blocking concerns identified.

</details>

<details>
<summary>Details</summary>

### Centralized calendar formatting preserves the requested representation

`formatDisplayDate` pads both date components and emits day/month/year in that order, so the representative value 10 February 2026 renders as `10/02/2026`, not `10/2/2026` or a month-first locale form. For a date-only string matching `YYYY-MM-DD`, the helper constructs the local calendar date from its numeric components before formatting; this preserves the stored calendar day across timezone offsets. Timestamp inputs continue through normal `Date` parsing, and `formatDisplayDateTime` retains the existing hour/minute information while using the shared date portion. **confirmed**

### User-facing coverage is centralized across the identified surfaces

The shared helpers are used for created dates in case, role-queue, entity, dashboard, and mobile-card views; Created and Last Updated values in case detail; field-visit review/edit displays; submitted field-visit audit lines; and generated, submitted, and visit dates in the PDF path. The final source scan found no remaining `toLocaleDateString()` or date-oriented `toLocaleString()` formatter in application source outside the documented calendar month/data metadata and numeric chart usage. **confirmed** No remaining incorrect display formatter was identified in the reviewed scope.

### Presentation-only scope is preserved

The date changes replace display formatting and add/import the shared helper without changing API/database serialization, ISO timestamp generation, date parsing, sorting, schema fields, storage, or form input values. The final working-tree route hunk removes the unrelated `disabled` prop from the Field Visit tab, restoring the prior workflow behavior rather than bundling a feature change with this fix. **confirmed**

### Verification evidence and residual limitation

The plan records a passing `npm run build`, a focused formatter check producing `10/02/2026`, `10/02/2026`, and `10/02/2026, 09:05`, a passing `git diff --check`, and no database commands. **confirmed** The recorded `npx tsc --noEmit` result is blocked by the pre-existing `CaseWithCustomerTabs.tsx:104` optional-email typing error, and lint is blocked by the repository-wide CRLF/Prettier mismatch; neither recorded failure points to the date-format implementation. The available evidence is sufficient for this display-only review because the affected helper was directly spot-checked and the production build passed.

</details>

<details>
<summary>File map</summary>

- `src/lib/date-format.ts` — shared zero-padded date-only and date-time display formatters.
- `src/routes/_app/*.tsx` — list, dashboard, case-detail, and field-visit date displays migrated to the helpers.
- `src/components/app/CaseListCard.tsx` — mobile created-date display migrated.
- `src/components/case/SubmittedFieldVisit.tsx` — submitted audit and visit-date displays migrated.
- `src/server/fieldVisitPdf.server.ts` — generated, submitted, and visit dates migrated for PDF output.
- `src/routes/_app/cases.$caseId.index.tsx` — unrelated Field Visit tab-disable edit removed from the final working-tree diff.

Full diff: `git diff` in the workspace.

</details>
