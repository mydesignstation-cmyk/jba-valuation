# Workflow

## Case Lifecycle

1. **ADMIN** creates the Case → `CREATED`
2. **ADMIN** assigns a Site Engineer → `ASSIGNED`
3. **SITE_ENGINEER** performs the Field Visit → `FIELD_VISIT_PENDING`
4. **SITE_ENGINEER** submits the Field Visit Form → `FIELD_VISIT_SUBMITTED`; the Field Visit PDF is generated
5. **MAKER** reviews/edits the submitted Field Visit information → `MAKER_PENDING`
6. **MAKER** completes the Maker stage → `MAKER_COMPLETED`
7. **CHECKER** reviews the Maker-completed case → `CHECKER_PENDING`
8. **CHECKER** completes the Checker stage → `CHECKER_COMPLETED`
9. **UPLOADER** performs the final upload → `UPLOADER_PENDING`
10. Case Completed → `COMPLETED`

## Rules

- The Case moves through controlled workflow stages; each stage has a designated role.
- Only Super Admin can delete a Case.
- Admin cannot process Maker, Checker or Uploader stages.
- Permissions are enforced server-side.

## Open Questions

- Can a Checker send a case back to the Maker?
- Who can edit a Case after it has passed a stage?
