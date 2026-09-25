# Domain Foundation — Property Valuation Case Management

Case-management application for a valuation agency that performs property valuation work for banks.

## 1. Roles

| Role | Responsibility |
|---|---|
| SUPER_ADMIN | Everything Admin can do, plus the only role that can delete a Case. |
| ADMIN | Creates and manages Cases, assigns Site Engineer. Cannot process Maker, Checker or Uploader stages. |
| SITE_ENGINEER | Performs the Field Visit and submits the Field Visit Form. |
| MAKER | Reviews/edits submitted Field Visit information, then completes. |
| CHECKER | Reviews the Maker-completed case, then completes. |
| UPLOADER | Performs the final upload. |

## 2. Central Entity — Valuation Case

The Case is the central object connecting:

- Bank
- Branch
- Client
- Property
- Site Engineer
- Maker
- Checker
- Uploader
- Field Visit
- Documents
- Workflow status
- History

## 3. Workflow

```text
ADMIN creates Case
  -> Assign Site Engineer
  -> Site Engineer performs Field Visit
  -> Field Visit Form submitted
  -> Field Visit PDF generated
  -> Maker reviews/edits
  -> Maker completes
  -> Checker reviews
  -> Checker completes
  -> Uploader performs final upload
  -> Case Completed
```

The Case moves through controlled workflow stages.

## 4. Major Entities

- Case
- Bank, Branch
- Client
- Property
- Users and Roles
- Field Visit (form data)
- Documents (including the Field Visit PDF — a persistent Case document)
- Workflow status
- History

## 5. Major Permissions

| Action | Allowed roles |
|---|---|
| Delete Case | SUPER_ADMIN only |
| Create / manage Case, assign people | ADMIN, SUPER_ADMIN |
| Field Visit | SITE_ENGINEER |
| Maker stage | MAKER |
| Checker stage | CHECKER |
| Final upload | UPLOADER |

ADMIN cannot process Maker, Checker or Uploader stages.
Permissions must eventually be enforced server-side.

## 6. CRUD Operations vs Workflow Actions

**CRUD operations** — create, read, update, delete record data (e.g. create a Case, edit branch details, delete a Case). They change information but do not advance the Case.

**Workflow actions** — controlled transitions that move a Case to its next stage (assign Site Engineer, submit Field Visit, Maker complete, Checker complete, final upload). Each depends on the Case's current stage and the actor's role, and should be recorded in History.

## Open Questions (not yet defined)

- Can a Checker send a case back to the Maker?
- Who may edit a Case after it has passed a stage?
