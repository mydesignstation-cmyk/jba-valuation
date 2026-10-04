# Sticky Form Footer Implementation Plan

## Goal
Add a sticky bottom footer for the field visit wizard's navigation buttons (Back, Save & Continue / Submit) so users don't have to scroll down. Keep it minimal and follow the UX pattern already established by `FormActions.tsx`.

## Design Decisions

1. **Component Location & Name**: Create `StickyFormFooter.tsx` in `src/components/ui/` — it's a low-level UI component like Button and Card, reusable across the app for similar patterns.

2. **Pattern Base**: Follow `FormActions.tsx` structure (`flex-col-reverse` for mobile-first, responsive `sm:flex-row`, `border-t`, `bg-background`) but allow more flexibility for wizards: onBack + onNext/onSubmit with independent disable states, instead of just submit + cancel.

3. **Sticky Strategy**: Use `fixed bottom-0 left-0 right-0` to dock to the bottom. Add `z-20` (above content but below modals like dialogs which use z-50). Add a `shadow-lg` or `shadow-md` for depth.

4. **Content Padding**: Add `pb-24` (or `pb-20`) to the form's CardContent to ensure content never sits under the sticky footer on any screen size.

5. **Label Logic**: Keep labels in the wizard component itself (pass as props). The StickyFormFooter just renders them. This keeps labels tied to step logic (isReview determines label text).

6. **Accessibility**: Use proper button semantics, allow keyboard navigation (inherit from Button component).

## Implementation Steps

### Step 1: Create StickyFormFooter component
**File**: `src/components/ui/sticky-form-footer.tsx`

Create a new UI component with these props:
- `onBack: () => void` — callback for back button
- `onNext: () => void` — callback for next/submit button  
- `backLabel?: string` — label for back button (default: "Back")
- `nextLabel?: string` — label for next button (default: "Save & Continue")
- `isBackDisabled?: boolean` — disable back button
- `isNextDisabled?: boolean` — disable next button
- `isPending?: boolean` — disable both buttons and show loading state
- `showBackButton?: boolean` — show/hide back button (default: true)
- `showNextIcon?: boolean` — show icon on next button (default: true, shows ArrowRight for "Save & Continue", no icon for submit)

Layout: 
- Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-20`
- Back button on left, Next on right (on desktop); stacked on mobile
- Use `flex flex-col-reverse gap-2 sm:flex-row sm:justify-between` (same as FormActions)
- Border top + light background: `border-t bg-background`
- Padding: `px-4 py-3` (same as FormActions), but add `shadow-md` for floating effect
- Buttons: `w-full sm:w-auto` (same responsive sizing)
- Safe area for iOS: can add `pb-safe` in Tailwind config if needed, but not urgent

### Step 2: Update FieldVisitWizard in cases.$caseId.field-visit.tsx
**File**: `src/routes/_app/cases.$caseId.field-visit.tsx`

Changes:
1. Import `StickyFormFooter` at the top
2. Remove the inline navigation div (lines ~1461–1502: the `<div className="flex flex-col-reverse..."` block with Back and conditional Next/Submit buttons)
3. Add `pb-24` class to the CardContent to create space so content doesn't hide under the footer
4. Inside the form (after closing the step conditionals, before closing `</form>`), render the StickyFormFooter with:
   - `onBack={goBack}`
   - `onNext={isReview ? onFinalSubmit : goNext}`
   - `backLabel="Back"`
   - `nextLabel={isReview ? (isEdit ? "Save Changes" : "Submit Field Visit Report") : "Save & Continue"}`
   - `isBackDisabled={stepIndex === 0 || submit.isPending}`
   - `isNextDisabled={submit.isPending || (isReview && !gpsReady)}`
   - `isPending={submit.isPending}`
   - `showBackButton={true}`
   - `showNextIcon={!isReview}` (show ArrowRight for "Save & Continue", no icon for submit)

### Step 3: Verify Checker Edit Mode
**File**: `src/routes/_app/checker.$caseId.tsx`

When FieldVisitWizard is rendered in edit mode (line ~172), the sticky footer is automatically used. No changes needed. The existing Edit button in the header (line ~205) remains unchanged.

## Verification

1. **Build & TypeScript Check**:
   - Run `npm run build` or `npx tsc --noEmit`
   - Confirm no errors

2. **Visual/Functional Test**:
   - Start the app and navigate to a field visit form (create or edit)
   - Scroll to the bottom: the Back/Save & Continue buttons should now be sticky at the bottom viewport
   - Click Back/Next — navigation should work
   - Resize to mobile view: buttons should be full width and stacked
   - Resize to desktop: buttons should be side-by-side, auto width
   - The form content should not be hidden under the footer (extra padding creates space)
   - On the review step: button label changes to "Save Changes" (edit) or "Submit Field Visit Report" (new), and GPS requirement is enforced

3. **Checker Edit Mode**:
   - Navigate to checker case and click Edit
   - Confirm the sticky footer is present and works

## Files Modified
- **Create**: `src/components/ui/sticky-form-footer.tsx`
- **Modify**: `src/routes/_app/cases.$caseId.field-visit.tsx` (import, CardContent pb, replace inline nav with component)
- **No change**: `src/routes/_app/checker.$caseId.tsx` (automatic via FieldVisitWizard)

## Summary
A minimal, reusable component that follows existing design patterns in the codebase (FormActions.tsx, Button.tsx). Solves the UX requirement without overcomplicating. All button logic remains in the wizard; the component is just the UI container and layout.
