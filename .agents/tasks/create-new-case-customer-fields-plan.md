# Add Alternative Contact Fields to Customer Form - Create New Case

## Overview
Add two optional fields to the customer form in the "Create New Case" flow:
1. **Alternative contact person name** - Text field for alternative contact person
2. **Alternative phone number** - Text field for alternative contact phone (10 digits, same format as primary)

## Current Architecture

### Entry Points
- **Standalone Customer Creation**: `src/routes/_app/customers.index.tsx` (Customer Management page)
- **Case Creation with Customer**: `src/routes/_app/cases.new.tsx` (placeholder) → uses `CaseWithCustomerTabs` component

### Key Components
1. **`src/components/customer/CustomerForm.tsx`** - Reusable customer form component
   - Current fields: name, contact (10-digit phone), email, address
   - Used in both standalone customer creation and case creation
   - Props: initialData, onSubmit, onCancel, isSubmitting, submitText

2. **`src/components/case/CaseWithCustomerTabs.tsx`** - Creates new case with customer
   - Two tabs: Customer (Tab 1) + Case Details (Tab 2)
   - Uses `CustomerForm` fields for create customer flow
   - Inline customer form fields in "Customer" tab (lines 295-380)

### Data Flow
```
Customer Form → Validation (createCustomerSchema) 
             → API: api_createCustomer() 
             → Database: customers table 
             → Display on case list
```

### Files Requiring Changes

| File | Component | Changes |
|------|-----------|---------|
| `src/db/schema.ts` | DB Schema | Add 2 columns to `customers` table |
| `src/types/index.ts` | TypeScript | Add 2 fields to `Customer` interface |
| `src/schemas/customer.schema.ts` | Validation | Add validation for 2 new fields |
| `src/components/customer/CustomerForm.tsx` | UI Form | Add 2 new FormField inputs |
| `src/components/case/CaseWithCustomerTabs.tsx` | Case Creation UI | Add 2 new FormField inputs in Customer tab |
| `src/server/api.server.ts` | API | Update 3 functions (createCustomer, updateCustomer, mapping) |
| `src/data/customer.functions.ts` | Data Layer | May need updates if row mapping exists |

## Implementation Plan

### Step 1: Database Schema
**File**: `src/db/schema.ts`
- Add to `customers` pgTable (after existing fields):
  ```typescript
  alternative_contact_person_name: text(),
  alternative_phone_number: text(),
  ```

### Step 2: Generate & Apply Migration
```powershell
npx drizzle-kit generate
npx tsx src/db/migrate.ts
```

### Step 3: TypeScript Types
**File**: `src/types/index.ts`
- Add to `Customer` interface:
  ```typescript
  alternativeContactPersonName?: string;
  alternativePhoneNumber?: string;
  ```

### Step 4: Validation Schema
**File**: `src/schemas/customer.schema.ts`
- Update `createCustomerSchema` and `updateCustomerSchema`:
  ```typescript
  alternativeContactPersonName: z.string().optional().or(z.literal("")),
  alternativePhoneNumber: z.string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.replace(/\D/g, "").length === 10,
      "Phone number must be exactly 10 digits"
    ),
  ```

### Step 5: Customer Form Component
**File**: `src/components/customer/CustomerForm.tsx`
- Update `initialData` type to include new fields
- Add to `defaultValues` in form initialization
- Add 2 new FormField renders with TextField inputs
- Update form positioning (after address field)

### Step 6: Case Creation Form
**File**: `src/components/case/CaseWithCustomerTabs.tsx`
- Add 2 new FormField inputs in Customer tab (lines ~380)
- Mirror the fields from CustomerForm for consistency
- Handle phone number formatting same as primary contact

### Step 7: API Endpoints
**File**: `src/server/api.server.ts`
- In `api_createCustomer`: add fields to `.values()` object
- In `api_updateCustomer`: add fields to `.set()` object
- In any mapping function (e.g., `mapCustomerRow`): read fields from DB row

### Step 8: Verification
```powershell
npx tsc --noEmit  # Verify types
```

### Step 9: Testing
1. Create new customer with both fields filled
2. Verify fields save to database
3. Edit customer and update fields
4. Create case with customer form and new fields
5. Verify fields persist in both workflows

### Step 10: Commit
```powershell
git commit -m "feat: add alternative contact fields to customer form"
git push origin main
```

## Data Mapping

### Database ↔ TypeScript ↔ UI
| Database Column | TypeScript Property | Form Field |
|-----------------|-------------------|-----------|
| `alternative_contact_person_name` | `alternativeContactPersonName` | Text input |
| `alternative_phone_number` | `alternativePhoneNumber` | Phone input (10 digits) |

## Affected Workflows

### 1. Standalone Customer Creation
**Route**: `/customers` → Create New Customer
**Component**: `src/components/customer/CustomerForm.tsx`
**Impact**: Both new fields will be available when creating a standalone customer

### 2. Create New Case
**Route**: `/cases/new` → Customer Tab
**Component**: `src/components/case/CaseWithCustomerTabs.tsx`
**Impact**: Both new fields will be available in the customer creation section of case workflow

## Testing Checklist

- [ ] Migration generates and applies without errors
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Create standalone customer with both fields → verify saved
- [ ] Edit standalone customer with both fields → verify persisted
- [ ] Create case with customer form + new fields → verify saved
- [ ] Edit case and customer fields → verify persisted
- [ ] Both fields appear optional (no validation errors when blank)
- [ ] Phone number formatting works (strips non-digits, allows 10)

## Notes

- Both fields are **optional** (not required)
- Alternative phone follows same 10-digit validation as primary contact
- UI patterns should match existing customer form fields
- Both workflows (standalone + case creation) must be in sync
