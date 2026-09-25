# Project Context

Property valuation case-management application for a valuation agency that performs valuation work for banks.

## Central Object

The **Valuation Case** is the central object. It connects: Bank, Branch, Client, Property, Site Engineer, Maker, Checker, Uploader, Field Visit, Documents, Workflow status, History.

## Roles

- SUPER_ADMIN
- ADMIN
- SITE_ENGINEER
- MAKER
- CHECKER
- UPLOADER

## Basic Workflow

ADMIN creates a Case → assigns Site Engineer → Site Engineer performs Field Visit → Field Visit Form submitted → Field Visit PDF generated → Maker reviews/edits → Maker completes → Checker reviews → Checker completes → Uploader performs final upload → Case Completed.

## Key Business Rules

- Only Super Admin can delete a Case.
- Admin can create and manage Cases but cannot process Maker, Checker or Uploader stages.
- Site Engineer handles the Field Visit.
- Maker reviews/edits the submitted Field Visit information.
- Checker reviews the Maker-completed case.
- Uploader performs the final upload.
- The Case moves through controlled workflow stages.
- Permissions must be enforced server-side.
- The Field Visit PDF is a persistent Case document.

## Current State

- React + TypeScript + Vite + TanStack Router + Tailwind CSS + shadcn/ui + Zod.
- Frontend foundation, design tokens, types, schemas, mock data, and shared UI primitives are in place.
- No database or external services connected yet. No dashboard or workflow screens built yet.

## Open Questions

- Can a Checker send a case back to the Maker?
- Who can edit a Case after it has passed a stage?
