# Field Visit Form — Edit Template (Fast Path)

**Use this template for ANY field visit form change: adding fields, changing validation, updating display, etc.**

All field visit form changes follow the same 7-file pattern. Use this template to edit fast.

---

## File Edit Checklist

### 1. **Database Schema** (`src/db/schema.ts`)

**Pattern:**
```typescript
// Inside fieldVisits pgTable, in the correct STEP block:
field_name: columnType("field_name", { options }),
```

**Copy-paste for your field:**
```typescript
// STEP N — [Your field description]
your_field_name: text("your_field_name"),  // or numeric, varchar, etc.
```

**Add to:** `src/db/schema.ts` → `fieldVisits` table → correct STEP section (Step 2–7)

**Then:** `npx drizzle-kit generate` → creates migration → `npx tsx src/db/migrate.ts` → applies it

---

### 2. **TypeScript Types** (`src/types/index.ts`)

**Pattern:**
```typescript
// Inside FieldVisit interface, in the correct STEP block comment:
yourFieldName?: string; // Description — STEP N
```

**Copy-paste for your field:**
```typescript
yourFieldName?: string; // Your field label and description — STEP N
```

**Add to:** `src/types/index.ts` → `FieldVisit` interface → correct STEP comment section

---

### 3. **Validation Schema** (`src/schemas/fieldVisit.schema.ts`)

**Pattern A — Simple required text:**
```typescript
yourFieldName: requiredText("Your Field Label", 500),
```

**Pattern B — Optional text:**
```typescript
yourFieldName: optionalText(500),
```

**Pattern C — Required numeric:**
```typescript
yourFieldName: numericString("Your Field Label", { min: 0, max: 999 }),
```

**Pattern D — Required enum:**
```typescript
// First, add the options:
export const yourFieldOptions = ["Option1", "Option2", "Option3"] as const;
export const yourFieldSchema = z.enum(yourFieldOptions);

// Then add to the step schema:
yourFieldName: yourFieldSchema,
```

**Pattern E — Conditional (only if another field matches):**
```typescript
.refine(
  (data) =>
    data.someField !== "SomeValue" ||
    (data.yourFieldName && data.yourFieldName.trim()),
  {
    message: "Your Field is required when Some Field is 'Some Value'",
    path: ["yourFieldName"],
  }
)
```

**Add to:** `src/schemas/fieldVisit.schema.ts` → correct `stepNSchema` (step2Schema–step7Schema)

---

### 4. **Form Component UI** (`src/routes/_app/cases.$caseId.field-visit.tsx`)

**Step A — Update STEP_FIELDS array:**
```typescript
const STEP_FIELDS: Path<FieldVisitFormValues>[][] = [
  [...],
  [
    "existingField1",
    "yourFieldName",  // ← Add here in correct step
    "existingField2",
  ],
  [...],
];
```

**Step B — Add to EMPTY_FORM_VALUES:**
```typescript
const EMPTY_FORM_VALUES = {
  // ... existing
  yourFieldName: "",  // or undefined if dropdown/enum
  // ... rest
} as unknown as FieldVisitFormValues;
```

**Step C — Add to visitToFormValues() (edit mode):**
```typescript
function visitToFormValues(visit: FieldVisit): FieldVisitFormValues {
  const num = (v: number | undefined) => (v != null ? String(v) : "");
  return {
    // ... existing
    yourFieldName: visit.yourFieldName ?? "",  // or num(visit.yourFieldName) if numeric
    // ... rest
  };
}
```

**Step D — Add to demo data button (around line 715):**
```typescript
form.setValue("yourFieldName", "demo value");
```

**Step E — Render the field in the correct step section:**

For **Step 2 (Property Details):**
```typescript
{stepIndex === 1 && (
  <div className="space-y-6">
    <TextAreaField
      form={form}
      name="yourFieldName"
      label="Your Field Label"
      placeholder="Enter..."
    />
    {/* existing fields */}
  </div>
)}
```

For **Step 3 (Building Info):**
```typescript
{stepIndex === 2 && (
  <div className="space-y-6">
    {/* existing fields */}
    <TextField
      form={form}
      name="yourFieldName"
      label="Your Field Label"
      placeholder="e.g. value"
    />
    {/* rest */}
  </div>
)}
```

**Conditional rendering (show only if another field = X):**
```typescript
{v.occupancyStatus === "Rented" && (
  <TextField
    form={form}
    name="rentAmount"
    label="Rent Amount"
    placeholder="e.g. 15000"
  />
)}
```

**Dropdown:**
```typescript
<DropdownField
  form={form}
  name="yourFieldName"
  label="Your Field Label"
  options={yourFieldOptions}
  placeholder="Select..."
/>
```

**Auto-calculated field (watch another field, update this one):**
```typescript
const fieldA = form.watch("fieldA");
const fieldB = form.watch("fieldB");
if (fieldA && fieldB) {
  const result = (Number(fieldA) * Number(fieldB)).toFixed(2);
  if (form.getValues("resultField") !== result) {
    form.setValue("resultField", result, { shouldValidate: true });
  }
}
```

**Read-only display (auto-calc):**
```typescript
<ReadOnlyField
  label="Result Field"
  value={
    v.fieldA && v.fieldB
      ? `${(Number(v.fieldA) * Number(v.fieldB)).toFixed(2)}`
      : "—"
  }
/>
```

**Step F — Add to Review section (around line 1262+):**
```typescript
{/* Correct ReviewSection - find Property/Building/Boundaries/Assessment */}
<ReviewSection title="Property">
  <ReadOnlyField label="Your Field" value={v.yourFieldName ?? ""} />
  {/* existing fields */}
</ReviewSection>
```

**Conditional in review:**
```typescript
{v.occupancyStatus === "Rented" && (
  <ReadOnlyField label="Rent Amount" value={v.rentAmount ?? ""} />
)}
```

---

### 5. **API Persistence** (`src/server/api.server.ts`)

**In `api_submitFieldVisit` → `.values()` object:**
```typescript
your_field_name: values.yourFieldName ? values.yourFieldName : null,
```

**In `api_updateFieldVisit` → `.set()` object:**
```typescript
your_field_name: values.yourFieldName ? values.yourFieldName : null,
```

**In `api_updateFieldVisitByChecker` → `.set()` object:**
```typescript
your_field_name: values.yourFieldName ? values.yourFieldName : null,
```

**Also update `mapFieldVisitRow()`:**
```typescript
if (row.your_field_name != null) visit.yourFieldName = row.your_field_name;
```

---

### 6. **PDF Generation** (`src/server/fieldVisitPdf.server.ts`)

**Pattern:**
```typescript
new FieldRow("Your Field Label", show(visit.yourFieldName)),
```

**Conditional (only if occupancy = Rented):**
```typescript
...(visit.occupancyStatus === "Rented" ? [new FieldRow("Rent Amount", show(visit.rentAmount))] : []),
```

**Add to:** Correct section (Property Details, Building Info, Boundaries, Assessment)

---

### 7. **Read-Only Display** (`src/components/case/SubmittedFieldVisit.tsx`)

**Pattern:**
```typescript
<ReadOnlyField label="Your Field Label" value={visit.yourFieldName ?? "—"} />
```

**Conditional:**
```typescript
{visit.occupancyStatus === "Rented" && (
  <ReadOnlyField label="Rent Amount" value={visit.rentAmount ?? "—"} />
)}
```

**Add to:** Correct SectionCard (Property, Building, Boundaries, Assessment)

---

## Quick Reference: Step Indices

| Step | Index | stepIndex | Files Affected |
|------|-------|-----------|-----------------|
| Visit (Person Met, GPS) | 0 | `stepIndex === 0` | Types, Schema, Form, API, PDF, Display |
| Property (Landmark, Type) | 1 | `stepIndex === 1` | Schema, Form, API, PDF, Display |
| Building (Floors, Structure) | 2 | `stepIndex === 2` | Types, Schema, Form, API, PDF, Display |
| Construction (Year, Stage) | 3 | `stepIndex === 3` | Types, Schema, Form, API, PDF, Display |
| Boundaries (East/West/N/S) | 4 | `stepIndex === 4` | Types, Schema, Form, API, PDF, Display |
| Assessment (Rate, Area) | 5 | `stepIndex === 5` | Types, Schema, Form, API, PDF, Display |
| Review | 6 | `stepIndex === 6` | Review sections only |

---

## Execution Path (Fast)

1. **Read** `src/db/schema.ts` (find the STEP section)
2. **Edit** schema.ts + types/index.ts + fieldVisit.schema.ts (5 min)
3. **Edit** field-visit.tsx (STEP_FIELDS, EMPTY_FORM_VALUES, visitToFormValues, demo, render, review) (10 min)
4. **Edit** api.server.ts (add 3 mappings in 3 functions) (3 min)
5. **Edit** fieldVisitPdf.server.ts (add 1–2 FieldRow calls) (2 min)
6. **Edit** SubmittedFieldVisit.tsx (add 1–2 ReadOnlyField calls) (2 min)
7. **Verify** `npx tsc --noEmit` → no errors (1 min)
8. **Commit** & push (1 min)

**Total:** ~25 minutes for most field additions. No workflow needed.

---

## Copy-Paste Snippets

### Add a simple required text field:

```typescript
// schema.ts
field_name: text("field_name"),

// types/index.ts
fieldName?: string; // Description — STEP N

// fieldVisit.schema.ts
fieldName: requiredText("Field Label", 500),

// form component (find correct stepIndex)
<TextAreaField
  form={form}
  name="fieldName"
  label="Field Label"
  placeholder="Enter..."
/>

// api.server.ts (3 places)
field_name: values.fieldName ? values.fieldName : null,

// fieldVisitPdf.server.ts
new FieldRow("Field Label", show(visit.fieldName)),

// SubmittedFieldVisit.tsx
<ReadOnlyField label="Field Label" value={visit.fieldName ?? "—"} />
```

### Add a numeric field with auto-calculation (like Area = Length × Breadth):

```typescript
// schema.ts
field_a: numeric("field_a", { precision: 12, scale: 2 }),
field_b: numeric("field_b", { precision: 12, scale: 2 }),
field_result: numeric("field_result", { precision: 12, scale: 2 }),

// types/index.ts
fieldA?: string; fieldB?: string; fieldResult?: string; — STEP N

// fieldVisit.schema.ts
fieldA: numericString("Field A", { min: 0 }),
fieldB: numericString("Field B", { min: 0 }),
fieldResult: numericString("Field Result", { min: 0 }),

// form component (in effect or watcher)
const fieldA = form.watch("fieldA");
const fieldB = form.watch("fieldB");
if (fieldA && fieldB) {
  const result = (Number(fieldA) * Number(fieldB)).toFixed(2);
  if (form.getValues("fieldResult") !== result) {
    form.setValue("fieldResult", result, { shouldValidate: true });
  }
}

// Render:
<TextField form={form} name="fieldA" label="Field A" ... />
<TextField form={form} name="fieldB" label="Field B" ... />
<ReadOnlyField label="Field Result" value={v.fieldA && v.fieldB ? `${(Number(v.fieldA) * Number(v.fieldB)).toFixed(2)}` : "—"} />
```

### Add a conditional field (show only if occupancyStatus === "Rented"):

```typescript
// schema.ts
field_name: numeric("field_name", { precision: 12, scale: 2 }),

// fieldVisit.schema.ts (in step3Schema refine)
.refine(
  (data) =>
    data.occupancyStatus !== "Rented" ||
    (data.fieldName && Number.isFinite(Number(data.fieldName))),
  {
    message: "Field Name is required when occupancy is Rented",
    path: ["fieldName"],
  }
)

// form component (render conditionally)
{v.occupancyStatus === "Rented" && (
  <TextField form={form} name="fieldName" label="Field Name" ... />
)}

// review section
{v.occupancyStatus === "Rented" && (
  <ReadOnlyField label="Field Name" value={v.fieldName ?? ""} />
)}

// PDF
...(visit.occupancyStatus === "Rented" ? [new FieldRow("Field Name", show(visit.fieldName))] : []),

// SubmittedFieldVisit
{visit.occupancyStatus === "Rented" && (
  <ReadOnlyField label="Field Name" value={visit.fieldName ?? "—"} />
)}
```

---

## Don't Forget

- [ ] Update STEP_FIELDS array with new field name
- [ ] Add to EMPTY_FORM_VALUES
- [ ] Add to visitToFormValues() (edit mode)
- [ ] Add to demo button
- [ ] Add to form render (correct stepIndex)
- [ ] Add to Review section
- [ ] Add to API handlers (3 functions)
- [ ] Add to PDF
- [ ] Add to SubmittedFieldVisit
- [ ] Run `npx tsc --noEmit`
- [ ] Commit with clear message

---

## When to Ask for Help

- If the field type doesn't fit the patterns above (e.g., file upload, multi-select)
- If the conditional logic is complex (more than one "if occupancy = X")
- If you need to add a new section to the form (don't; add to existing step)
- If the field affects multiple workflows or permissions

Otherwise: **Read this template, execute the checklist, commit, done.**

