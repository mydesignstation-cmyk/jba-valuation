# Design System

Professional, modern SaaS visual language for a property valuation operations platform.

## Tokens

Centralized in `src/lib/design-tokens.ts` (TypeScript mirror of the CSS variables in `src/styles.css`).

- **Colors** — professional blue primary; neutral slate surfaces; full light and dark variants (oklch)
- **Typography** — shared sans font stack, defined via `--font-sans` and typography tokens
- **Spacing** — spacing scale tokens
- **Radius** — corner radius tokens
- **Shadows** — card and popover shadows
- **Status colors** — one color per CaseStage (including `PENDING` variants), with readable labels

## Components

Standard shadcn/ui primitives only — no duplicate custom versions:

Button, Input, Select, Badge, Card, Dialog, Dropdown Menu, Tooltip, Tabs, Table, Toast (sonner), Skeleton.

## Layout

- `src/layouts/AppLayout.tsx` — shared application shell for future dashboard and workflow screens.

## Types & Schemas

- `src/types/index.ts` — `Role`, `CaseStage`, `User`, `ValuationCase`, `CaseHistoryEntry`
- `src/schemas/case.schema.ts` — Zod schemas (`createCaseSchema`, `assignEngineerSchema`)
