import { formatDisplayDate } from "@/lib/date-format";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Building2,
  Castle,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Factory,
  Hammer,
  Home,
  Hotel,
  Landmark as LandmarkIcon,
  MapPin,
  Minus,
  RefreshCw,
  Route as RouteIcon,
  ShieldAlert,
  ShieldCheck,
  Trees,
  TriangleAlert,
  User as UserIcon,
  UserCheck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StickyFormFooter } from "@/components/ui/sticky-form-footer";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/PageHeader";
import { requirePermission } from "@/lib/route-guard";
import { useCurrentUser, getSessionToken } from "@/lib/auth-client";
import { useGeolocation } from "@/lib/use-geolocation";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";
import {
  fieldVisitFormSchema,
  type FieldVisitFormValues,
  relationshipOptions,
  propertyTypeOptions,
  localityTypeOptions,
  occupancyStatusOptions,
  structureTypeOptions,
  approachRoadOptions,
  rateBasisOptions,
  areaBasisOptions,
} from "@/schemas/fieldVisit.schema";
import {
  api_getMyFieldVisit,
  api_submitFieldVisit,
  api_updateFieldVisit,
} from "@/data/fieldVisit.functions";
import { api_getCase } from "@/data/case.functions";
import { api_getCustomer } from "@/data/customer.functions";
import { api_getBank } from "@/data/bank.functions";
import { SubmittedFieldVisit } from "@/components/case/SubmittedFieldVisit";
import type { FieldVisit } from "@/types";

export const Route = createFileRoute("/_app/cases/$caseId/field-visit")({
  head: () => pageMeta("Field Visit", "Site inspection details for this case."),
  beforeLoad: requirePermission("fieldVisit.access"),
  component: Page,
});

// ---------------------------------------------------------------------------
// Case-derived, auto-filled data
// ---------------------------------------------------------------------------

export interface AutoFill {
  caseNumber: string;
  requestNumber: string;
  bankName: string;
  customerName: string;
  address: string;
}

/** Load the read-only, case-derived values shown across the wizard. */
export function useAutoFill(caseId: string) {
  const { data: valuationCase } = useQuery({
    queryKey: ["cases", caseId],
    queryFn: () => api_getCase(caseId),
    enabled: !!caseId,
  });
  const { data: customer } = useQuery({
    queryKey: ["customers", valuationCase?.customerId],
    queryFn: () => api_getCustomer(valuationCase!.customerId),
    enabled: !!valuationCase?.customerId,
  });
  const { data: bank } = useQuery({
    queryKey: ["banks", valuationCase?.bankId],
    queryFn: () => api_getBank(valuationCase!.bankId),
    enabled: !!valuationCase?.bankId,
  });

  const autoFill: AutoFill | null = valuationCase
    ? {
        caseNumber: valuationCase.caseNumber,
        requestNumber: valuationCase.requestNumber,
        bankName: bank?.name ?? valuationCase.bankId,
        customerName: customer?.name ?? valuationCase.customerId,
        address: customer?.address ?? "—",
      }
    : null;

  return autoFill;
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

type IconType = ComponentType<{ className?: string }>;

/** Per-option icons so every chip carries a glyph, not just a label. */
const OPTION_ICONS: Record<string, IconType> = {
  // Relationship
  Owner: UserCheck,
  Tenant: Users,
  Banker: LandmarkIcon,
  Agent: UserCog,
  Other: UserIcon,
  // Property type
  Industrial: Factory,
  Godown: Building2,
  "Row House": Home,
  Bungalow: Hotel,
  "Commercial Shop": Factory,
  "Commercial Office": Building,
  Penthouse: Castle,
  Duplex: Building2,
  "Residential Flat": Building,
  // Locality + approach road + occupancy share Good/Average/Poor etc.
  Good: ShieldCheck,
  Average: ShieldAlert,
  Poor: TriangleAlert,
  "No Access": Minus,
  // Occupancy status
  Seller: UserCheck,
  Rented: Users,
  Purchaser: UserCheck,
  // Structure type
  "Load Bearing": Building2,
};

/** The 7 wizard steps, in order. Index 6 (Review) collects nothing new. */
const STEPS = [
  { key: "visit", label: "Visit", icon: UserIcon },
  { key: "property", label: "Property", icon: Home },
  { key: "building", label: "Building", icon: Building2 },
  { key: "construction", label: "Construction", icon: Hammer },
  { key: "boundaries", label: "Boundaries", icon: Compass },
  { key: "assessment", label: "Assessment", icon: MapPin },
  { key: "review", label: "Review", icon: ClipboardCheck },
] as const;

/** Which form fields belong to (and must validate before leaving) each step. */
const STEP_FIELDS: Path<FieldVisitFormValues>[][] = [
  [
    "personMet",
    "personPhone",
    "relationship",
    "otherRelationship",
    "relationshipRemarks",
    "gpsLatitude",
    "gpsLongitude",
  ],
  [
    "fullAddress",
    "landmark",
    "propertyType",
    "propertyTypeRemarks",
    "localityType",
    "occupancyStatus",
    "occupancyStatusRemarks",
    "occupancyWithName",
    "yearOfLiving",
  ],
  [
    "structureType",
    "structureTypeRemarks",
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
    "areaBasis",
    "rateBasis",
    "ratePerSqFt",
    "rentPerMonth",
    "negativePoints",
    "agentOpinion",
  ],
  ["finalRemarks"],
];

// ---------------------------------------------------------------------------
// Reusable field renderers (kept local; consistent labels + validation msgs)
// ---------------------------------------------------------------------------

type FormType = ReturnType<typeof useForm<FieldVisitFormValues>>;

function TextField({
  form,
  name,
  label,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  form: FormType;
  name: Path<FieldVisitFormValues>;
  label: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "numeric" | "decimal";
  maxLength?: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Input
            {...field}
            value={(field.value as string | number | undefined) ?? ""}
            type={type}
            inputMode={inputMode ?? (type === "number" ? "decimal" : undefined)}
            maxLength={maxLength}
            placeholder={placeholder}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField({
  form,
  name,
  label,
  placeholder,
}: {
  form: FormType;
  name: Path<FieldVisitFormValues>;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Textarea
            {...field}
            value={(field.value as string | undefined) ?? ""}
            placeholder={placeholder}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Integer-only text field: strips any non-digit as the user types. */
function NumberField({
  form,
  name,
  label,
  placeholder,
  maxLength,
}: {
  form: FormType;
  name: Path<FieldVisitFormValues>;
  label: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Input
            {...field}
            value={(field.value as string | undefined) ?? ""}
            type="text"
            inputMode="numeric"
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * A single-select rendered as a row of chips (no dropdown). Each chip carries
 * an icon and toggles the field value. Selection is required (validated by the
 * enum schema), so there is no "clear" affordance.
 */
function ChipField({
  form,
  name,
  label,
  options,
}: {
  form: FormType;
  name: Path<FieldVisitFormValues>;
  label: string;
  options: readonly string[];
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selected = (field.value as string | undefined) ?? "";
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
              {options.map((opt) => {
                const Icon = OPTION_ICONS[opt] ?? Minus;
                const active = selected === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => field.onChange(opt)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/**
 * A single-select dropdown field for options like rate basis.
 * Rendered as a native HTML select element.
 */
function DropdownField({
  form,
  name,
  label,
  options,
  placeholder,
}: {
  form: FormType;
  name: Path<FieldVisitFormValues>;
  label: string;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <select
            {...field}
            value={(field.value as string | undefined) ?? ""}
            onChange={(e) => field.onChange(e.target.value || undefined)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// GPS panel
// ---------------------------------------------------------------------------

function GpsPanel({
  gps,
  latitude,
  longitude,
}: {
  gps: ReturnType<typeof useGeolocation>;
  latitude: number | undefined;
  longitude: number | undefined;
}) {
  const captured = latitude != null && longitude != null;
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${captured ? "text-green-600" : "text-muted-foreground"}`} />
          <span className="text-sm font-medium">
            GPS Location <span className="text-destructive">*</span>
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void gps.capture()}
          disabled={gps.isCapturing}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${gps.isCapturing ? "animate-spin" : ""}`} />
          {captured ? "Recapture" : "Capture GPS"}
        </Button>
      </div>

      {captured ? (
        <div className="mt-3 grid grid-cols-2 gap-4">
          <ReadOnlyField label="Latitude" value={latitude!.toFixed(6)} />
          <ReadOnlyField label="Longitude" value={longitude!.toFixed(6)} />
        </div>
      ) : (
        <p
          className={`mt-2 text-sm ${
            gps.status === "denied" || gps.status === "error" || gps.status === "unavailable"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {gps.message || "GPS is required. Tap “Capture GPS” to record your location."}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The wizard
// ---------------------------------------------------------------------------

/**
 * Seed the wizard form from an existing (submitted) Field Visit for edit mode.
 * Maps the domain FieldVisit back onto the string-based form shape the schema
 * expects. GPS is carried through unchanged (the Maker cannot edit it, but the
 * schema still requires the values to be present and valid).
 */
function visitToFormValues(visit: FieldVisit): FieldVisitFormValues {
  const num = (v: number | undefined) => (v != null ? String(v) : "");
  return {
    personMet: visit.personMet ?? "",
    personPhone: visit.personPhone ?? "",
    relationship: visit.relationship,
    otherRelationship: visit.otherRelationship ?? "",
    relationshipRemarks: visit.relationshipRemarks ?? "",
    gpsLatitude: visit.gpsLatitude != null ? Number(visit.gpsLatitude) : undefined,
    gpsLongitude: visit.gpsLongitude != null ? Number(visit.gpsLongitude) : undefined,
    fullAddress: visit.fullAddress ?? "",
    landmark: visit.landmark ?? "",
    propertyType: visit.propertyType,
    propertyTypeRemarks: visit.propertyTypeRemarks ?? "",
    localityType: visit.localityType,
    occupancyStatus: visit.occupancyStatus,
    occupancyStatusRemarks: visit.occupancyStatusRemarks ?? "",
    occupancyWithName: visit.occupancyWithName ?? "",
    yearOfLiving: visit.yearOfLiving ?? "",
    structureType: visit.structureType,
    structureTypeRemarks: visit.structureTypeRemarks ?? "",
    occupancyLevel: visit.occupancyLevel ?? "",
    floorsInBuilding: visit.floorsInBuilding ?? "",
    locatedOnFloor: visit.locatedOnFloor ?? "",
    flatsOnFloor: visit.flatsOnFloor ?? "",
    wingsInBuilding: visit.wingsInBuilding ?? "",
    liftsStaircases: visit.liftsStaircases ?? "",
    yearOfConstruction: num(visit.yearOfConstruction),
    constructionStage: visit.constructionStage ?? "",
    workDescription: visit.workDescription ?? "",
    flatIdentification: visit.flatIdentification ?? "",
    plotDemarcation: visit.plotDemarcation ?? "",
    noOfLabor: visit.noOfLabor ?? "",
    materialAtSite: visit.materialAtSite ?? "",
    boundaryEast: visit.boundaryEast ?? "",
    boundaryWest: visit.boundaryWest ?? "",
    boundaryNorth: visit.boundaryNorth ?? "",
    boundarySouth: visit.boundarySouth ?? "",
    approachRoadCondition: visit.approachRoadCondition,
    widthOfApproachRoad: visit.widthOfApproachRoad ?? "",
    remarksApproachRoad: visit.remarksApproachRoad ?? "",
    societyNameBoard: visit.societyNameBoard ?? "",
    areaSqFt: visit.areaSqFt ?? "",
    areaBasis: visit.areaBasis,
    rateBasis: visit.rateBasis ?? "",
    ratePerSqFt: visit.ratePerSqFt ?? "",
    rentPerMonth: visit.rentPerMonth ?? "",
    negativePoints: visit.negativePoints ?? "",
    agentOpinion: visit.agentOpinion ?? "",
    finalRemarks: visit.finalRemarks ?? "",
  } as unknown as FieldVisitFormValues;
}

const EMPTY_FORM_VALUES = {
  personMet: "",
  personPhone: "",
  relationship: undefined,
  otherRelationship: "",
  relationshipRemarks: "",
  gpsLatitude: undefined,
  gpsLongitude: undefined,
  fullAddress: "",
  landmark: "",
  propertyType: undefined,
  propertyTypeRemarks: "",
  localityType: undefined,
  occupancyStatus: undefined,
  occupancyStatusRemarks: "",
  occupancyWithName: "",
  yearOfLiving: "",
  structureType: undefined,
  structureTypeRemarks: "",
  occupancyLevel: "",
  floorsInBuilding: "",
  locatedOnFloor: "",
  flatsOnFloor: "",
  wingsInBuilding: "",
  liftsStaircases: "",
  yearOfConstruction: "",
  constructionStage: "",
  workDescription: "",
  flatIdentification: "",
  plotDemarcation: "",
  noOfLabor: "",
  materialAtSite: "",
  boundaryEast: "",
  boundaryWest: "",
  boundaryNorth: "",
  boundarySouth: "",
  approachRoadCondition: undefined,
  widthOfApproachRoad: "",
  remarksApproachRoad: "",
  societyNameBoard: "",
  areaSqFt: "",
  areaBasis: undefined,
  rateBasis: "",
  ratePerSqFt: "",
  rentPerMonth: "",
  negativePoints: "",
  agentOpinion: "",
  finalRemarks: "",
} as unknown as FieldVisitFormValues;

export function FieldVisitWizard({
  caseId,
  autoFill,
  engineerName,
  onSubmitted,
  mode = "create",
  initialVisit,
  updateFn,
}: {
  caseId: string;
  autoFill: AutoFill | null;
  engineerName: string;
  onSubmitted: (visit: FieldVisit) => void;
  /** "create" = site engineer's first submission; "edit" = Maker/Checker correction. */
  mode?: "create" | "edit";
  /** The existing visit to seed the form with when mode === "edit". */
  initialVisit?: FieldVisit | undefined;
  /**
   * Override the edit mutation. Defaults to api_updateFieldVisit (Maker).
   * Pass api_updateFieldVisitByChecker for the Checker review page.
   */
  updateFn?: (token: string, caseId: string, data: FieldVisitFormValues) => Promise<FieldVisit>;
}) {
  const isEdit = mode === "edit";
  const [stepIndex, setStepIndex] = useState(0);
  // In edit mode GPS is fixed (from the original on-site capture), so we never
  // auto-request geolocation — we reuse the stored coordinates instead.
  const gps = useGeolocation({ autoCapture: !isEdit });

  const form = useForm<FieldVisitFormValues>({
    resolver: zodResolver(fieldVisitFormSchema),
    mode: "onTouched",
    defaultValues: isEdit && initialVisit ? visitToFormValues(initialVisit) : EMPTY_FORM_VALUES,
  });

  // GPS handling differs by mode:
  //  - create: track the live capture and mirror it into the form;
  //  - edit: keep the fixed stored coordinates already seeded above.
  const storedLat =
    initialVisit?.gpsLatitude != null ? Number(initialVisit.gpsLatitude) : undefined;
  const storedLng =
    initialVisit?.gpsLongitude != null ? Number(initialVisit.gpsLongitude) : undefined;
  const gpsLat = isEdit ? storedLat : gps.coords?.latitude;
  const gpsLng = isEdit ? storedLng : gps.coords?.longitude;
  if (!isEdit) {
    // Keep the form's GPS values in sync with the latest capture.
    if (gpsLat != null && form.getValues("gpsLatitude") !== gpsLat) {
      form.setValue("gpsLatitude", gpsLat, { shouldValidate: true });
    }
    if (gpsLng != null && form.getValues("gpsLongitude") !== gpsLng) {
      form.setValue("gpsLongitude", gpsLng, { shouldValidate: true });
    }
  }

  const submit = useMutation({
    mutationFn: async (values: FieldVisitFormValues) => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return isEdit
        ? (updateFn ?? api_updateFieldVisit)(token, caseId, values)
        : api_submitFieldVisit(token, caseId, values);
    },
    onSuccess: (visit) => {
      toast.success(isEdit ? "Field visit updated" : "Field visit report submitted");
      onSubmitted(visit);
    },
    onError: (error) => {
      toast.error(
        (error as Error).message ||
          (isEdit ? "Failed to update field visit" : "Failed to submit field visit"),
      );
    },
  });

  const isReview = stepIndex === STEPS.length - 1;
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  // In edit mode GPS is fixed and always considered ready (it was validated at
  // submission and cannot be changed here). In create mode it must be live.
  const gpsReady = isEdit
    ? gpsLat != null && gpsLng != null
    : gps.status === "granted" && gpsLat != null && gpsLng != null;

  const goNext = async () => {
    const fields = STEP_FIELDS[stepIndex] ?? [];
    const valid = await form.trigger(fields);
    if (!valid) return;
    // Step 1 additionally requires a live GPS capture.
    if (stepIndex === 0 && !gpsReady) {
      toast.error("GPS location is required before continuing.");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const onFinalSubmit = () => {
    if (!gpsReady) {
      toast.error("GPS location is required to submit.");
      setStepIndex(0);
      return;
    }
    void form.handleSubmit(
      (values) => submit.mutate(values),
      (errors) => {
        // Find the first step that owns an invalid field and jump there, so the
        // user is taken straight to what needs fixing instead of being told
        // "complete all fields" only at the very end.
        const errorFields = Object.keys(errors) as Path<FieldVisitFormValues>[];
        const firstBadStep = STEP_FIELDS.findIndex((fields) =>
          fields.some((f) => errorFields.includes(f)),
        );
        if (firstBadStep !== -1) {
          setStepIndex(firstBadStep);
          const stepLabel = STEPS[firstBadStep]?.label ?? "an earlier step";
          toast.error(`Please complete the required fields in "${stepLabel}".`);
        } else {
          toast.error("Please complete all required fields before submitting.");
        }
      },
    )();
  };

  const v = form.watch();

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Field Visit Report
        </CardTitle>

        {/* Stepper + progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]!.label}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "upcoming";
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                    state === "current"
                      ? "border-primary bg-primary/10 text-primary"
                      : state === "done"
                        ? "border-green-600/40 bg-green-600/10 text-green-700"
                        : "text-muted-foreground"
                  }`}
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-24">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* DEV: Auto-fill button for testing */}
            <div className="mb-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("personMet", "John Doe");
                  form.setValue("personPhone", "9876543210");
                  form.setValue("relationship", "Owner");
                  form.setValue("otherRelationship", "");
                  form.setValue("relationshipRemarks", "");
                  form.setValue("gpsLatitude", 19.076);
                  form.setValue("gpsLongitude", 72.8777);
                  form.setValue("fullAddress", "123 Main Street, Mumbai");
                  form.setValue("landmark", "Near Metro Station");
                  form.setValue("propertyType", "Industrial");
                  form.setValue("propertyTypeRemarks", "Modern facility");
                  form.setValue("localityType", "Good");
                  form.setValue("occupancyStatus", "Owner");
                  form.setValue("occupancyStatusRemarks", "");
                  form.setValue("occupancyWithName", "Self");
                  form.setValue("yearOfLiving", "2020");
                  form.setValue("structureType", "RCC");
                  form.setValue("structureTypeRemarks", "");
                  form.setValue("occupancyLevel", "85");
                  form.setValue("floorsInBuilding", "5");
                  form.setValue("locatedOnFloor", "2");
                  form.setValue("flatsOnFloor", "4");
                  form.setValue("wingsInBuilding", "2");
                  form.setValue("liftsStaircases", "1");
                  form.setValue("yearOfConstruction", "2015");
                  form.setValue("constructionStage", "Completed");
                  form.setValue("workDescription", "Modern construction with quality materials");
                  form.setValue("flatIdentification", "A-201");
                  form.setValue("plotDemarcation", "Well marked");
                  form.setValue("noOfLabor", "0");
                  form.setValue("materialAtSite", "None");
                  form.setValue("boundaryEast", "Street");
                  form.setValue("boundaryWest", "Open");
                  form.setValue("boundaryNorth", "Apartment");
                  form.setValue("boundarySouth", "Park");
                  form.setValue("approachRoadCondition", "Good");
                  form.setValue("widthOfApproachRoad", "20ft");
                  form.setValue("remarksApproachRoad", "Well maintained");
                  form.setValue("societyNameBoard", "Golden Heights Society");
                  form.setValue("areaSqFt", "1500");
                  form.setValue("areaBasis", "BUA");
                  form.setValue("rateBasis", "Market Rate");
                  form.setValue("ratePerSqFt", "5000/sqft");
                  form.setValue("rentPerMonth", "25000");
                  form.setValue("negativePoints", "None observed");
                  form.setValue("agentOpinion", "Good investment");
                  form.setValue("finalRemarks", "Property in excellent condition");
                  toast.success("Form auto-filled for testing");
                }}
                className="text-xs"
              >
                🧪 Dev: Auto-Fill Form
              </Button>
            </div>

            {/* Main form content */}
            {/* STEP 1 — Visit details */}
            {stepIndex === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ReadOnlyField
                    label="Date of Visit"
                    value={
                      isEdit
                        ? initialVisit?.visitDate
                          ? formatDisplayDate(initialVisit.visitDate)
                          : "—"
                        : formatDisplayDate(new Date())
                    }
                  />
                  <ReadOnlyField label="Engineer Name" value={engineerName} />
                  <div />
                </div>
                {isEdit ? (
                  <ReadOnlyField
                    label="GPS Location (captured on site — not editable)"
                    value={gpsLat != null && gpsLng != null ? `${gpsLat}, ${gpsLng}` : "—"}
                  />
                ) : (
                  <GpsPanel gps={gps} latitude={gpsLat} longitude={gpsLng} />
                )}
                <Separator />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <TextField
                    form={form}
                    name="personMet"
                    label="Name of Person Met"
                    placeholder="e.g. Rajesh Kumar"
                    maxLength={255}
                  />
                  <NumberField
                    form={form}
                    name="personPhone"
                    label="Phone Number"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                  />
                </div>
                <ChipField
                  form={form}
                  name="relationship"
                  label="Relationship with Property"
                  options={relationshipOptions}
                />
                {v.relationship === "Other" && (
                  <TextField
                    form={form}
                    name="otherRelationship"
                    label="Other Relationship"
                    placeholder="e.g. Family member, Friend"
                    maxLength={255}
                  />
                )}
                <TextField
                  form={form}
                  name="relationshipRemarks"
                  label="Remarks"
                  placeholder="Please specify details"
                  maxLength={500}
                />
              </div>
            )}

            {/* STEP 2 — Property details */}
            {stepIndex === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ReadOnlyField label="Bank Name" value={autoFill?.bankName ?? "—"} />
                  <ReadOnlyField label="Customer Name" value={autoFill?.customerName ?? "—"} />
                  <ReadOnlyField label="Complete Address" value={autoFill?.address ?? "—"} />
                </div>
                <Separator />
                <TextAreaField
                  form={form}
                  name="fullAddress"
                  label="Full Address as per site"
                  placeholder="Enter the complete address of the property"
                />
                <TextField
                  form={form}
                  name="landmark"
                  label="Landmark"
                  placeholder="e.g. Near City Hospital"
                  maxLength={500}
                />
                <DropdownField
                  form={form}
                  name="propertyType"
                  label="Type of Property"
                  options={propertyTypeOptions}
                  placeholder="Select property type"
                />
                {v.propertyType === "Other" && (
                  <TextField
                    form={form}
                    name="propertyTypeRemarks"
                    label="Property Type Remarks"
                    placeholder="Please specify other property type"
                    maxLength={500}
                  />
                )}
                <ChipField
                  form={form}
                  name="localityType"
                  label="Type of Locality"
                  options={localityTypeOptions}
                />
                <ChipField
                  form={form}
                  name="occupancyStatus"
                  label="Occupancy Status"
                  options={occupancyStatusOptions}
                />
                {v.occupancyStatus === "Other" && (
                  <TextField
                    form={form}
                    name="occupancyStatusRemarks"
                    label="Occupancy Status Remarks"
                    placeholder="Please specify other occupancy status"
                    maxLength={500}
                  />
                )}
                <TextField
                  form={form}
                  name="occupancyWithName"
                  label="Occupancy with Name of Occupant"
                  placeholder="e.g. John Doe"
                  maxLength={500}
                />
                <TextField
                  form={form}
                  name="yearOfLiving"
                  label="Year of Living"
                  placeholder="e.g. 2020"
                  maxLength={100}
                />
              </div>
            )}

            {/* STEP 3 — Building information */}
            {stepIndex === 2 && (
              <div className="space-y-6">
                <DropdownField
                  form={form}
                  name="structureType"
                  label="Type of Structure"
                  options={structureTypeOptions}
                  placeholder="Select structure type"
                />
                {v.structureType === "Other" && (
                  <TextField
                    form={form}
                    name="structureTypeRemarks"
                    label="Structure Type Remarks (required)"
                    placeholder="Please specify other structure type"
                    maxLength={500}
                  />
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <TextField
                    form={form}
                    name="occupancyLevel"
                    label="Occupancy Level (%)"
                    placeholder="0 - 100"
                    maxLength={100}
                  />
                  <TextField
                    form={form}
                    name="floorsInBuilding"
                    label="No. of Floors"
                    placeholder="e.g. 12"
                    maxLength={100}
                  />
                  <TextField
                    form={form}
                    name="locatedOnFloor"
                    label="Located on Floor No."
                    placeholder="e.g. 3"
                    maxLength={100}
                  />
                  <TextField
                    form={form}
                    name="flatsOnFloor"
                    label="No. of Flats on the Floor"
                    placeholder="e.g. 4"
                    maxLength={100}
                  />
                  <TextField
                    form={form}
                    name="wingsInBuilding"
                    label="No. of Wings"
                    placeholder="e.g. 2"
                    maxLength={100}
                  />
                  <TextField
                    form={form}
                    name="liftsStaircases"
                    label="No. of Lifts/Staircases"
                    placeholder="e.g. 2"
                    maxLength={100}
                  />
                </div>
              </div>
            )}

            {/* STEP 4 — Construction details */}
            {stepIndex === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <NumberField
                    form={form}
                    name="yearOfConstruction"
                    label="Year of Construction"
                    placeholder="e.g. 2015"
                    maxLength={4}
                  />
                  <TextField
                    form={form}
                    name="constructionStage"
                    label="Construction Stage (%)"
                    placeholder="0 - 100"
                    maxLength={100}
                  />
                </div>

                <TextAreaField
                  form={form}
                  name="workDescription"
                  label="Description of Work (optional)"
                  placeholder="Any notes about the construction/work in progress"
                />
                <TextField
                  form={form}
                  name="flatIdentification"
                  label="Flat Identification"
                  placeholder="e.g. 301A"
                  maxLength={500}
                />
                <TextField
                  form={form}
                  name="plotDemarcation"
                  label="Plot Demarcation"
                  placeholder="Describe plot boundaries"
                  maxLength={500}
                />
                <TextField
                  form={form}
                  name="noOfLabor"
                  label="No. of Labor"
                  placeholder="e.g. 5"
                  maxLength={100}
                />
                <TextField
                  form={form}
                  name="materialAtSite"
                  label="Material at Site"
                  placeholder="Describe materials present"
                  maxLength={500}
                />
              </div>
            )}

            {/* STEP 5 — Property boundaries */}
            {stepIndex === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <TextField form={form} name="boundaryEast" label="Boundary — East" />
                  <TextField form={form} name="boundaryWest" label="Boundary — West" />
                  <TextField form={form} name="boundaryNorth" label="Boundary — North" />
                  <TextField form={form} name="boundarySouth" label="Boundary — South" />
                </div>
              </div>
            )}

            {/* STEP 6 — Assessment details */}
            {stepIndex === 5 && (
              <div className="space-y-6">
                <ChipField
                  form={form}
                  name="approachRoadCondition"
                  label="Condition of Approach Road"
                  options={approachRoadOptions}
                />
                <TextField
                  form={form}
                  name="widthOfApproachRoad"
                  label="Width of Approach Road"
                  placeholder="e.g. 30 ft"
                  maxLength={500}
                />
                <TextField
                  form={form}
                  name="remarksApproachRoad"
                  label="Remarks for Approach Road"
                  placeholder="Any additional remarks"
                  maxLength={500}
                />
                <TextField
                  form={form}
                  name="societyNameBoard"
                  label="Name on Society Notice Board"
                  placeholder="e.g. Green Valley Apartments"
                  maxLength={500}
                />
                {/* Row 1: Area of Property + Area Basis + Rate Basis */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <TextField
                    form={form}
                    name="areaSqFt"
                    label="Area of Property (Sq. Ft.)"
                    inputMode="decimal"
                    placeholder="e.g. 1450"
                  />
                  <DropdownField
                    form={form}
                    name="areaBasis"
                    label="Area Type (required)"
                    options={areaBasisOptions}
                    placeholder="Select area type"
                  />
                  <TextField
                    form={form}
                    name="rateBasis"
                    label="Rate Basis"
                    placeholder="e.g. Market Rate"
                    maxLength={100}
                  />
                </div>
                {/* Row 2: Rate per Sq. Ft. + Rent per Month */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <TextField
                    form={form}
                    name="ratePerSqFt"
                    label="Rate per Sq. Ft."
                    placeholder="e.g. 5200 or 5200/sqft"
                    maxLength={100}
                  />
                  <TextField
                    form={form}
                    name="rentPerMonth"
                    label="Rent per Month"
                    placeholder="e.g. 25000"
                    maxLength={100}
                  />
                </div>
                <TextAreaField
                  form={form}
                  name="negativePoints"
                  label="Any Negative Points (optional)"
                  placeholder="e.g. Low-lying area, drainage issues"
                />
                <TextAreaField
                  form={form}
                  name="agentOpinion"
                  label="Agent Opinion (optional)"
                  placeholder="Local agent's view on the property/value"
                />
              </div>
            )}

            {/* STEP 7 — Review */}
            {isReview && (
              <div className="space-y-6">
                <div
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                    gpsReady
                      ? "border-green-600/40 bg-green-600/10"
                      : "border-destructive/40 bg-destructive/10"
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 ${gpsReady ? "text-green-600" : "text-destructive"}`}
                  />
                  <span className="text-sm">
                    {gpsReady
                      ? `GPS ${isEdit ? "(on-site capture, not editable)" : "confirmed"}: ${gpsLat!.toFixed(6)}, ${gpsLng!.toFixed(6)}`
                      : "GPS is not captured. Return to Step 1 to capture it before submitting."}
                  </span>
                  {!gpsReady && !isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setStepIndex(0)}
                    >
                      Fix
                    </Button>
                  )}
                </div>

                <ReviewSection title="Case (auto-filled)">
                  <ReadOnlyField label="Case Number" value={autoFill?.caseNumber ?? "—"} />
                  <ReadOnlyField label="Request Number" value={autoFill?.requestNumber ?? "—"} />
                  <ReadOnlyField label="Bank" value={autoFill?.bankName ?? "—"} />
                  <ReadOnlyField label="Customer" value={autoFill?.customerName ?? "—"} />
                  <ReadOnlyField label="Address" value={autoFill?.address ?? "—"} />
                  <ReadOnlyField label="Engineer" value={engineerName} />
                  <ReadOnlyField label="Date of Visit" value={formatDisplayDate(new Date())} />
                </ReviewSection>

                <ReviewSection title="Visit Details">
                  <ReadOnlyField label="Person Met" value={v.personMet} />
                  <ReadOnlyField label="Phone" value={v.personPhone} />
                  <ReadOnlyField label="Relationship" value={v.relationship ?? ""} />
                </ReviewSection>

                <ReviewSection title="Property">
                  <ReadOnlyField label="Full Address" value={v.fullAddress ?? ""} />
                  <ReadOnlyField label="Landmark" value={v.landmark} />
                  <ReadOnlyField label="Property Type" value={v.propertyType ?? ""} />
                  {v.propertyType === "Other" && (
                    <ReadOnlyField
                      label="Property Type Remarks"
                      value={v.propertyTypeRemarks ?? ""}
                    />
                  )}
                  <ReadOnlyField label="Locality" value={v.localityType ?? ""} />
                  <ReadOnlyField label="Occupancy Status" value={v.occupancyStatus ?? ""} />
                  {v.occupancyStatus === "Other" && (
                    <ReadOnlyField
                      label="Occupancy Status Remarks"
                      value={v.occupancyStatusRemarks ?? ""}
                    />
                  )}
                  <ReadOnlyField label="Occupancy with Name" value={v.occupancyWithName ?? ""} />
                  <ReadOnlyField label="Year of Living" value={v.yearOfLiving ?? ""} />
                </ReviewSection>

                <ReviewSection title="Building">
                  <ReadOnlyField label="Structure" value={v.structureType ?? ""} />
                  {v.structureType === "Other" && (
                    <ReadOnlyField label="Structure Remarks" value={v.structureTypeRemarks ?? ""} />
                  )}
                  <ReadOnlyField label="Occupancy Level (%)" value={v.occupancyLevel ?? ""} />
                  <ReadOnlyField label="Floors in Building" value={v.floorsInBuilding ?? ""} />
                  <ReadOnlyField label="Located on Floor" value={v.locatedOnFloor ?? ""} />
                  <ReadOnlyField label="Flats on Floor" value={v.flatsOnFloor ?? ""} />
                  <ReadOnlyField label="Wings" value={v.wingsInBuilding ?? ""} />
                  <ReadOnlyField label="Lifts/Staircases" value={v.liftsStaircases ?? ""} />
                </ReviewSection>

                <ReviewSection title="Construction">
                  <ReadOnlyField label="Year of Construction" value={v.yearOfConstruction ?? ""} />
                  <ReadOnlyField label="Construction Stage (%)" value={v.constructionStage ?? ""} />
                  <ReadOnlyField label="Work Description" value={v.workDescription ?? ""} />
                  <ReadOnlyField label="Flat Identification" value={v.flatIdentification ?? ""} />
                  <ReadOnlyField label="Plot Demarcation" value={v.plotDemarcation ?? ""} />
                  <ReadOnlyField label="No. of Labor" value={v.noOfLabor ?? ""} />
                  <ReadOnlyField label="Material at Site" value={v.materialAtSite ?? ""} />
                </ReviewSection>

                <ReviewSection title="Boundaries">
                  <ReadOnlyField label="East" value={v.boundaryEast ?? ""} />
                  <ReadOnlyField label="West" value={v.boundaryWest ?? ""} />
                  <ReadOnlyField label="North" value={v.boundaryNorth ?? ""} />
                  <ReadOnlyField label="South" value={v.boundarySouth ?? ""} />
                </ReviewSection>

                <ReviewSection title="Assessment">
                  <ReadOnlyField label="Approach Road" value={v.approachRoadCondition ?? ""} />
                  <ReadOnlyField
                    label="Width of Approach Road"
                    value={v.widthOfApproachRoad ?? ""}
                  />
                  <ReadOnlyField
                    label="Remarks Approach Road"
                    value={v.remarksApproachRoad ?? ""}
                  />
                  <ReadOnlyField label="Society Name Board" value={v.societyNameBoard ?? ""} />
                  <ReadOnlyField label="Area (Sq. Ft.)" value={v.areaSqFt ?? ""} />
                  <ReadOnlyField label="Area Type" value={v.areaBasis ?? ""} />
                  <ReadOnlyField label="Rate Basis" value={v.rateBasis ?? ""} />
                  <ReadOnlyField label="Rate per Sq. Ft." value={v.ratePerSqFt ?? ""} />
                  <ReadOnlyField label="Rent per Month" value={v.rentPerMonth ?? ""} />
                  <ReadOnlyField label="Negative Points" value={v.negativePoints ?? ""} />
                  <ReadOnlyField label="Agent Opinion" value={v.agentOpinion ?? ""} />
                </ReviewSection>

                <div className="space-y-2">
                  <TextAreaField
                    form={form}
                    name="finalRemarks"
                    label="Final Remarks (optional)"
                    placeholder="Any closing remarks about the visit"
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <StickyFormFooter
              onBack={goBack}
              onNext={isReview ? onFinalSubmit : goNext}
              nextLabel={
                isReview
                  ? isEdit
                    ? "Save Changes"
                    : "Submit Field Visit Report"
                  : "Save & Continue"
              }
              isBackDisabled={stepIndex === 0 || submit.isPending}
              isNextDisabled={submit.isPending || (isReview && !gpsReady)}
              isPending={submit.isPending}
              showBackButton={true}
              showNextIcon={!isReview}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: IconType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function Page() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();

  const currentUser = useCurrentUser();
  const listsAllCases = can(currentUser?.role, "cases.view");
  const backTo = listsAllCases ? "/cases" : "/my-cases";
  const backLabel = listsAllCases ? "Cases" : "My Cases";
  const engineerName = currentUser?.name ?? "—";

  const autoFill = useAutoFill(caseId);

  const {
    data: fieldVisit,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["field-visit", caseId],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      const visit = await api_getMyFieldVisit(token, caseId);
      return visit ?? null;
    },
    enabled: !!caseId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const header = useMemo(
    () => (
      <PageHeader
        title="Field Visit"
        description="Site inspection details for this case."
        crumbs={[
          { label: backLabel, link: { to: backTo } },
          { label: caseId, link: { to: "/cases/$caseId", params: { caseId } } },
          { label: "Field Visit" },
        ]}
        actions={
          <>
            {fieldVisit?.status === "SUBMITTED" && <Badge variant="secondary">Submitted</Badge>}
            <Button asChild variant="outline">
              <Link to="/cases/$caseId" params={{ caseId }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Case
              </Link>
            </Button>
          </>
        }
      />
    ),
    [backLabel, backTo, caseId, fieldVisit?.status],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{(error as Error).message}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/cases/$caseId" params={{ caseId }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Case
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {fieldVisit ? (
        <SubmittedFieldVisit visit={fieldVisit} autoFill={autoFill} engineerName={engineerName} />
      ) : (
        <FieldVisitWizard
          caseId={caseId}
          autoFill={autoFill}
          engineerName={engineerName}
          onSubmitted={(visit) => {
            queryClient.setQueryData(["field-visit", caseId], visit);
            queryClient.invalidateQueries({ queryKey: ["field-visit", caseId] });
            queryClient.invalidateQueries({ queryKey: ["case-field-visit", caseId] });
            queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
            queryClient.invalidateQueries({ queryKey: ["my-cases"] });
          }}
        />
      )}
    </div>
  );
}
