# CRUD Operations Matrix

This document describes which CRUD operations are available for each entity.

## UI Pattern

Customer, Bank, and Branch are simple master-data entities managed entirely from
their list page:

- The list shows all fields, search, and sortable columns.
- **Create** and **Edit** both open a modal (`FormModal`) hosting the entity form.
- Clicking a table row opens the Edit modal for that record.
- The row action menu offers Edit and Delete.
- Delete uses a confirmation dialog.
- There are no separate detail / new / edit routes for these entities — the
  modal flow replaces them.

## Case

Cases use the same modal-based Create / Edit / Delete flow from the list page
(clickable rows open the Edit modal, action menu offers View / Edit / Delete,
delete uses a confirmation dialog). Unlike the master-data entities, a Case
**keeps its detail route** (`/cases/:caseId`) because that page is the workflow
hub (stage, assignment, history, field visit). The case number is generated
automatically and is not editable. Editing a case does not change its workflow
stage.

ADMIN:

- View cases
- Create case (case number auto-generated)
- Edit case (customer, request number, bank, branch, site engineer)
- Delete case
- View case detail

SUPER_ADMIN:

- View cases
- Create case (case number auto-generated)
- Edit case (customer, request number, bank, branch, site engineer)
- Delete case
- View case detail

## Customer

ADMIN:

- View customers
- Create customer
- Edit customer
- Delete customer

SUPER_ADMIN:

- View customers
- Create customer
- Edit customer
- Delete customer

## Bank

ADMIN:

- View banks
- Create bank
- Edit bank
- Delete bank (with dependency check - cannot delete if Cases reference this bank)

SUPER_ADMIN:

- View banks
- Create bank
- Edit bank
- Delete bank (with dependency check - cannot delete if Cases reference this bank)

## Branch

ADMIN:

- View branches
- Create branch
- Edit branch
- Delete branch (allow deletion for now; structure in place for future Case dependency check)

SUPER_ADMIN:

- View branches
- Create branch
- Edit branch
- Delete branch (allow deletion for now; structure in place for future Case dependency check)
