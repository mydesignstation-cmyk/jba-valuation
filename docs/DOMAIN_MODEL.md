# Domain Model

## Roles

| Role | Responsibility |
|---|---|
| SUPER_ADMIN | Full control; the only role that can delete a Case |
| ADMIN | Creates and manages Cases; assigns Site Engineer; cannot process Maker/Checker/Uploader stages |
| SITE_ENGINEER | Performs the Field Visit and submits the Field Visit Form |
| MAKER | Reviews/edits submitted Field Visit information; completes the Maker stage |
| CHECKER | Reviews the Maker-completed case; completes the Checker stage |
| UPLOADER | Performs the final upload |

## Valuation Case

The central entity. It links to:

- Bank
- Branch
- Client
- Property
- Site Engineer
- Maker
- Checker
- Uploader
- Field Visit (form + generated PDF)
- Documents
- Workflow status
- History

## Case Stages

`CREATED → ASSIGNED → FIELD_VISIT_PENDING → FIELD_VISIT_SUBMITTED → MAKER_PENDING → MAKER_COMPLETED → CHECKER_PENDING → CHECKER_COMPLETED → UPLOADER_PENDING → COMPLETED`

## Documents

- Field Visit Form (submitted by the Site Engineer)
- Field Visit PDF (generated after submission; a persistent Case document)

## Open Questions

- Can a Checker send a case back to the Maker?
- Who can edit a Case after it has passed a stage?
