# Centralized DD/MM/YYYY display formatting

The change introduces shared date-only and date-time formatters and routes the identified case, entity, field-visit, audit, and PDF display sites through them. The formatter zero-pads day and month, preserves `YYYY-MM-DD` calendar dates without timezone drift, and leaves timestamp parsing and serialization in place. The source scan supports broad coverage: the remaining locale calls are calendar metadata or numeric chart formatting rather than user-facing dates. However, the diff also adds an unrelated field-visit-tab visibility change, and that new JSX wrapper is not closed, leaving the current route syntactically invalid; the recorded verification explicitly reports the resulting type-check/build failure.

Watch for: **confirmed** blocking syntax failure in `src/routes/_app/cases.$caseId.index.tsx`; **confirmed** unrelated tab-gating behavior bundled into this date-only fix. Both must be removed or corrected before shipping.

**Verdict**: NEEDS_CHANGES

## High-level view

The shared formatter is a small, centralized implementation that produces unambiguous zero-padded day/month/year output and a `DD/MM/YYYY, HH:mm` variant for existing audit timestamps. The changed list, card, detail, field-visit, submitted-visit, and PDF sites consistently use those helpers; the recorded source scan found no remaining user-facing locale date formatter outside calendar metadata and numeric chart output.

The date changes stay within presentation: no database/API serialization, ISO timestamp generation, parsing, storage, sorting, or form input changes are present in the reviewed diff. The change is not currently shippable because `cases.$caseId.index.tsx` adds a conditional around the Field Visit tab/content without closing the JSX expression, and the same hunk changes tab visibility for `FIELD_VISIT_PENDING`, which is unrelated to date formatting.

<details>
<summary>Issues (2)</summary>

1. **Unclosed Field Visit JSX wrapper** — **confirmed**: the new `{valuationCase.stage !== "FIELD_VISIT_PENDING" && (` wrapper around the Field Visit tab content has no matching `)}` before `</Tabs>`, and the recorded verification reports the resulting syntax/build failure. Close the wrapper or remove the unrelated hunk, then rerun the coder’s required checks.
2. **Unrelated Field Visit visibility behavior** — **confirmed**: the date-format diff additionally hides the Field Visit tab and content for `FIELD_VISIT_PENDING` cases. Remove this behavior change from the quick fix so the patch only standardizes displayed dates.

</details>

<details>
<summary>Details</summary>

### Shared formatter and date correctness

`src/lib/date-format.ts` centralizes the requested representation. `formatDisplayDate("2026-02-10")` constructs the local calendar date before reading its components, so the stored day is retained; `formatDisplayDate(new Date(2026, 1, 10))` produces `10/02/2026`, and the recorded narrow spot-check reports that result. Its `formatDisplayDateTime` variant retains hours and minutes while using the same date-only formatter, producing the intended `DD/MM/YYYY, HH:mm` shape. The changed sites therefore make a value such as 10 February 2026 render as `10/02/2026`, not a locale-dependent or month-name form.

### Coverage of displayed dates

The shared helper is applied to created-date displays across cases, role queues, entity lists, dashboard results, and the mobile case card. It is also applied to case detail created/updated audit displays, field-visit review/edit displays, submitted field-visit audit text, and generated/submitted/date-of-visit PDF output. The final source scan recorded in the plan found only `calendar.tsx` month/dropdown and `data-day` metadata calls plus the numeric `chart.tsx` call; those are not date text displays requiring this fix. No remaining incorrect user-facing locale date formatter was identified in the reviewed source.

### Scope and verification evidence

The reviewed hunks only change display formatting and imports, except for the Field Visit tab conditional described above. API ISO conversion code and data/input paths are untouched. No database commands were run, consistent with the display-only scope.

The plan records an initial passing build, but its later review-iteration evidence records `npx tsc --noEmit` and `npm run build` blocked by the syntax error in this changed route, with lint blocked by the repository-wide CRLF/Prettier mismatch. Because the current diff is syntactically invalid and the task prohibits rerunning suites, the recorded evidence is sufficient to reject rather than validate a passing final state.

</details>

<details>
<summary>File map</summary>

- `src/lib/date-format.ts` — shared date-only and date-time display formatters.
- `src/routes/_app/*.tsx` — case, role queue, entity, dashboard, detail, and field-visit display sites migrated to the helpers.
- `src/components/app/CaseListCard.tsx` — mobile/card created-date display migrated.
- `src/components/case/SubmittedFieldVisit.tsx` — submitted audit and visit date displays migrated.
- `src/server/fieldVisitPdf.server.ts` — generated, submitted, and visit-date PDF output migrated.

Full diff: `git diff main`.

</details>
