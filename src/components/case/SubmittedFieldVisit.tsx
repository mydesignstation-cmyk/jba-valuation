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
  headerAction,
}: {
  visit: FieldVisit;
  autoFill: FieldVisitAutoFill | null;
  /** Name of the site engineer who originally submitted the visit. */
  engineerName?: string | undefined;
  /**
   * Name of the Maker/admin who last edited the visit (for the audit line).
   * When set — and the visit was actually edited after submission — a
   * "Last updated by … on …" line is shown beneath the submission line.
   */
  updatedByName?: string | undefined;
  /** Optional action rendered in the header (e.g. an "Edit" button). */
  headerAction?: ReactNode | undefined;
}) {
  const gpsText =
    visit.gpsLatitude && visit.gpsLongitude ? `${visit.gpsLatitude}, ${visit.gpsLongitude}` : "—";
  const submittedOn = visit.submittedAt ? new Date(visit.submittedAt).toLocaleString() : null;
  // Show the edit-audit line only when the visit was genuinely edited after
  // submission: an updater is recorded and the edit time differs from the
  // submission time (submission also stamps updated_at).
  const wasEdited =
    !!visit.updatedById &&
    (!visit.submittedAt || new Date(visit.updatedAt) > new Date(visit.submittedAt));
  const updatedOn = wasEdited ? new Date(visit.updatedAt).toLocaleString() : null;

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
              {updatedOn && (
                <p className="text-sm text-muted-foreground">
                  Last updated by{" "}
                  <span className="font-medium text-foreground">{updatedByName || "—"}</span>
                  {` on ${updatedOn}`}
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
    </div>
  );
}
