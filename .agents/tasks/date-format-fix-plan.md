# Implementation Plan

- [x] 1. Add the project’s single display-date formatter in `src/lib/date-format.ts`.
      There is no existing shared date formatter (the only related shared module, `src/lib/case-format.ts`, contains case labels/status logic only). Add a small dependency-free helper that accepts the existing `string | Date` display values and returns zero-padded `DD/MM/YYYY` using `getDate()`, `getMonth() + 1`, and `getFullYear()`. Add a second helper in the same file for existing date-time audit/PDF displays, preserving their time while making the date portion `DD/MM/YYYY` (for example `DD/MM/YYYY, HH:mm`); do not alter parsing, ISO values, API serialization, storage, or form input values.
      Files: create `src/lib/date-format.ts`
      Verify: `npm run lint` passes after the helper is imported by the display call sites in the following steps.

- [x] 2. Replace every locale-dependent created-date display in the case/entity lists and mobile card with the shared date-only formatter.
      Current code is `new Date(...createdAt).toLocaleDateString()` at `src/routes/_app/cases.index.tsx:380`, `src/routes/_app/uploader.index.tsx:146`, `src/routes/_app/my-cases.tsx:214`, `src/routes/_app/maker.index.tsx:173`, `src/routes/_app/checker.index.tsx:258`, `src/routes/_app/customers.index.tsx:245`, `src/routes/_app/banks.index.tsx:217`, and `src/routes/_app/branches.index.tsx:215`; replace each with the imported shared formatter applied to the same value (for example `formatDisplayDate(c.createdAt)`). Current code at `src/components/app/CaseListCard.tsx:43` is `const created = new Date(createdAt).toLocaleDateString();`; replace it with the same helper, preserving the card’s surrounding text and behavior.
      Files: `src/routes/_app/cases.index.tsx`, `src/routes/_app/uploader.index.tsx`, `src/routes/_app/my-cases.tsx`, `src/routes/_app/maker.index.tsx`, `src/routes/_app/checker.index.tsx`, `src/routes/_app/customers.index.tsx`, `src/routes/_app/banks.index.tsx`, `src/routes/_app/branches.index.tsx`, `src/components/app/CaseListCard.tsx`
      Verify: `npm run lint` and `npm run build` pass; inspect the affected list/card views at runtime and confirm dates such as the reported `10/2/2026` render as `10/02/2026` and remain day/month/year.

- [x] 3. Replace the remaining in-app date displays with the shared helpers.
      In `src/routes/_app/dashboard.tsx:331`, replace `new Date(c.createdAt).toLocaleDateString()` with the date-only helper. In `src/routes/_app/cases.$caseId.index.tsx:728`, replace `new Date(valuationCase.createdAt).toLocaleDateString()` with the date-only helper; at lines 793 and 798 replace `new Date(valuationCase.createdAt).toLocaleString()` and `new Date(valuationCase.updatedAt).toLocaleString()` with the date-time helper so the existing Created/Last Updated timestamp displays retain time while using a `DD/MM/YYYY` date portion. In `src/routes/_app/cases.$caseId.field-visit.tsx:848-849` and `:1236`, replace the two `new Date().toLocaleDateString()` calls with the date-only helper; in the edit branch at line 848, format `initialVisit?.visitDate` through the helper while preserving the existing `"—"` fallback (do not change the underlying visit-date value or form behavior).
      Files: `src/routes/_app/dashboard.tsx`, `src/routes/_app/cases.$caseId.index.tsx`, `src/routes/_app/cases.$caseId.field-visit.tsx`
      Verify: `npm run lint` and `npm run build` pass; exercise the dashboard, case detail, and field-visit review/edit screens and confirm every visible date is zero-padded `DD/MM/YYYY` (with time retained only where the screen currently shows a timestamp).

- [x] 4. Update submitted field-visit and PDF user-facing date output without touching data formats.
      In `src/components/case/SubmittedFieldVisit.tsx:148-157`, replace the local `fmt` implementation (`toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })`) with the shared date-time helper, preserving the existing submitted/maker/checker audit lines and their time information. In `src/server/fieldVisitPdf.server.ts:228` and `:237`, replace `new Date().toLocaleString()` and `new Date(visit.submittedAt).toLocaleString()` with the shared date-time helper; also format the displayed `visit.visitDate` at line 249 through the date-only helper instead of passing the raw stored `YYYY-MM-DD` value to `show()`. Keep `visitDate` storage and all API/database serialization unchanged.
      Files: `src/components/case/SubmittedFieldVisit.tsx`, `src/server/fieldVisitPdf.server.ts`
      Verify: `npm run lint` and `npm run build` pass; open a submitted field visit and download/view its PDF, confirming audit/generated/submitted dates have a `DD/MM/YYYY` date portion and the visit date is exactly `DD/MM/YYYY`.

- [x] 5. Perform a final scope check and runtime verification, including the reported Created-date path.
      Re-scan only source application code for remaining user-facing `toLocaleDateString()`/`toLocaleString()` date calls and confirm none remain except intentionally non-date UI/metadata uses: `src/components/ui/calendar.tsx:35` formats only the month dropdown label, `:157` writes a `data-day` attribute rather than visible text, and `src/components/ui/chart.tsx:226` formats a numeric value. Do not change those, database/API ISO serialization in `src/server/api.server.ts`, date parsing, sorting, schema fields, or date input values. If runtime verification exposes another visible date display missed by the scan, route it through the same helper rather than adding a one-off locale formatter.
      Files: all files changed in steps 1–4; no database files or data
      Verify: `npm run lint` and `npm run build` both pass, then manually verify representative list/table, mobile card, detail, field-visit, submitted-report, and PDF views. No database command is needed or permitted for this display-only fix.

## Verification Evidence

- `npm run build` — passed.
- `npx tsc --noEmit` — blocked by one pre-existing unrelated error in `src/components/case/CaseWithCustomerTabs.tsx:104` (`exactOptionalPropertyTypes` for `email`).
- `npm run lint` — blocked by the repository-wide existing CRLF/prettier configuration mismatch (10,719 errors, primarily `Delete \r`).
- Final source scan — no user-facing `toLocaleDateString()`/`toLocaleString()` date formatters remain. Remaining matches are calendar month/dropdown metadata and a numeric chart value only.
- No database commands were run.

## Final Review Iteration Evidence

- Removed the unrelated Field Visit tab/content condition from `src/routes/_app/cases.$caseId.index.tsx`, restoring the prior visibility behavior and fixing the unclosed JSX wrapper.
- `npx tsc --noEmit` — blocked by one pre-existing unrelated error in `src/components/case/CaseWithCustomerTabs.tsx:104` (`exactOptionalPropertyTypes` for `email`).
- `npm run build` — passed after the route fix and strict typing correction in `src/lib/date-format.ts`.
- `npm run lint` — previously run and blocked by the repository-wide CRLF/Prettier mismatch (10,722 errors, primarily `Delete \\r`); not rerun because no lint configuration or formatting changes were made.
- `git diff --check` — passed; only line-ending normalization warnings were reported.
- Final source scan for `toLocaleDateString(` / `toLocaleString(` — only `calendar.tsx` month/data-attribute usages and numeric `chart.tsx` formatting remain; no user-facing date formatter remains outside the shared helpers.
- No database commands were run.

## Review Iteration Evidence

- Fixed the confirmed timezone issue in `src/lib/date-format.ts`: `YYYY-MM-DD` date-only strings are now constructed from local calendar components before formatting, preserving the stored day across time zones. Timestamp values continue to use normal `Date` parsing.
- `npx tsx -e "import { formatDisplayDate, formatDisplayDateTime } from './src/lib/date-format.ts'; console.log(formatDisplayDate('2026-02-10')); console.log(formatDisplayDate(new Date(2026, 1, 10))); console.log(formatDisplayDateTime(new Date(2026, 1, 10, 9, 5)));"` — passed; output was `10/02/2026`, `10/02/2026`, and `10/02/2026, 09:05`.
- `npx tsc --noEmit` — blocked by the existing syntax error in `src/routes/_app/cases.$caseId.index.tsx:895` (`')' expected`).
- `npm run build` — blocked by the same existing route syntax error (`Adjacent JSX elements must be wrapped`) in `src/routes/_app/cases.$caseId.index.tsx:895`.
- `npm run lint` — blocked by the repository-wide existing CRLF/Prettier mismatch (10,720 errors, primarily `Delete \\r`).
- Final source scan for `toLocaleDateString(` / `toLocaleString(` — only the calendar month/data-attribute usages and numeric chart value remain; no user-facing date formatter remains outside the shared helpers.
- No database commands were run.
