# Feature Reveal Flags (CSS-only hide)

We ship the whole app at once, then reveal features one at a time so the
product feels like it is under active, steady development instead of dropping
everything on customers in a single overwhelming release.

## How it works

Each staged feature is hidden with a **CSS-only** class defined in
`src/styles.css`. The rule is just:

```css
.feature-hidden-<name> {
  display: none !important;
}
```

Nothing is deleted or disabled in logic. The components stay mounted and fully
functional — they are only visually removed. That makes releasing a feature a
one-line change with zero risk to behaviour.

## To release / unhide a feature

**Remove the class usage from the JSX** (not the rule in `styles.css`).
Deleting the class from the element is the "flag off" switch. Then commit and
deploy.

Do not edit or delete the rules in `styles.css` — leaving them in place keeps
the mechanism ready for the next staged feature.

## Current flags

| Flag class                  | What it hides                                                        | Where to remove it to release                                                                 |
| --------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `feature-hidden-dashboard`  | All internal Dashboard cards (KPIs, Cases-by-Stage, Recent Cases)    | `src/routes/_app/dashboard.tsx` — remove the wrapper `<div className="feature-hidden-dashboard ...">` and delete the "Coming soon" placeholder block |
| `feature-hidden-pipeline`   | The case pipeline / stage tracker inside the case detail page        | `src/routes/_app/cases.$caseId.index.tsx` — remove the wrapper `<div className="feature-hidden-pipeline">` around `<CasePipeline />` |
| `feature-hidden-search`     | Every search box (the shared `SearchInput` component)                | `src/components/app/SearchInput.tsx` — remove `feature-hidden-search` from the container `className` |

## Reveal order (as executed)

1. **Dashboard cards** — page kept, cards CSS-hidden, "Coming soon" shown.
2. **Pipeline view** — stage tracker CSS-hidden inside case detail.
3. **Search boxes** — all search inputs CSS-hidden app-wide.

## Notes

- The dashboard shows a plain "Coming soon" message while its cards are hidden.
  When you release the dashboard, remove that placeholder block as well.
- `feature-hidden-search` is applied once in the shared `SearchInput`
  component, so it covers every search box in the app (cases, banks, branches,
  customers, maker, checker, uploader, my-cases). Removing it releases them all
  at once.
