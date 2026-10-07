# Maker Valuation Parity Repair — Implementation Plan

## 1. Audit decisions and verified baseline

- The canonical inventory below is **115 fields**, not an assumed “100+” count. It is derived from the `FormField` names and read-only calculated values in `src/components/case/MakerValuationForm.tsx`, its `defaultValues`/`handleAutoFill` object, every key in `createMakerValuationSchema`, and `MakerValuation`/`CreateMakerValuationInput`.
- The approved Neon database was checked read-only using `.env.local` with `DATABASE_URL_UNPOOLED || DATABASE_URL`. The host was `ep-muddy-math-b3on57py.c-4.ap-southeast-1.aws.neon.tech`; the server reported database `neondb`, role `neondb_owner`. The live table has all 115 canonical field columns plus metadata. No writes or destructive SQL were performed.
- Migration `0015_add_maker_valuations.sql` creates only the five required Basic fields plus metadata. `0016_add_calculation_fields.sql` adds the remaining 110 canonical columns. The live table matches the migration column names/types except that `src/db/schema.ts` declares the eight boundary side values as `text`, while both migration 0016 and Neon declare them `varchar(255)`. Align Drizzle to the live table; do not create a destructive migration.
- Create/update persistence and `mapMakerValuationRow` currently contain all canonical names. Numeric DB columns are represented at the form/domain boundary as strings; the edit adapter must explicitly normalize numeric values to strings, dates to `YYYY-MM-DD`, and nullish values to `""` so this remains true regardless of postgres-js driver return mode.
- The exact current edit loss is: case route query `api_getMakerValuation(caseId)` -> server `api_getMakerValuation` -> `mapMakerValuationRow` -> route renders the saved card, but the edit branch passes only the five Basic fields in `initialValues` -> `MakerValuationForm` initializes every other field from empty defaults. `MakerValuationForm` has no `reset`/edit hydration effect and submits through the create/upsert function. Therefore 110 values are dropped at the route/form prop boundary; the five Basic values are the only values hydrated. Preserve the existing session-token/auth checks; do not “fix” this by removing authentication.
- The saved card currently renders Basic (5), only 3 Area fields, all 4 editable Rate fields, five calculated/detail values, and Remarks. It omits the Additional, General, Boundary/Location/Occupancy, Apartment, Flat, and Marketability sections and most Area/Details fields. The PDF renderer already has a row for every canonical field, but its comments/description incorrectly call it minimal; the implementation must keep every row and improve the layout/section headings/wrapping so all values remain readable.
- `rateRange` must remain an open numeric `<Input type="number">`, not a dropdown.

## 2. Canonical inventory (115 fields)

Legend: `F` = editable form control; `RO` = read-only calculated form output backed by the same canonical submitted value; `D` = default value; `V` = validation key; `T` = TypeScript domain/input key. Every row below is present in all four source inventories; the parity matrix records the downstream gaps.

### Basic (5)

| Field | Form/default/validation/type |
|---|---|
| `dateOfValuation` | F/D/V/T |
| `dateOfInspection` | F/D/V/T |
| `refNo` | F/D/V/T |
| `branch` | F/D/V/T |
| `bankName` | F/D/V/T |

### Additional (19)

| Field | Form/default/validation/type |
|---|---|
| `purchaserName` | F/D/V/T |
| `typeOfProperty` | F/D/V/T |
| `flatNo` | F/D/V/T |
| `locatedOnFloor` | F/D/V/T |
| `wing` | F/D/V/T |
| `buildingName` | F/D/V/T |
| `landmark` | F/D/V/T |
| `roadNameArea` | F/D/V/T |
| `location` | F/D/V/T |
| `plotNo` | F/D/V/T |
| `ctsNo` | F/D/V/T |
| `sNo` | F/D/V/T |
| `other` | F/D/V/T |
| `village` | F/D/V/T |
| `wardNo` | F/D/V/T |
| `taluka` | F/D/V/T |
| `blockNo` | F/D/V/T |
| `district` | F/D/V/T |
| `pinCode` | F/D/V/T |

### General (22)

| Field | Form/default/validation/type |
|---|---|
| `purposeOfValuation` | F/D/V/T |
| `documentsName1` | F/D/V/T |
| `documentsDetails1` | F/D/V/T |
| `documentsName2` | F/D/V/T |
| `documentsDetails2` | F/D/V/T |
| `documentsName3` | F/D/V/T |
| `documentsDetails3` | F/D/V/T |
| `nameOfOwner` | F/D/V/T |
| `address` | F/D/V/T |
| `configurationInShort` | F/D/V/T |
| `configurationFullDescription` | F/D/V/T |
| `locality` | F/D/V/T |
| `classOfLocality1` | F/D/V/T |
| `classOfLocality2` | F/D/V/T |
| `classOfLocality3` | F/D/V/T |
| `municipalCorporation` | F/D/V/T |
| `typeOfLand` | F/D/V/T |
| `genuinenessOrAuthenticity` | F/D/V/T |
| `anyOtherComments` | F/D/V/T |
| `nosOfFloor` | F/D/V/T |
| `nosOfStaircase` | F/D/V/T |
| `nosOfLifts` | F/D/V/T |

### Boundary / location / occupancy (13)

| Field | Form/default/validation/type |
|---|---|
| `boundaryPropertyNorth` | F/D/V/T |
| `boundaryPropertySouth` | F/D/V/T |
| `boundaryPropertyEast` | F/D/V/T |
| `boundaryPropertyWest` | F/D/V/T |
| `boundaryPropertyMeasured` | F/D/V/T |
| `boundarySiteNorth` | F/D/V/T |
| `boundarySiteSouth` | F/D/V/T |
| `boundarySiteEast` | F/D/V/T |
| `boundarySiteWest` | F/D/V/T |
| `boundarySiteMeasured` | F/D/V/T |
| `latitude` | F/D/V/T |
| `longitude` | F/D/V/T |
| `occupancy` | F/D/V/T |

### Apartment / Flat (27)

| Field | Form/default/validation/type |
|---|---|
| `yearOfConstruction` | F/D/V/T |
| `ageOfBuilding` | F/D/V/T |
| `residualLife` | F/D/V/T |
| `typeOfStructure` | F/D/V/T |
| `nosOfUnitPerFloor` | F/D/V/T |
| `buildingType` | F/D/V/T |
| `appearance` | F/D/V/T |
| `qualityOfConstruction` | F/D/V/T |
| `maintenance` | F/D/V/T |
| `protectedWaterSupply` | F/D/V/T |
| `undergroundSewerage` | F/D/V/T |
| `nosOfParking` | F/D/V/T |
| `compoundWall` | F/D/V/T |
| `openCoveredParking` | F/D/V/T |
| `pavementLaidAroundBuilding` | F/D/V/T |
| `flooring` | F/D/V/T |
| `doors` | F/D/V/T |
| `windows` | F/D/V/T |
| `fittings` | F/D/V/T |
| `finishing` | F/D/V/T |
| `assessmentNo` | F/D/V/T |
| `taxAmount` | F/D/V/T |
| `taxPaidInNameOf` | F/D/V/T |
| `electricityServiceConnectionNo` | F/D/V/T |
| `meterCardInNameOf` | F/D/V/T |
| `meterCardDated` | F/D/V/T |
| `undividedAreaOfLand` | F/D/V/T |

### Marketability (3)

| Field | Form/default/validation/type |
|---|---|
| `marketability` | F/D/V/T |
| `positiveFactors` | F/D/V/T |
| `negativeFactors` | F/D/V/T |

### Area (11)

| Field | Form/default/validation/type |
|---|---|
| `physicalMeasuredArea` | F/D/V/T |
| `physicalMeasuredAreaBasis` | F/D/V/T |
| `documentedArea` | F/D/V/T |
| `documentedAreaBasis` | F/D/V/T |
| `approvedPlanArea` | F/D/V/T |
| `approvedPlanAreaBasis` | F/D/V/T |
| `builtUpArea` | F/D/V/T |
| `builtUpAreaBasis` | F/D/V/T |
| `adoptedArea` | F/D/V/T |
| `adoptedAreaBasis` | F/D/V/T |
| `floorSpaceIndex` | F/D/V/T |

### Rate (5; `insuranceValue` is calculated)

| Field | Form/default/validation/type |
|---|---|
| `rateRange` | F/D/V/T — keep open numeric input |
| `adoptedRate` | F/D/V/T |
| `buildingRate` | F/D/V/T |
| `landRate` | F/D/V/T |
| `insuranceValue` | RO/D/V/T — calculated from `builtUpArea × buildingRate` |

### Details (9; five are calculated)

| Field | Form/default/validation/type |
|---|---|
| `marketValue` | RO/D/V/T — calculated from `adoptedArea × adoptedRate` |
| `carParkingValue` | F/D/V/T |
| `fairMarketValue` | RO/D/V/T — calculated from market value plus parking |
| `realizableValue` | RO/D/V/T — calculated fair market value × 0.95 |
| `distressValue` | RO/D/V/T — calculated fair market value × 0.80 |
| `govtReadyReckonerRatePerSqMtr` | F/D/V/T |
| `govtReadyReckonerRatePerSqFt` | F/D/V/T |
| `govtValue` | RO/D/V/T — calculated from adopted area × government rate per sq.m. |
| `rentRangePerMonth` | F/D/V/T |

### Remarks (1)

| Field | Form/default/validation/type |
|---|---|
| `remarks` | F/D/V/T |

## 3. Complete parity matrix

Legend: `OK` = present, same camel/snake mapping, and compatible type; `RO` = present as a calculated read-only UI value; `PARTIAL` = only the five Basic values are currently passed into edit props; `MISSING` = absent; `TYPE-MISMATCH` = code declaration differs from the verified Neon/migration type. For the form inventory cell, all 115 source keys currently exist; calculated values are `RO` rather than editable `FormField`s.

| Group | Field | Form/default/schema/type | DB schema | Migration SQL | Create `.values` | Update `.set` | Row mapper | Edit reset/initialValues | Saved display | PDF |
|---|---|---|---|---|---|---|---|---|---|---|
| Basic | `dateOfValuation` | OK | OK | OK/0015 date | OK | OK | OK | PARTIAL (prop only) | OK | OK |
| Basic | `dateOfInspection` | OK | OK | OK/0015 date | OK | OK | OK | PARTIAL (prop only) | OK | OK |
| Basic | `refNo` | OK | OK | OK/0015 varchar(255) | OK | OK | OK | PARTIAL (prop only) | OK | OK |
| Basic | `branch` | OK | OK | OK/0015 varchar(255) | OK | OK | OK | PARTIAL (prop only) | OK | OK |
| Basic | `bankName` | OK | OK | OK/0015 varchar(255) | OK | OK | OK | PARTIAL (prop only) | OK | OK |
| Additional | `purchaserName` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `typeOfProperty` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `flatNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `locatedOnFloor` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `wing` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `buildingName` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `landmark` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `roadNameArea` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `location` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `plotNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `ctsNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `sNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `other` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `village` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `wardNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `taluka` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `blockNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `district` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Additional | `pinCode` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `purposeOfValuation` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `documentsName1` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `documentsDetails1` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `documentsName2` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `documentsDetails2` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `documentsName3` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `documentsDetails3` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `nameOfOwner` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `address` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `configurationInShort` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `configurationFullDescription` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `locality` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `classOfLocality1` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `classOfLocality2` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `classOfLocality3` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `municipalCorporation` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `typeOfLand` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `genuinenessOrAuthenticity` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `anyOtherComments` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `nosOfFloor` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `nosOfStaircase` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| General | `nosOfLifts` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundaryPropertyNorth` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundaryPropertySouth` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundaryPropertyEast` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundaryPropertyWest` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundaryPropertyMeasured` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundarySiteNorth` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundarySiteSouth` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundarySiteEast` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundarySiteWest` | OK | TYPE-MISMATCH (text vs Neon varchar) | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `boundarySiteMeasured` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `latitude` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `longitude` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Boundary | `occupancy` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `yearOfConstruction` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `ageOfBuilding` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `residualLife` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `typeOfStructure` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `nosOfUnitPerFloor` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `buildingType` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `appearance` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `qualityOfConstruction` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `maintenance` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `protectedWaterSupply` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `undergroundSewerage` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `nosOfParking` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `compoundWall` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `openCoveredParking` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `pavementLaidAroundBuilding` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `flooring` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `doors` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `windows` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `fittings` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `finishing` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `assessmentNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `taxAmount` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `taxPaidInNameOf` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `electricityServiceConnectionNo` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `meterCardInNameOf` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `meterCardDated` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Apartment/Flat | `undividedAreaOfLand` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Marketability | `marketability` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Marketability | `positiveFactors` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Marketability | `negativeFactors` | OK | OK | OK/0016 | OK | OK | OK | MISSING | MISSING | OK |
| Area | `physicalMeasuredArea` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Area | `physicalMeasuredAreaBasis` | OK | OK | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `documentedArea` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `documentedAreaBasis` | OK | OK | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `approvedPlanArea` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `approvedPlanAreaBasis` | OK | OK | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `builtUpArea` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Area | `builtUpAreaBasis` | OK | OK | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `adoptedArea` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Area | `adoptedAreaBasis` | OK | OK | OK/0016 varchar(255) | OK | OK | OK | MISSING | MISSING | OK |
| Area | `floorSpaceIndex` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Rate | `rateRange` | OK (open numeric input) | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Rate | `adoptedRate` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Rate | `buildingRate` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Rate | `landRate` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Calculation | `insuranceValue` | RO | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Calculation | `marketValue` | RO | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Details | `carParkingValue` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Calculation | `fairMarketValue` | RO | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Calculation | `realizableValue` | RO | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Calculation | `distressValue` | RO | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Details | `govtReadyReckonerRatePerSqMtr` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Details | `govtReadyReckonerRatePerSqFt` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Calculation | `govtValue` | RO | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | OK | OK |
| Details | `rentRangePerMonth` | OK | OK | OK/0016 numeric(12,2) | OK | OK | OK | MISSING | MISSING | OK |
| Remarks | `remarks` | OK | OK | OK | OK | OK | OK | MISSING | PARTIAL (only non-empty) | OK |

## 4. Ordered implementation plan

1. **Make the domain/storage contract exact and auditable.** In `src/db/schema.ts`, change the eight boundary side columns from `text` to `varchar("...", { length: 255 })` to match the verified Neon table and migration 0016. Keep all numeric columns as `numeric(12,2)` and keep all form/domain numeric values string-shaped at the API boundary. Do not add a new migration for this code-only alignment, and do not alter/delete live data.
   - Files: `src/db/schema.ts`, `src/types/index.ts`, `src/schemas/makerValuation.schema.ts`, `src/db/migrations/0015_add_maker_valuations.sql`, `src/db/migrations/0016_add_calculation_fields.sql` only if a non-destructive comment/documentation correction is needed.
   - Verify: `npx tsc --noEmit` and `npm run build`; confirm the live-column comparison remains read-only and unchanged.

2. **Make one typed canonical form-value adapter and repair edit hydration.** In `src/components/case/MakerValuationForm.tsx`, define/reuse a complete default-value object for all 115 fields and accept a full `initialValues?: MakerValuation` (or an equivalent complete input-shaped type), not only five Basic fields. Normalize every property with `value == null ? "" : String(value)`; normalize date values to `YYYY-MM-DD` for `<Input type="date">`; preserve existing `caseId` and the existing resolver. Reset the form when `initialValues` changes and use the complete saved valuation for edit mode. Keep the existing upsert call and auth/session-token path intact.
   - Files: `src/components/case/MakerValuationForm.tsx`, `src/routes/_app/cases.$caseId.index.tsx`.
   - Verify: `npx tsc --noEmit`; manually open an existing saved valuation, click Edit, and confirm every text, select, numeric, date, and calculated value is populated before changing anything.

3. **Repair the dev auto-fill as a valid all-field fixture.** Keep the `📝 Dev Auto-Fill` button, but make it assign a non-empty valid value to every canonical field, including calculated backing values. Use exact existing option values (`Residential Flat`, `High`, `Urban`, `Posh class`, `Yes`, `Self-occupied`, `RCC, Load Bearing, Mixed`, etc.) rather than current invalid fixture values such as `Apartment`, `Owner Occupied`, `Prime`, `Commercial`, `Genuine`, `Measured`, or `RCC`. Set deterministic formula outputs consistent with the form calculation: insurance `2400000.00`, market `5000000.00`, fair market `5100000.00`, realizable `4845000.00`, distress `4080000.00`, and government value `4000000.00` for the existing fixture inputs. Do not turn `rateRange` into a select.
   - Files: `src/components/case/MakerValuationForm.tsx`.
   - Verify: `npx tsc --noEmit`; use the button, submit, reload, and inspect that no canonical field is blank and no select has an invalid value.

4. **Preserve/verify complete create, update, and row mapping with explicit conversion helpers.** In `src/server/api.server.ts`, keep the existing `requireServerUser(token, "MAKER")` check and all existing create/update behavior. Refactor only as needed to use one explicit field mapping for the 115 values so insert and update cannot drift. Convert optional empty strings to `null` for storage, ensure numeric strings are accepted by the numeric columns, regenerate the PDF from the complete valuation before persistence, and make `mapMakerValuationRow` normalize every nullable and numeric field to the domain string contract. Preserve `created_by_id` on updates unless the existing behavior intentionally requires otherwise. Keep `src/data/makerValuation.functions.ts` auth/session-token behavior unchanged; GET/download authorization behavior must not be weakened.
   - Files: `src/server/api.server.ts`, `src/data/makerValuation.functions.ts` only if types require a wrapper signature update.
   - Verify: `npx tsc --noEmit`; run the app flow with a valid Maker session and verify create, reload, edit, change one value in each major section, save, reload, and compare all 115 values.

5. **Replace the partial saved card with a complete parity display.** In `src/routes/_app/cases.$caseId.index.tsx`, render all 115 fields grouped in the same sections as the form: Basic, Additional, General, Boundary/Location/Occupancy, Apartment, Flat, Marketability, Area, Rate, Details of Valuation, calculated values, and Remarks. Use a shared display helper that shows an em dash for null/empty values instead of conditionally removing fields, so empty fields are still visibly accounted for. Include all area basis values, car parking, both government rates, rent range, insurance, every calculated value, and all long text fields. Pass the complete `makerValuation` object into the edit form; do not construct a five-field projection.
   - Files: `src/routes/_app/cases.$caseId.index.tsx`; create a small shared display helper/component only if it avoids duplication without introducing a second field definition.
   - Verify: `npx tsc --noEmit`; use the auto-filled record and confirm the saved card shows 115 labeled rows with matching values, including empty-value em dashes when applicable.

6. **Harden the complete PDF renderer.** In `src/server/makerValuationPdf.server.ts`, retain one row for every canonical field, add clear section headings, wrap long labels/values (address, document details, comments, factors, boundaries, configuration, remarks), and paginate without clipping or overlap. Continue formatting the two dates with the project date utility and showing em dashes for null values. Keep numeric values as saved, include all calculated values, and do not claim the PDF contains only five Basic fields in comments or user-visible metadata.
   - Files: `src/server/makerValuationPdf.server.ts`.
   - Verify: `npx tsc --noEmit` and `npm run build`; download the auto-filled PDF, extract/inspect its text, and confirm all 115 labels and values occur across the generated pages.

7. **Run full project validation and parity checks.** Add no fake fields and no duplicate DB columns. Validate that the canonical field list is unchanged across form/defaults/schema/types, the live Neon table and migration names/types match, create/update/mapper keys are one-to-one, edit reset preserves values, the display contains all labels, and PDF text contains all labels. Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`; fix all failures before committing. No database migration should be applied unless a future non-destructive schema change is actually introduced, and any DB command must re-check the approved `ep-muddy-math-b3on57py...` host first.
   - Files: all changed files above; add focused automated tests only if a test runner is introduced deliberately (the current `package.json` has no test script/framework).
   - Verify: all three commands exit successfully plus the end-to-end auto-fill -> save -> reload -> edit -> save -> display/PDF smoke test passes.

## 5. Known gaps to close explicitly

- Current route edit props contain only `dateOfValuation`, `dateOfInspection`, `refNo`, `branch`, and `bankName`; this is the primary data-loss point.
- Current form has no edit `reset`/`useEffect`; `defaultValues` are used only on first mount and do not hydrate a later-fetched valuation.
- Current display omits 70+ fields and hides empty fields by conditional rendering; it is not a parity display.
- Current PDF code has all rows but lacks section/layout robustness and still documents itself as a five-field/minimal PDF; validation must prove the generated PDF is readable and complete.
- Eight boundary side columns are the only verified code-schema/live-schema type discrepancy: Neon/migration are `varchar(255)`, while Drizzle currently says `text`.
- Several current auto-fill select values do not exist in the option arrays; these must be replaced with exact valid option strings rather than weakening validation or adding duplicate options.
