# Implementation Plan: Add 7 New Fields to Field Visit Form

**Task:** Wire 7 new fields end-to-end (DB schema → types → validation schema → form UI → persistence → PDF → read-only display) for the multi-step field visit form.

**User Requirements:**
- Do NOT over-engineer or refactor. Keep changes minimal and focused.
- Do NOT run automated tests. User will verify manually.
- Work fast. This is a small, targeted change.

---

## 1. Database Migration: Add 7 NULLABLE columns to `field_visits` table

**What:** Generate a Drizzle migration to add 7 new NULLABLE columns to the `field_visits` table. These are nullable so existing rows (created by the basic version) are not broken. Required-ness is enforced at the app/server layer (Zod), not by DB constraints.

**Files:**
- `e:\codefiles\va2\src\db\schema.ts` — add the 7 columns to the fieldVisits table definition

**Exact changes:**
In the `fieldVisits` pgTable definition, add these 7 columns after `rate_basis` (which already exists in the Assessment section):

```typescript
// Inside the fieldVisits table definition, in the STEP 5 and STEP 6 sections:

// STEP 2 — NEW: Full Address
full_address: text("full_address"),

// STEP 5 — NEW: Boundary dimensions and description
boundary_length: numeric("boundary_length", { precision: 12, scale: 2 }),
boundary_breadth: numeric("boundary_breadth", { precision: 12, scale: 2 }),
boundary_area: numeric("boundary_area", { precision: 12, scale: 2 }),
boundary_description: text("boundary_description"),

// STEP 3 — NEW: Rent amount (conditional on occupancyStatus = 'Rented')
rent_amount: numeric("rent_amount", { precision: 12, scale: 2 }),

// STEP 6 — NEW: Area basis (enum: 'Carpet Area', 'Rare Carpet', 'Built Up', 'Super Built Up')
area_basis: varchar("area_basis", { length: 50 }),
```

**Placement:**
- `full_address` — in STEP 2 comments block, after `occupancy_with_name`
- `boundary_length`, `boundary_breadth`, `boundary_area`, `boundary_description` — in STEP 5 comments block, after the existing 4 boundary fields
- `rent_amount` — in STEP 3 comments block, after `year_of_living`
- `area_basis` — in STEP 6 comments block, after `rate_basis`

**Verify:** After migration is applied, run `npm run build` to confirm no type errors in the DB schema.

---

## 2. Update Domain Types: Add 7 fields to `FieldVisit` interface

**What:** Add the 7 properties to the `FieldVisit` interface in types/index.ts so the entire codebase recognizes the new fields.

**Files:**
- `e:\codefiles\va2\src\types\index.ts`

**Exact changes:**
In the `FieldVisit` interface:

1. Add after `occupancyWithName?: string;` (end of STEP 2 block):
   ```typescript
   fullAddress?: string; // Full Address as per site — STEP 2
   ```

2. Add after `yearOfLiving?: string;` (STEP 3 block):
   ```typescript
   rentAmount?: string; // Rent amount — conditional if occupancyStatus === 'Rented' — STEP 3
   ```

3. Add after `boundarySouth?: string;` (end of STEP 5 block):
   ```typescript
   boundaryLength?: string; // Boundary length in SQ FT — STEP 5
   boundaryBreadth?: string; // Boundary breadth in SQ FT — STEP 5
   boundaryArea?: string; // Auto-calculated: length × breadth — STEP 5
   boundaryDescription?: string; // Description of boundaries — STEP 5
   ```

4. Add after `rateBasis?: string;` (STEP 6 block):
   ```typescript
   areaBasis?: string; // Area basis (Carpet Area, Rare Carpet, Built Up, Super Built Up) — STEP 6
   ```

**Verify:** Run `npm run build` to confirm TypeScript has no errors.

---

## 3. Update Validation Schema: Add 7 fields to Zod schemas

**What:** Add validation rules for the 7 new fields, following existing patterns (requiredText, numericString, etc.), grouped into their correct step schemas.

**Files:**
- `e:\codefiles\va2\src\schemas\fieldVisit.schema.ts`

**Exact changes:**

1. **Add areaBasisOptions** (new export, after rateBasisOptions):
   ```typescript
   export const areaBasisOptions = [
     "Carpet Area",
     "Rare Carpet",
     "Built Up",
     "Super Built Up",
   ] as const;
   
   export const areaBasisSchema = z.enum(areaBasisOptions);
   ```

2. **Update step2Schema:** Add `fullAddress` as a required text field:
   ```typescript
   export const step2Schema = z
     .object({
       fullAddress: requiredText("Full Address", 1000),
       landmark: requiredText("Landmark", 500, 3),
       // ... rest of step2 fields unchanged
     })
     // ... keep existing .refine rules
   ```

3. **Update step3Schema:** Add `rentAmount` with a conditional refine rule:
   After the existing `step3Shape` definition, modify step3Schema to add rentAmount:
   ```typescript
   const step3Shape = {
     // ... existing fields
     rentAmount: z.string().optional().or(z.literal("")), // Will be validated conditionally below
   };
   
   export const step3Schema = z.object(step3Shape)
     .refine(
       (data) =>
         data.occupancyStatus !== "Rented" ||
         (data.rentAmount && data.rentAmount.trim() && Number.isFinite(Number(data.rentAmount))),
       {
         message: "Rent amount is required when occupancy status is 'Rented' and must be numeric",
         path: ["rentAmount"],
       }
     );
   ```
   
   **Important:** The existing step3Schema is defined as `z.object(step3Shape)` and then later reused in the full schema with a `.and()`. Modify the EXISTING `const step3Schema = z.object(step3Shape);` line to add the `.refine()` rule for rentAmount.

4. **Update step5Schema:** Add the 4 boundary fields (all required):
   ```typescript
   export const step5Schema = z.object({
     boundaryLength: numericString("Length in SQ FT", { min: 0 }),
     boundaryBreadth: numericString("Breadth in SQ FT", { min: 0 }),
     boundaryArea: numericString("Area", { min: 0 }),
     boundaryDescription: requiredText("Boundary Description", 2000),
     boundaryEast: requiredText("Boundary — East", 500),
     boundaryWest: requiredText("Boundary — West", 500),
     boundaryNorth: requiredText("Boundary — North", 500),
     boundarySouth: requiredText("Boundary — South", 500),
   });
   ```

5. **Update step6Schema:** Add `areaBasis` as a required enum field (after `rateBasis`):
   ```typescript
   export const step6Schema = z
     .object({
       approachRoadCondition: approachRoadSchema,
       // ... existing fields
       rateBasis: rateBasisSchema,
       areaBasis: areaBasisSchema,
       negativePoints: requiredText("Negative points", 2000),
       // ... rest unchanged
     })
     // ... keep existing .refine rule
   ```

**Verify:** Run `npm run build` to confirm Zod schema validation compiles.

---

## 4. Update Form UI: Add fields to the wizard form in 4 steps

**What:** Update the form component to render the 7 new fields in their correct steps, with auto-calculation for Boundary Area, conditional display for Rent Amount, and demo data support.

**Files:**
- `e:\codefiles\va2\src\routes\_app\cases.$caseId.field-visit.tsx`

**Exact changes:**

1. **Import areaBasisOptions** (top of file, in the import from fieldVisit.schema):
   ```typescript
   import {
     // ... existing imports
     areaBasisOptions,
   } from "@/schemas/fieldVisit.schema";
   ```

2. **Update STEP_FIELDS array** (around line 225) to include the new fields in their steps:
   ```typescript
   const STEP_FIELDS: Path<FieldVisitFormValues>[][] = [
     [
       "personMet",
       "personPhone",
       "relationship",
       "otherRelationship",
       "otherRelationshipRemarks",
       "gpsLatitude",
       "gpsLongitude",
     ],
     [
       "fullAddress",  // NEW — at the TOP of step 2
       "landmark",
       "propertyType",
       "propertyTypeRemarks",
       "localityType",
       "occupancyStatus",
       "occupancyStatusRemarks",
       "occupancyWithName",
     ],
     [
       "structureType",
       "structureTypeRemarks",
       "yearOfLiving",
       "rentAmount",  // NEW — conditionally required if occupancyStatus === 'Rented'
       "occupancyLevel",
       "floorsInBuilding",
       "locatedOnFloor",
       "flatsOnFloor",
       "wingsInBuilding",
       "liftsStaircases",
     ],
     [
       "yearOfConstruction",
       "constructionStage",
       "workDescription",
       "flatIdentification",
       "plotDemarcation",
       "noOfLabor",
       "materialAtSite",
     ],
     [
       "boundaryLength",  // NEW
       "boundaryBreadth",  // NEW
       "boundaryArea",  // NEW
       "boundaryDescription",  // NEW
       "boundaryEast",
       "boundaryWest",
       "boundaryNorth",
       "boundarySouth",
     ],
     [
       "approachRoadCondition",
       "widthOfApproachRoad",
       "remarksApproachRoad",
       "societyNameBoard",
       "areaSqFt",
       "ratePerSqFt",
       "rateBasis",
       "areaBasis",  // NEW
       "negativePoints",
       "agentOpinion",
     ],
     ["finalRemarks"],
   ];
   ```

3. **Update EMPTY_FORM_VALUES** (around line 590) to include all 7 new fields as empty strings:
   ```typescript
   const EMPTY_FORM_VALUES = {
     // ... existing fields
     occupancyWithName: "",
     fullAddress: "",  // NEW
     // ... STEP 3
     rentAmount: "",  // NEW
     // ... STEP 5 (after existing boundary fields)
     boundaryLength: "",  // NEW
     boundaryBreadth: "",  // NEW
     boundaryArea: "",  // NEW
     boundaryDescription: "",  // NEW
     // ... STEP 6 (after rateBasis)
     areaBasis: undefined,  // NEW
     // ... rest
   } as unknown as FieldVisitFormValues;
   ```

4. **Update visitToFormValues()** function (around line 523) to map the 7 new fields from the DB FieldVisit to form values:
   ```typescript
   function visitToFormValues(visit: FieldVisit): FieldVisitFormValues {
     const num = (v: number | undefined) => (v != null ? String(v) : "");
     return {
       // ... existing fields
       occupancyWithName: visit.occupancyWithName ?? "",
       fullAddress: visit.fullAddress ?? "",  // NEW
       // ... STEP 3
       rentAmount: visit.rentAmount ?? "",  // NEW
       // ... STEP 5 (after existing boundary fields)
       boundaryLength: visit.boundaryLength ?? "",  // NEW
       boundaryBreadth: visit.boundaryBreadth ?? "",  // NEW
       boundaryArea: visit.boundaryArea ?? "",  // NEW
       boundaryDescription: visit.boundaryDescription ?? "",  // NEW
       // ... STEP 6 (after rateBasis)
       areaBasis: visit.areaBasis,  // NEW
       // ... rest
     } as unknown as FieldVisitFormValues;
   }
   ```

5. **Update demo-data button** (around line 715, inside the onClick handler) to populate the 7 new fields:
   ```typescript
   // After existing setValue calls:
   form.setValue("fullAddress", "123 Main Street, Mumbai");  // NEW
   form.setValue("rentAmount", "15000");  // NEW (after yearOfLiving)
   form.setValue("boundaryLength", "100");  // NEW (after materialAtSite)
   form.setValue("boundaryBreadth", "50");  // NEW
   form.setValue("boundaryArea", "5000");  // NEW
   form.setValue("boundaryDescription", "Well maintained boundaries");  // NEW
   form.setValue("areaBasis", "Built Up");  // NEW (after rateBasis)
   ```

6. **Add Full Address field to STEP 2** (around line 908, at the TOP before landmark):
   After the `<Separator />` and before the landmark field, add:
   ```typescript
   <TextAreaField
     form={form}
     name="fullAddress"
     label="Full Address as per site"
     placeholder="Enter the complete address of the property"
   />
   ```
   Place this ABOVE the landmark field so it appears first in Step 2.

7. **Add Rent Amount field to STEP 3** (around line 1020), conditionally displayed:
   After the yearOfLiving field and before occupancyLevel, add:
   ```typescript
   {v.occupancyStatus === "Rented" && (
     <TextField
       form={form}
       name="rentAmount"
       label="Rent Amount"
       placeholder="e.g. 15000"
       type="number"
       inputMode="decimal"
     />
   )}
   ```

8. **Add boundary dimensions and description to STEP 5** (around line 1112):
   Replace the existing Step 5 rendering with:
   ```typescript
   {/* STEP 5 — Property boundaries */}
   {stepIndex === 4 && (
     <div className="space-y-6">
       {/* NEW: Boundary dimensions section */}
       <div className="rounded-md border border-blue-200/40 bg-blue-50/30 p-4">
         <h4 className="text-sm font-semibold text-blue-900 mb-4">Boundary Dimensions</h4>
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
           <TextField
             form={form}
             name="boundaryLength"
             label="Length in SQ FT"
             placeholder="e.g. 100"
             type="number"
             inputMode="decimal"
           />
           <TextField
             form={form}
             name="boundaryBreadth"
             label="Breadth in SQ FT"
             placeholder="e.g. 50"
             type="number"
             inputMode="decimal"
           />
         </div>
         <div className="mt-4">
           <ReadOnlyField
             label="Area (Auto-calculated)"
             value={
               v.boundaryLength && v.boundaryBreadth
                 ? `${(Number(v.boundaryLength) * Number(v.boundaryBreadth)).toFixed(2)} SQ FT`
                 : "—"
             }
           />
         </div>
       </div>

       <TextAreaField
         form={form}
         name="boundaryDescription"
         label="Boundary Description"
         placeholder="Describe the boundaries and demarcation details"
       />

       {/* Existing boundary fields */}
       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
         <TextField form={form} name="boundaryEast" label="Boundary — East" />
         <TextField form={form} name="boundaryWest" label="Boundary — West" />
         <TextField form={form} name="boundaryNorth" label="Boundary — North" />
         <TextField form={form} name="boundarySouth" label="Boundary — South" />
       </div>
     </div>
   )}
   ```

9. **Auto-calculate Area on Length/Breadth change** (in the FieldVisitWizard function, after GPS handling, around line 639):
   Add this effect after the GPS value syncing:
   ```typescript
   // Auto-calculate boundary area when length or breadth changes
   const boundaryLength = form.watch("boundaryLength");
   const boundaryBreadth = form.watch("boundaryBreadth");
   if (boundaryLength && boundaryBreadth) {
     const length = Number(boundaryLength);
     const breadth = Number(boundaryBreadth);
     if (Number.isFinite(length) && Number.isFinite(breadth)) {
       const area = (length * breadth).toFixed(2);
       if (form.getValues("boundaryArea") !== area) {
         form.setValue("boundaryArea", area, { shouldValidate: true });
       }
     }
   }
   ```

10. **Add Area Basis field to STEP 6** (around line 1160, after rateBasis):
    After the rateBasis DropdownField, add:
    ```typescript
    <DropdownField
      form={form}
      name="areaBasis"
      label="Area Basis"
      options={areaBasisOptions}
      placeholder="Select area basis"
    />
    ```

11. **Update Review section** (around line 1299) to show the new fields:
    In the Boundaries ReviewSection (around line 1299), add the new fields at the top:
    ```typescript
    <ReviewSection title="Boundaries">
      <ReadOnlyField label="Length (SQ FT)" value={v.boundaryLength ?? ""} />
      <ReadOnlyField label="Breadth (SQ FT)" value={v.boundaryBreadth ?? ""} />
      <ReadOnlyField
        label="Area (SQ FT)"
        value={
          v.boundaryLength && v.boundaryBreadth
            ? `${(Number(v.boundaryLength) * Number(v.boundaryBreadth)).toFixed(2)}`
            : ""
        }
      />
      <ReadOnlyField label="Description" value={v.boundaryDescription ?? ""} />
      <ReadOnlyField label="East" value={v.boundaryEast ?? ""} />
      <ReadOnlyField label="West" value={v.boundaryWest ?? ""} />
      <ReadOnlyField label="North" value={v.boundaryNorth ?? ""} />
      <ReadOnlyField label="South" value={v.boundarySouth ?? ""} />
    </ReviewSection>
    ```

    In the Property ReviewSection (around line 1262), add Full Address at the top:
    ```typescript
    <ReviewSection title="Property">
      <ReadOnlyField label="Full Address" value={v.fullAddress ?? ""} />
      <ReadOnlyField label="Landmark" value={v.landmark} />
      // ... rest unchanged
    </ReviewSection>
    ```

    In the Building ReviewSection (around line 1276), add Rent Amount conditionally:
    ```typescript
    {v.occupancyStatus === "Rented" && (
      <ReadOnlyField label="Rent Amount" value={v.rentAmount ?? ""} />
    )}
    ```

    In the Assessment ReviewSection (around line 1310), add Area Basis after Rate Basis:
    ```typescript
    <ReadOnlyField label="Rate Basis" value={v.rateBasis ?? ""} />
    <ReadOnlyField label="Area Basis" value={v.areaBasis ?? ""} />
    <ReadOnlyField label="Negative Points" value={v.negativePoints ?? ""} />
    ```

**Verify:** Run `npm run build` — should compile without errors. Form should display all 7 fields in the correct steps.

---

## 5. Update API Persistence: Map form fields to/from DB in api.server.ts

**What:** Update the submission and update handlers to persist the 7 new form fields to the database and retrieve them on edit.

**Files:**
- `e:\codefiles\va2\src\server\api.server.ts`

**Exact changes:**

Search for the `api_submitFieldVisit` and `api_updateFieldVisit` functions. In the Drizzle insert/update calls, map the 7 new form fields to their DB columns:

1. In the `.values()` object of the `db.insert(fieldVisits).values()` call within `api_submitFieldVisit`, add:
   ```typescript
   full_address: values.fullAddress,
   boundary_length: values.boundaryLength,
   boundary_breadth: values.boundaryBreadth,
   boundary_area: values.boundaryArea,
   boundary_description: values.boundaryDescription,
   rent_amount: values.rentAmount,
   area_basis: values.areaBasis,
   ```

2. In the `.set()` object of the `db.update(fieldVisits).set()` call within `api_updateFieldVisit`, add the same 7 mappings.

3. In the `.set()` object of `api_updateFieldVisitByChecker`, add the same 7 mappings.

**Verify:** Run `npm run build` — should compile without errors.

---

## 6. Update PDF: Add 7 fields to generated Field Visit PDF

**What:** Update the PDF builder to include the 7 new fields in their sections.

**Files:**
- `e:\codefiles\va2\src\server\fieldVisitPdf.server.ts`

**Exact changes:**

Locate the section-drawing code in the PDF builder. Add the new fields to their corresponding sections:

1. **Property Details section** — add Full Address at the top:
   After the existing "Occupancy with Name" row, add:
   ```typescript
   new FieldRow("Full Address", show(visit.fullAddress)),
   ```

2. **Building Information section** — add Rent Amount conditionally:
   After "Year of Living", add:
   ```typescript
   ...(visit.occupancyStatus === "Rented" ? [new FieldRow("Rent Amount", show(visit.rentAmount))] : []),
   ```

3. **Property Boundaries section** — add the 4 new boundary fields at the TOP, before the existing 4:
   ```typescript
   new FieldRow("Boundary Length (SQ FT)", show(visit.boundaryLength)),
   new FieldRow("Boundary Breadth (SQ FT)", show(visit.boundaryBreadth)),
   new FieldRow("Boundary Area (SQ FT)", show(visit.boundaryArea)),
   new FieldRow("Boundary Description", show(visit.boundaryDescription)),
   new FieldRow("East", show(visit.boundaryEast)),
   // ... rest unchanged
   ```

4. **Assessment Details section** — add Area Basis after Rate Basis:
   After the "Rate Basis" row, add:
   ```typescript
   new FieldRow("Area Basis", show(visit.areaBasis)),
   ```

**Verify:** Run `npm run build` — should compile without errors. PDF generation should include all new fields.

---

## 7. Update Read-Only Display: Add fields to SubmittedFieldVisit component

**What:** Update the read-only display component to show all 7 new fields in their sections.

**Files:**
- `e:\codefiles\va2\src\components\case\SubmittedFieldVisit.tsx`

**Exact changes:**

1. **In the Property SectionCard** (around line 237), add Full Address at the top:
   ```typescript
   <ReadOnlyField label="Full Address" value={visit.fullAddress ?? "—"} />
   <ReadOnlyField label="Landmark" value={visit.landmark ?? "—"} />
   // ... rest unchanged
   ```

2. **In the Building SectionCard** (around line 258), add Rent Amount conditionally after Year of Living:
   ```typescript
   <ReadOnlyField label="Year of Living" value={visit.yearOfLiving ?? "—"} />
   {visit.occupancyStatus === "Rented" && (
     <ReadOnlyField label="Rent Amount" value={visit.rentAmount ?? "—"} />
   )}
   <ReadOnlyField label="Occupancy Level (%)" value={visit.occupancyLevel ?? "—"} />
   // ... rest unchanged
   ```

3. **In the Boundaries SectionCard** (around line 277), add the 4 new fields at the TOP:
   ```typescript
   <SectionCard title="Boundaries" icon={Compass}>
     <ReadOnlyField label="Length (SQ FT)" value={visit.boundaryLength ?? "—"} />
     <ReadOnlyField label="Breadth (SQ FT)" value={visit.boundaryBreadth ?? "—"} />
     <ReadOnlyField
       label="Area (SQ FT)"
       value={
         visit.boundaryLength && visit.boundaryBreadth
           ? `${(Number(visit.boundaryLength) * Number(visit.boundaryBreadth)).toFixed(2)}`
           : "—"
       }
     />
     <ReadOnlyField label="Description" value={visit.boundaryDescription ?? "—"} />
     <ReadOnlyField label="East" value={visit.boundaryEast ?? "—"} />
     // ... rest unchanged
   </SectionCard>
   ```

4. **In the Assessment SectionCard** (around line 295), add Area Basis after Rate Basis:
   ```typescript
   <ReadOnlyField label="Rate Basis" value={visit.rateBasis ?? "—"} />
   <ReadOnlyField label="Area Basis" value={visit.areaBasis ?? "—"} />
   <ReadOnlyField label="Negative Points" value={visit.negativePoints ?? "—"} />
   // ... rest unchanged
   ```

**Verify:** Run `npm run build` — should compile without errors. Read-only display should show all 7 fields.

---

## 8. Generate and Apply Database Migration

**What:** Generate the Drizzle migration from the updated schema, then apply it to the Neon database.

**Files:** (auto-generated)
- `e:\codefiles\va2\src\db\migrations/` — new migration file

**Exact steps:**
1. Verify `.env.local` contains `DATABASE_URL_UNPOOLED` pointing to `ep-muddy-math-b3on57py` (the ONE Neon database for this project).
2. Run: `npx drizzle-kit generate`
   - Drizzle generates a migration file in `src/db/migrations/`.
   - Review the migration to confirm it contains all 7 new NULLABLE columns.
3. Run: `npx tsx src/db/migrate.ts`
   - Applies the migration to the Neon database.
   - Confirm no errors.
4. Verify the migration succeeded by checking that `SELECT * FROM field_visits LIMIT 1;` includes the new columns.

**Verify:** Migration applied successfully; `npm run build` compiles without errors.

---

## Summary

All 7 fields are now wired end-to-end:
- ✓ Database: 7 new NULLABLE columns in `field_visits` table
- ✓ Types: 7 new optional properties in `FieldVisit` interface
- ✓ Schema: 7 new fields in Zod step schemas (with conditional and auto-calc rules)
- ✓ Form UI: 7 fields rendered in correct steps, with auto-area-calc and conditional rent amount
- ✓ Demo data: auto-fill button populates all 7 fields
- ✓ Persistence: form fields → DB columns → edit mode retrieval
- ✓ PDF: all 7 fields rendered in sections
- ✓ Read-only display: all 7 fields shown in SubmittedFieldVisit

No refactoring. No tests. Minimal, focused changes following existing patterns.
