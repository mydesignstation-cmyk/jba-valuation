import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Download,
  Hammer,
  Home,
  Landmark as LandmarkIcon,
  Loader2,
  Route as RouteIcon,
  User as UserIcon,
} from "lucide-react";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-format";
import { useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api_getFieldVisitPdf } from "@/data/fieldVisit.functions";
import { downloadBase64File } from "@/lib/download";
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
    <Card className="mb-4 break-inside-avoid shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * "Download Field Visit PDF" action. Generates the PDF on demand from the
 * latest saved data in Neon (server-side) and downloads it to the device.
 * Only rendered/enabled for a SUBMITTED visit; nothing is stored client- or
 * server-side.
 */
function DownloadFieldVisitPdfButton({ visit }: { visit: FieldVisit }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const isSubmitted = visit.status === "SUBMITTED";

  const handleDownload = async () => {
    if (!isSubmitted || isGenerating) return;
    setIsGenerating(true);
    try {
      const { filename, base64 } = await api_getFieldVisitPdf(visit.caseId);
      downloadBase64File(base64, filename, "application/pdf");
      toast.success("Field Visit PDF downloaded");
    } catch (error) {
      toast.error((error as Error).message || "Failed to generate Field Visit PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      disabled={!isSubmitted || isGenerating}
      onClick={handleDownload}
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? "Generating…" : "Download Field Visit PDF"}
    </Button>
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
  updatedByName,
  checkerUpdatedByName,
  headerAction,
}: {
  visit: FieldVisit;
  autoFill: FieldVisitAutoFill | null;
  /** Name of the site engineer who originally submitted the visit. */
  engineerName?: string | undefined;
  /** Name of the Maker who edited the visit (audit line 2). */
  updatedByName?: string | undefined;
  /** Name of the Checker who edited the visit (audit line 3). */
  checkerUpdatedByName?: string | undefined;
  /** Optional action rendered in the header (e.g. an "Edit" button). */
  headerAction?: ReactNode | undefined;
}) {
  const gpsText =
    visit.gpsLatitude && visit.gpsLongitude ? `${visit.gpsLatitude}, ${visit.gpsLongitude}` : "—";

  const fmt = (iso: string) => formatDisplayDateTime(iso);

  const submittedOn = visit.submittedAt ? fmt(visit.submittedAt) : null;

  // Show the Maker edit-audit line only when a maker actually edited after submission.
  const makerEdited =
    !!visit.updatedById &&
    (!visit.submittedAt || new Date(visit.updatedAt) > new Date(visit.submittedAt));
  const makerUpdatedOn = makerEdited ? fmt(visit.updatedAt) : null;

  // Checker attribution: show independently of maker edit.
  const checkerUpdatedOn = visit.checkerUpdatedById ? fmt(visit.updatedAt) : null;

  return (
    <div>
      {/* Header banner — clearly shows who submitted and when */}
      <Card className="mb-4 border-green-600/30 bg-green-600/5 shadow-sm">
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
              {makerUpdatedOn && (
                <p className="text-sm text-muted-foreground">
                  Updated by{" "}
                  <span className="font-medium text-foreground">{updatedByName || "—"}</span>
                  {` on ${makerUpdatedOn}`}
                </p>
              )}
              {checkerUpdatedOn && (
                <p className="text-sm text-muted-foreground">
                  Reviewed by{" "}
                  <span className="font-medium text-foreground">{checkerUpdatedByName || "—"}</span>
                  {` on ${checkerUpdatedOn}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge variant="secondary" className="w-fit">
              Read-only
            </Badge>
            {headerAction}
            <DownloadFieldVisitPdfButton visit={visit} />
          </div>
        </CardContent>
      </Card>

      {/* Masonry layout: cards flow into 1/2/3 columns and pack tightly by
          height, so short cards sit beneath short cards with no ragged gaps.
          Per-card spacing is handled by `mb-4` + `break-inside-avoid`. */}
      <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
      <SectionCard title="Case & Location" icon={LandmarkIcon}>
        <ReadOnlyField label="Case Number" value={autoFill?.caseNumber ?? "—"} />
        <ReadOnlyField label="Request Number" value={autoFill?.requestNumber ?? "—"} />
        <ReadOnlyField label="Bank" value={autoFill?.bankName ?? "—"} />
        <ReadOnlyField label="Customer" value={autoFill?.customerName ?? "—"} />
        <ReadOnlyField label="Address" value={autoFill?.address ?? "—"} />
        <ReadOnlyField
          label="Date of Visit"
          value={visit.visitDate ? formatDisplayDate(visit.visitDate) : "—"}
        />
        <ReadOnlyField label="GPS Location" value={gpsText} />
      </SectionCard>

      <SectionCard title="Visit Details" icon={UserIcon}>
        <ReadOnlyField label="Person Met" value={visit.personMet ?? "—"} />
        <ReadOnlyField label="Phone" value={visit.personPhone ?? "—"} />
        <ReadOnlyField label="Relationship" value={visit.relationship ?? "—"} />
        {visit.relationship === "Other" && (
          <>
            <ReadOnlyField label="Other Relationship" value={visit.otherRelationship ?? "—"} />
            <ReadOnlyField label="Other Relationship Remarks" value={visit.otherRelationshipRemarks ?? "—"} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Property" icon={Home}>
        <ReadOnlyField label="Landmark" value={visit.landmark ?? "—"} />
        <ReadOnlyField label="Property Type" value={visit.propertyType ?? "—"} />
        {visit.propertyType === "Other" && (
          <ReadOnlyField label="Property Type Remarks" value={visit.propertyTypeRemarks ?? "—"} />
        )}
        <ReadOnlyField label="Locality" value={visit.localityType ?? "—"} />
        <ReadOnlyField label="Occupancy Status" value={visit.occupancyStatus ?? "—"} />
        {visit.occupancyStatus === "Other" && (
          <ReadOnlyField label="Occupancy Status Remarks" value={visit.occupancyStatusRemarks ?? "—"} />
        )}
        <ReadOnlyField label="Occupancy with Name" value={visit.occupancyWithName ?? "—"} />
      </SectionCard>

      <SectionCard title="Building" icon={Building2}>
        <ReadOnlyField label="Structure Type" value={visit.structureType ?? "—"} />
        {visit.structureType === "Other" && (
          <ReadOnlyField label="Structure Remarks" value={visit.structureTypeRemarks ?? "—"} />
        )}
        <ReadOnlyField label="Year of Living" value={visit.yearOfLiving ?? "—"} />
        <ReadOnlyField label="Occupancy Level (%)" value={visit.occupancyLevel ?? "—"} />
        <ReadOnlyField label="Floors in Building" value={visit.floorsInBuilding ?? "—"} />
        <ReadOnlyField label="Located on Floor" value={visit.locatedOnFloor ?? "—"} />
        <ReadOnlyField label="Flats on Floor" value={visit.flatsOnFloor ?? "—"} />
        <ReadOnlyField label="Wings" value={visit.wingsInBuilding ?? "—"} />
        <ReadOnlyField label="Lifts/Staircases" value={visit.liftsStaircases ?? "—"} />
      </SectionCard>

      <SectionCard title="Construction" icon={Hammer}>
        <ReadOnlyField
          label="Year of Construction"
          value={visit.yearOfConstruction?.toString() ?? "—"}
        />
        <ReadOnlyField label="Construction Stage (%)" value={visit.constructionStage ?? "—"} />
        <ReadOnlyField label="Work Description" value={visit.workDescription ?? "—"} />
        <ReadOnlyField label="Flat Identification" value={visit.flatIdentification ?? "—"} />
        <ReadOnlyField label="Plot Demarcation" value={visit.plotDemarcation ?? "—"} />
        <ReadOnlyField label="No. of Labor" value={visit.noOfLabor ?? "—"} />
        <ReadOnlyField label="Material at Site" value={visit.materialAtSite ?? "—"} />
      </SectionCard>

      <SectionCard title="Boundaries" icon={Compass}>
        <ReadOnlyField label="East" value={visit.boundaryEast ?? "—"} />
        <ReadOnlyField label="West" value={visit.boundaryWest ?? "—"} />
        <ReadOnlyField label="North" value={visit.boundaryNorth ?? "—"} />
        <ReadOnlyField label="South" value={visit.boundarySouth ?? "—"} />
      </SectionCard>

      <SectionCard title="Assessment" icon={RouteIcon}>
        <ReadOnlyField label="Approach Road" value={visit.approachRoadCondition ?? "—"} />
        <ReadOnlyField label="Width of Approach Road" value={visit.widthOfApproachRoad ?? "—"} />
        <ReadOnlyField label="Remarks Approach Road" value={visit.remarksApproachRoad ?? "—"} />
        <ReadOnlyField label="Name on Society Notice Board" value={visit.societyNameBoard ?? "—"} />
        <ReadOnlyField label="Area (Sq. Ft.)" value={visit.areaSqFt ?? "—"} />
        <ReadOnlyField label="Rate per Sq. Ft." value={visit.ratePerSqFt ?? "—"} />
        <ReadOnlyField label="Rate Basis" value={visit.rateBasis ?? "—"} />
        <ReadOnlyField label="Negative Points" value={visit.negativePoints ?? "—"} />
        <ReadOnlyField label="Agent Opinion" value={visit.agentOpinion ?? "—"} />
      </SectionCard>

      {visit.finalRemarks && (
        <SectionCard title="Final Remarks" icon={ClipboardCheck}>
          <ReadOnlyField label="Remarks" value={visit.finalRemarks} />
        </SectionCard>
      )}
      </div>
    </div>
  );
}
