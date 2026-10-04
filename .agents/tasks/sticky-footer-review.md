# Sticky Form Footer for Field Visit Wizard

Adds a new reusable `StickyFormFooter` component that pins navigation buttons (Back, Save & Continue / Submit) to the bottom of the viewport, eliminating the need to scroll down to navigate steps. The component replaces the inline navigation div in the field visit wizard and automatically inherits to checker edit mode via the wizard render. Content padding (`pb-24`) is added to prevent overlap. Existing button logic and state management remain in the wizard; the component is purely a layout and presentation layer.

**Verdict**: APPROVED

---

## High-level view

The new `StickyFormFooter` component uses `fixed` positioning with `bottom-0` and `z-20` to dock buttons to the bottom of the viewport, avoiding scroll fatigue on long forms. Mobile buttons stack vertically in reverse order (primary action on top) via `flex-col-reverse`; desktop buttons sit side-by-side via `sm:flex-row`. The component accepts callbacks, labels, and disabled states as props, allowing the wizard to control all navigation logic while the footer handles only layout and styling. The `pb-24` padding added to the form's parent ensures content never scrolls behind the sticky footer on any screen size. Icons and labels are conditionally rendered based on form state (e.g., the next button shows an arrow for "Save & Continue" but no icon for "Submit Field Visit Report"). The component follows the existing `FormActions.tsx` pattern in the codebase, maintaining design consistency. Checker edit mode automatically inherits the sticky footer since it renders the same `FieldVisitWizard` component.

---

<details>
<summary>Issues</summary>

None. This change is well-structured, maintainable, and solves the UX requirement without introducing behavioral risks.

</details>

---

<details>
<summary>Details</summary>

### Component Design and Semantics

The `StickyFormFooter` is a lightweight UI component with a clear single responsibility: render navigation buttons in a sticky, responsive container. The interface exposes nine props covering all necessary concerns: callbacks (`onBack`, `onNext`), labels (with sensible defaults), disabled states (`isBackDisabled`, `isNextDisabled`), a pending/loading flag, and visibility toggles (`showBackButton`, `showNextIcon`). The use of separate `isBackDisabled` and `isNextDisabled` flags instead of a single combined state is correct — it allows the wizard to express that the back button is disabled due to being on step 0 independently from the next button being disabled due to missing GPS data, reflecting their distinct constraints. The `isPending` flag is applied to both buttons via `disabled={isBackDisabled || isPending}` and `disabled={isNextDisabled || isPending}`, which is the correct precedence: a pending request takes precedence over step-specific disable logic.

### Layout and Responsive Behavior

The sticky container uses `fixed bottom-0 left-0 right-0 z-20`, placing it above form content but below modal overlays (which conventionally use `z-50`). The `flex shrink-0` prevents the footer from being squeezed by flex layout of the parent viewport. The mobile-first layout uses `flex-col-reverse gap-2`, which stacks buttons vertically with the primary action (next/submit) on top — a UX best practice for mobile forms. The `sm:flex-row sm:justify-between` breakpoint transitions to desktop, positioning back on the left and next on the right with `justify-between`. Both buttons use `w-full sm:w-auto`, ensuring full width on mobile but allowing natural sizing on desktop. The padding `px-4 py-3` and `px-6` (responsive) matches the existing `FormActions` pattern in the codebase, preserving visual consistency.

### Content Padding and No-Overlap Guarantee

The `pb-24` class added to `CardContent` creates 96px (6rem) of bottom padding, which is sufficient to prevent form content from scrolling behind the ~90px footer (buttons + padding + border). The padding is applied to the content layer, not the form wrapper, ensuring it affects only the scrollable content area. This is the correct place to add it — the form itself never scrolls (it's the content that scrolls), so padding the content ensures the last input field can be scrolled into view above the footer.

### Button Logic and State Transitions

Navigation callbacks and labels are wired correctly. The wizard passes `isReview ? onFinalSubmit : goNext` for the next button, allowing the footer to invoke the correct handler. The label is conditionally set: "Save Changes" for edit mode on review, "Submit Field Visit Report" for new visit on review, and "Save & Continue" for all non-review steps. The `showNextIcon` is set to `!isReview`, meaning the arrow icon appears for "Save & Continue" but not for the review-step submit button — a subtle but good UX distinction (a submit button typically does not carry a forward arrow). The `isBackDisabled` logic preserves the existing constraints: disabled on step 0 (first step) or whenever a request is pending. The `isNextDisabled` logic correctly enforces: disabled during pending requests, or if on review step and GPS coordinates are not ready. This matches the prior implementation exactly.

### Accessibility and Keyboard Navigation

Buttons use `type="button"` explicitly, preventing form submission when clicked (important since the form's `onSubmit` is prevented). Both buttons delegate their accessibility to the underlying Button component from the design system, which handles focus management, aria attributes, and keyboard navigation. The use of icons (`ArrowLeft`, `ArrowRight`) in buttons is paired with text labels, ensuring screen reader users get the full context. The component does not introduce any new accessibility concerns.

### Design System Consistency

The component imports and uses the existing `Button` component from `@/components/ui/button`, inheriting its styling (variants, sizes, disabled states) without reimplementing button logic. The use of `border-t bg-background shadow-md` follows the `FormActions.tsx` pattern exactly, maintaining visual language consistency across the app. The icons are sourced from the same `lucide-react` library used throughout the codebase. No new styling patterns or dependencies are introduced.

### Integration with Wizard

The wizard's import statement correctly adds `StickyFormFooter` to the import block. The component is rendered inside the form but outside the step conditionals (after all step sections close), ensuring it's always present and receives current values from the form context. The wizard maintains full control over navigation: the footer only receives callbacks and never directly manipulates wizard state. This separation of concerns is clean and maintainable.

### Checker Edit Mode Integration

The checker file renders `FieldVisitWizard` at line 172 in edit mode. Since the sticky footer is now part of the wizard render, no changes are needed in the checker file. The footer will automatically appear when editing, with the same behavior and constraints. The plan correctly noted this would be automatic, and the implementation confirms it.

### Label Conditionals Are Clear

The label logic for the submit button is multi-level: `isReview` determines if we're on the final review step, and if so, `isEdit` determines whether to show "Save Changes" (edit) or "Submit Field Visit Report" (new). This is correct and matches the prior inline implementation. The conditional is expressed inline in the prop, which is readable and keeps related logic co-located.

### No Behavior Changes Outside Navigation

The change removes the inline `<div className="flex flex-col-reverse...">` block that previously held the navigation buttons and replaces it with the component call. All button click handlers (`goBack`, `goNext`, `onFinalSubmit`), form submission logic, and step navigation remain unchanged. The only behavioral change is that buttons are now sticky; their functional behavior is identical.

</details>

---

<details>
<summary>File map</summary>

- **src/components/ui/sticky-form-footer.tsx** (new, 62 lines) — Reusable sticky footer component with navigation buttons, responsive layout (stacked mobile, side-by-side desktop), and callback-driven button logic.
- **src/routes/_app/cases.$caseId.field-visit.tsx** (modified) — Added import for `StickyFormFooter` (1 line), added `pb-24` to `CardContent` to prevent overlap (1 line), replaced inline navigation div (40 lines removed, 18 lines replaced with component call). No changes to step logic, form state, or navigation callbacks.

Full diff: https://github.com/mydesignstation-cmyk/jba-valuation/commit/7ba5d6f

</details>
