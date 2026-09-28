import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Hammer,
  Home,
  Landmark as LandmarkIcon,
  Route as RouteIcon,
  User as UserIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { FieldVisit } from "@/types";

type IconType = ComponentType<{ className?: string }>;

/** The read-only, case-derived values shown alongside the visit fields. */
export interface FieldVisitAutoFill {
  caseNumber: string;
  requestNumber: string;
  bankName: string;
  customerName: string;
  address: string;
}

/** A single labelled read-only value. */
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

/** A titled, icon-headed section rendered as its own card. */
function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The submitted Field Visit Report, laid out as a clean sequence of related
 * cards (icons, consistent gaps, responsive on desktop and mobile). Shows who
 * submitted it and when at the top. Read-only.
 */
export function SubmittedFieldVisit({
  visit,
  autoFill,
  engineerName,
}: {
  visit: FieldVisit;
  autoFill: FieldVisitAutoFill | null;
  engineerName?: string;
}) {
  const gpsText =
    visit.gpsLatitude && visit.gpsLongitude ? `${visit.gpsLatitude}, ${visit.gpsLongitude}` : "—";
  const submittedOn = visit.submittedAt ? new Date(visit.submittedAt).toLocaleString() : null;

  return (
    <div className="space-y-4">
      {/* Header banner — clearly shows who submitted and when */}
      <Card className="border-green-600/30 bg-green-600/5">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-green-600/15 p-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Field Visit Report submitted</p>
              <p className="text-sm text-muted-foreground">
                Submitted by{" "}
                <span className="font-medium text-foreground">{engineerName || "—"}</span>
                {submittedOn ? ` on ${submittedOn}` : ""}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            Read-only
          </Badge>
        </CardContent>
      </Card>

      <SectionCard title="Case & Location" icon={LandmarkIcon}>
        <ReadOnlyField label="Case Number" value={autoFill?.caseNumber ?? "—"} />
        <ReadOnlyField label="Request Number" value={autoFill?.requestNumber ?? "—"} />
        <ReadOnlyField label="Bank" value={autoFill?.bankName ?? "—"} />
        <ReadOnlyField label="Customer" value={autoFill?.customerName ?? "—"} />
        <ReadOnlyField label="Address" value={autoFill?.address ?? "—"} />
        <ReadOnlyField label="Date of Visit" value={visit.visitDate ?? "—"} />
        <ReadOnlyField label="GPS Location" value={gpsText} />
      </SectionCard>

      <SectionCard title="Visit Details" icon={UserIcon}>
        <ReadOnlyField label="Person Met" value={visit.personMet ?? "—"} />
        <ReadOnlyField label="Phone" value={visit.personPhone ?? "—"} />
        <ReadOnlyField label="Relationship" value={visit.relationship ?? "—"} />
      </SectionCard>

      <SectionCard title="Property" icon={Home}>
        <ReadOnlyField label="Landmark" value={visit.landmark ?? "—"} />
        <ReadOnlyField label="Property Type" value={visit.propertyType ?? "—"} />
        <ReadOnlyField label="Locality" value={visit.localityType ?? "—"} />
        <ReadOnlyField label="Occupancy" value={visit.occupancyStatus ?? "—"} />
      </SectionCard>

      <SectionCard title="Building" icon={Building2}>
        <ReadOnlyField label="Structure" value={visit.structureType ?? "—"} />
        <ReadOnlyField label="Occupancy Level (%)" value={visit.occupancyLevel ?? "—"} />
        <ReadOnlyField
          label="Floors in Building"
          value={visit.floorsInBuilding?.toString() ?? "—"}
        />
        <ReadOnlyField label="Located on Floor" value={visit.locatedOnFloor ?? "—"} />
        <ReadOnlyField label="Flats on Floor" value={visit.flatsOnFloor?.toString() ?? "—"} />
        <ReadOnlyField label="Wings" value={visit.wingsInBuilding?.toString() ?? "—"} />
        <ReadOnlyField label="Lifts/Staircases" value={visit.liftsStaircases?.toString() ?? "—"} />
      </SectionCard>

      <SectionCard title="Construction" icon={Hammer}>
        <ReadOnlyField
          label="Year of Construction"
          value={visit.yearOfConstruction?.toString() ?? "—"}
        />
        <ReadOnlyField label="Construction Stage (%)" value={visit.constructionStage ?? "—"} />
        <ReadOnlyField label="Work Description" value={visit.workDescription ?? "—"} />
      </SectionCard>

      <SectionCard title="Boundaries" icon={Compass}>
        <ReadOnlyField label="East" value={visit.boundaryEast ?? "—"} />
        <ReadOnlyField label="West" value={visit.boundaryWest ?? "—"} />
        <ReadOnlyField label="North" value={visit.boundaryNorth ?? "—"} />
        <ReadOnlyField label="South" value={visit.boundarySouth ?? "—"} />
      </SectionCard>

      <SectionCard title="Assessment" icon={RouteIcon}>
        <ReadOnlyField label="Approach Road" value={visit.approachRoadCondition ?? "—"} />
        <ReadOnlyField label="Area (Sq. Ft.)" value={visit.areaSqFt ?? "—"} />
        <ReadOnlyField label="Rate per Sq. Ft." value={visit.ratePerSqFt ?? "—"} />
        <ReadOnlyField label="Negative Points" value={visit.negativePoints ?? "—"} />
        <ReadOnlyField label="Agent Opinion" value={visit.agentOpinion ?? "—"} />
      </SectionCard>

      {visit.finalRemarks && (
        <SectionCard title="Final Remarks" icon={ClipboardCheck}>
          <ReadOnlyField label="Remarks" value={visit.finalRemarks} />
        </SectionCard>
      )}
    </div>
  );
}
