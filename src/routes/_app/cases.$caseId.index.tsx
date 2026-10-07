import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date-format";
import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FileText,
  GitBranch,
  Hash,
  Home,
  Landmark,
  Mail,
  MapPin,
  PenLine,
  Phone,
  Send,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import {
  makerValuationSections,
  type MakerValuationDisplayField,
} from "@/lib/makerValuationFields";
import type { MakerValuation } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/PageHeader";
import { CasePipeline, type PipelinePeople } from "@/components/case/CasePipeline";
import { requirePermission } from "@/lib/route-guard";
import { getSessionToken, useCurrentUser } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant, stageColors, isMakerCasePending } from "@/lib/case-format";
import { cn } from "@/lib/utils";
import {
  api_getCase,
  api_assignMaker,
  api_reassignSiteEngineer,
  api_submitToChecker,
  api_submitToUploader,
  api_markUploadCompleted,
} from "@/data/case.functions";
import { api_getCustomer } from "@/data/customer.functions";
import { api_getBank } from "@/data/bank.functions";
import { api_getBranch } from "@/data/branch.functions";
import { api_getCaseFieldVisit } from "@/data/fieldVisit.functions";
import { api_getMakerValuation } from "@/data/makerValuation.functions";
import { SubmittedFieldVisit } from "@/components/case/SubmittedFieldVisit";
import { MakerValuationForm } from "@/components/case/MakerValuationForm";
import { AssignMakerDialog } from "@/components/case/AssignMakerDialog";
import { ReassignSiteEngineerDialog } from "@/components/case/ReassignSiteEngineerDialog";
import {
  getSiteEngineer,
  getMaker,
  getAssigner,
  getUser,
  getChecker,
} from "@/services/user.service";

export const Route = createFileRoute("/_app/cases/$caseId/")({
  head: () => pageMeta("Case Detail", "Case information, customer, assignment and history."),
  beforeLoad: requirePermission("cases.detail"),
  component: Page,
});

/** A single labelled field with an optional leading icon. */
function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | undefined;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </Label>
      <p className="text-sm font-medium break-words">
        {value ? value : <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

/** One item in the top overview strip. */
function OverviewItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

/**
 * Consistent empty state for workflow artifacts that don't have backing data
 * yet (e.g. the field visit before an engineer submits it). Keeps unbuilt areas
 * looking intentional rather than broken.
 */
function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {action}
    </div>
  );
}

function MakerValuationDisplayRow({
  valuation,
  field,
}: {
  valuation: MakerValuation;
  field: MakerValuationDisplayField;
}) {
  const rawValue = valuation[field.key];
  const value = rawValue == null || String(rawValue).trim() === "" ? "—" : String(rawValue);
  const displayValue =
    field.key === "dateOfValuation" || field.key === "dateOfInspection"
      ? formatDisplayDate(value)
      : value;

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {field.label}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm font-medium">{displayValue}</p>
    </div>
  );
}

const makerValuationSectionIcons: Record<string, ComponentType<{ className?: string }>> = {
  "Basic Details": ClipboardList,
  "Additional Details": Landmark,
  General: FileText,
  Boundaries: MapPin,
  Location: Compass,
  "Occupancy Status": UserIcon,
  Apartment: Building2,
  Flat: Home,
  Marketability: Activity,
  "Area Calculation": Hash,
  Rate: TrendingUp,
  "Details of Valuation": FileText,
  Remarks: ClipboardCheck,
};

function downloadMakerValuationDocx(valuation: MakerValuation) {
  const escapeHtml = (value: unknown) =>
    String(value ?? "—")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const rows = makerValuationSections
    .map(
      (section) =>
        `<tr><th colspan="2" style="background:#eaf0ff;text-align:left">${escapeHtml(section.title)}</th></tr>` +
        section.fields
          .map(
            (field) =>
              `<tr><td>${escapeHtml(field.label)}</td><td>${escapeHtml(valuation[field.key])}</td></tr>`,
          )
          .join(""),
    )
    .join("");
  const html = `<html><head><meta charset="utf-8"></head><body><h1>Maker Valuation</h1><table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Field</th><th>Value</th></tr>${rows}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `maker-valuation-${valuation.refNo || valuation.caseId}.docx`;
  link.click();
  URL.revokeObjectURL(link.href);
}
function MakerValuationSection({
  valuation,
  title,
  fields,
}: {
  valuation: MakerValuation;
  title: string;
  fields: readonly MakerValuationDisplayField[];
}) {
  const Icon = makerValuationSectionIcons[title] ?? FileText;

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
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <MakerValuationDisplayRow key={field.key} valuation={valuation} field={field} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}

function Page() {
  const { caseId } = Route.useParams();
  const queryClient = useQueryClient();

  // Different roles reach case detail from different lists, so send them back
  // where they came from.
  const currentUser = useCurrentUser();
  const listsAllCases = can(currentUser?.role, "cases.view");
  // Site Engineers get a slimmed-down detail view: the pipeline tracker is
  // internal to the admin flow, so hide it for that role. Both tabs (overview
  // and field visit) are shown to everyone.
  const isSiteEngineer = currentUser?.role === "SITE_ENGINEER";
  const isChecker = currentUser?.role === "CHECKER";
  const isMaker = currentUser?.role === "MAKER";
  const isUploader = currentUser?.role === "UPLOADER";
  // Who may assign vs reassign a Maker. These are UI gates only; the server
  // (api_assignMaker) is the authority on the same rules.
  //  - assign  : Checker + admins, only when no Maker is assigned yet.
  //  - reassign: admins only, to change an already-assigned Maker.
  const canAssignMaker = can(currentUser?.role, "cases.assignMaker");
  const canReassignMaker = can(currentUser?.role, "cases.reassignMaker");

  const [assignOpen, setAssignOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [reassignEngineerOpen, setReassignEngineerOpen] = useState(false);
  const [isReassigningEngineer, setIsReassigningEngineer] = useState(false);
  const [confirmSubmitToChecker, setConfirmSubmitToChecker] = useState(false);
  const [confirmSubmitToUploader, setConfirmSubmitToUploader] = useState(false);
  const [confirmMarkUploaded, setConfirmMarkUploaded] = useState(false);
  const [showValuationForm, setShowValuationForm] = useState(false);

  const {
    backTo,
    backLabel,
    backAction,
  }: {
    backTo: NonNullable<LinkProps["to"]>;
    backLabel: string;
    backAction: string;
  } = (() => {
    if (listsAllCases) return { backTo: "/cases", backLabel: "Cases", backAction: "Back to Cases" };
    // The role-scoped queues (Checker / Maker / Uploader / Site Engineer) are
    // all presented to the user as "My Cases", matching the sidebar label. Only
    // the destination route differs per role.
    if (isChecker)
      return {
        backTo: "/checker",
        backLabel: "My Cases",
        backAction: "Back to My Cases",
      };
    if (isMaker) return { backTo: "/maker", backLabel: "My Cases", backAction: "Back to My Cases" };
    if (isUploader)
      return {
        backTo: "/uploader",
        backLabel: "My Cases",
        backAction: "Back to My Cases",
      };
    return { backTo: "/my-cases", backLabel: "My Cases", backAction: "Back to My Cases" };
  })();

  const {
    data: valuationCase,
    isLoading,
    isError,
    error,
  } = useQuery({
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
  const { data: branch } = useQuery({
    queryKey: ["branches", valuationCase?.branchId],
    queryFn: () => api_getBranch(valuationCase!.branchId),
    enabled: !!valuationCase?.branchId,
  });
  const { data: engineer } = useQuery({
    queryKey: ["site-engineers", valuationCase?.assignedEngineerId],
    queryFn: () => getSiteEngineer(valuationCase!.assignedEngineerId),
    enabled: !!valuationCase?.assignedEngineerId,
  });
  // The assigned Maker (once a Checker has assigned one). Resolves to null when
  // no Maker is assigned yet, so the UI can show an explicit "not assigned".
  const { data: maker } = useQuery({
    queryKey: ["makers", valuationCase?.assignedMakerId],
    queryFn: async () => (await getMaker(valuationCase!.assignedMakerId)) ?? null,
    enabled: !!valuationCase?.assignedMakerId,
  });

  // The Checker who assigned the Maker. Only relevant once an assignment has
  // happened; older cases assigned before this was tracked resolve to null.
  // Resolves any assigner role (Checker / Admin / Super Admin) so an admin
  // assignment shows a name + correct label instead of a raw UUID.
  const { data: assignedBy } = useQuery({
    queryKey: ["assigner", valuationCase?.assignedByCheckerId],
    queryFn: async () => (await getAssigner(valuationCase!.assignedByCheckerId)) ?? null,
    enabled: !!valuationCase?.assignedByCheckerId,
  });

  // Who checked the case (submitted it to the Uploader) and who performed the
  // final upload. Both resolve any role (Checker/Uploader or an admin acting
  // for them) so the label reads correctly. Null until the respective hand-off.
  const { data: checkedBy } = useQuery({
    queryKey: ["case-actor", valuationCase?.checkedById],
    queryFn: async () => (await getUser(valuationCase!.checkedById)) ?? null,
    enabled: !!valuationCase?.checkedById,
  });
  const { data: uploadedBy } = useQuery({
    queryKey: ["case-actor", valuationCase?.uploadedById],
    queryFn: async () => (await getUser(valuationCase!.uploadedById)) ?? null,
    enabled: !!valuationCase?.uploadedById,
  });

  // The submitted field visit for this case. Role-agnostic read (no token):
  // authorization is handled by the case-detail route guard, mirroring how the
  // case itself is read. Resolves to null when nothing has been submitted yet.
  const { data: fieldVisit, isLoading: fieldVisitLoading } = useQuery({
    queryKey: ["case-field-visit", caseId],
    queryFn: async () => (await api_getCaseFieldVisit(caseId)) ?? null,
    enabled: !!caseId,
  });

  // Resolve the Maker editor name (for the attribution banner in the Field Visit tab).
  const { data: fieldVisitMakerEditor } = useQuery({
    queryKey: ["maker-editor", fieldVisit?.updatedById],
    queryFn: () => getMaker(fieldVisit!.updatedById!),
    enabled: !!fieldVisit?.updatedById,
  });
  // Resolve the Checker editor name independently.
  const { data: fieldVisitCheckerEditor } = useQuery({
    queryKey: ["checker-editor", fieldVisit?.checkerUpdatedById],
    queryFn: () => getChecker(fieldVisit!.checkerUpdatedById!),
    enabled: !!fieldVisit?.checkerUpdatedById,
  });

  // Fetch the Maker Valuation for this case (if it exists).
  const { data: makerValuation, refetch: refetchMakerValuation } = useQuery({
    queryKey: ["maker-valuation", caseId],
    queryFn: async () => (await api_getMakerValuation(caseId)) ?? null,
    enabled: !!caseId,
  });
  const { data: makerValuationCreator } = useQuery({
    queryKey: ["maker-valuation-creator", makerValuation?.createdById],
    queryFn: () => getUser(makerValuation!.createdById),
    enabled: !!makerValuation?.createdById,
  });

  // Keep mutation hooks above the loading/error returns so every render uses
  // the same hook order. The route id is stable before the case query resolves.
  const mutationCaseId = valuationCase?.id ?? caseId;

  // Maker action: hand the case to the Checker for review. Advances the stage
  // to CHECKER_PENDING; the server enforces the assigned-maker + stage rules.
  const submitToChecker = useMutation({
    mutationFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_submitToChecker(token, mutationCaseId);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["maker-cases"] });
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      setConfirmSubmitToChecker(false);
      toast.success("Case submitted to the checker for review");
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to submit case to checker");
    },
  });

  // Checker action: hand the case to the Uploader. Advances to UPLOADER_PENDING.
  const submitToUploader = useMutation({
    mutationFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_submitToUploader(token, mutationCaseId);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      queryClient.invalidateQueries({ queryKey: ["uploader-cases"] });
      queryClient.invalidateQueries({ queryKey: ["uploader-dashboard-cases"] });
      setConfirmSubmitToUploader(false);
      toast.success("Case submitted to the uploader");
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to submit case to uploader");
    },
  });

  // Uploader action: close the case. Advances to COMPLETED (terminal stage).
  const markUploaded = useMutation({
    mutationFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_markUploadCompleted(token, mutationCaseId);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["uploader-cases"] });
      queryClient.invalidateQueries({ queryKey: ["uploader-dashboard-cases"] });
      setConfirmMarkUploaded(false);
      toast.success("Case marked as upload completed");
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to mark upload completed");
    },
  });

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !valuationCase) {
    const errorMessage = isError ? (error as Error).message : "Case not found";
    return (
      <div className="space-y-6">
        <PageHeader
          title="Case"
          description={errorMessage}
          crumbs={[{ label: backLabel, link: { to: backTo } }, { label: "Not Found" }]}
        />
        <Button asChild>
          <Link to={backTo}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backAction}
          </Link>
        </Button>
      </div>
    );
  }

  // Fall back to the stored id if a related record was removed, so nothing reads blank.
  const customerName = customer?.name ?? valuationCase.customerId;
  const bankName = bank?.name ?? valuationCase.bankId;
  const branchName = branch?.name ?? valuationCase.branchId;
  const engineerName = engineer?.name ?? valuationCase.assignedEngineerId;
  const hasMaker = !!valuationCase.assignedMakerId;
  const makerName = maker?.name ?? (hasMaker ? valuationCase.assignedMakerId : undefined);
  // Name of whoever assigned the Maker; falls back to the raw id only if the
  // user can't be resolved (e.g. deleted account).
  const assignedByName =
    assignedBy?.name ??
    (valuationCase.assignedByCheckerId ? valuationCase.assignedByCheckerId : undefined);

  // Checked By / Uploaded By names for the pipeline. Fall back to the raw id
  // only if the user can't be resolved (deleted acct). These now surface under
  // the pipeline milestones rather than in the Case Details card.
  const hasCheckedBy = !!valuationCase.checkedById;
  const checkedByName = checkedBy?.name ?? (hasCheckedBy ? valuationCase.checkedById : undefined);

  const hasUploadedBy = !!valuationCase.uploadedById;
  const uploadedByName =
    uploadedBy?.name ?? (hasUploadedBy ? valuationCase.uploadedById : undefined);

  // The people behind each pipeline milestone, so the tracker doubles as the
  // who-did-what. Field Visit → assigned Site Engineer; Maker → assigned Maker;
  // Checker → who checked it; Uploader → who uploaded it. COMPLETED has no
  // person. Only include a name when we actually have one (undefined falls back
  // to showing the role alone in the pipeline).
  // The Checker appears twice: CHECKER_ASSIGN is whoever assigned the Maker
  // (Checker or admin), CHECKER_REVIEW is whoever checked and submitted to the
  // Uploader.
  const pipelinePeople: PipelinePeople = {
    FIELD_VISIT: engineer?.name ?? undefined,
    CHECKER_ASSIGN: hasMaker ? assignedByName : undefined,
    MAKER: hasMaker ? makerName : undefined,
    CHECKER_REVIEW: hasCheckedBy ? checkedByName : undefined,
    UPLOADER: hasUploadedBy ? uploadedByName : undefined,
  };

  // Maker (re)assignment is only meaningful once the field visit is submitted
  // and before the case moves past Maker assignment.
  const makerAssignable =
    valuationCase.stage === "FIELD_VISIT_SUBMITTED" || valuationCase.stage === "MAKER_ASSIGNED";

  // Assign: Checker or admin, only while no Maker is assigned yet.
  const showAssignMaker = canAssignMaker && makerAssignable && !hasMaker;
  // Reassign: admins only, to change an already-assigned Maker. Checkers never
  // see this. These gate the buttons; the server re-checks both rules.
  const showReassignMaker = canReassignMaker && makerAssignable && hasMaker;
  const showReassignSiteEngineer =
    can(currentUser?.role, "cases.reassignSiteEngineer") &&
    valuationCase.stage === "FIELD_VISIT_PENDING" &&
    !fieldVisitLoading &&
    !!valuationCase.assignedEngineerId &&
    fieldVisit?.status !== "SUBMITTED";

  const handleAssignMaker = async (makerId: string) => {
    setIsAssigning(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      await api_assignMaker(token, valuationCase.id, makerId);
      toast.success(hasMaker ? "Maker reassigned" : "Maker assigned");
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      setAssignOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign Maker");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReassignSiteEngineer = async (engineerId: string) => {
    setIsReassigningEngineer(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      await api_reassignSiteEngineer(token, valuationCase.id, engineerId);
      toast.success("Site Engineer reassigned");
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["my-cases"] });
      setReassignEngineerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign Site Engineer");
    } finally {
      setIsReassigningEngineer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header: back button sits immediately before the case number title so
          it's easy to return to the list. Request number is intentionally not
          shown here — it lives in the overview strip inside the tab. */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label={backAction}
              title={backAction}
            >
              <Link to={backTo}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {valuationCase.caseNumber}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className={cn(stageColors[valuationCase.stage].bg, stageColors[valuationCase.stage].text, "border-0 text-sm")}>
              {stageLabels[valuationCase.stage]}
            </Badge>
            {/* Primary action at the top right of Case Detail (not in list
                rows). "Assign Maker" for Checkers/admins while unassigned;
                "Reassign Maker" for admins once a Maker is assigned (Checkers
                never see reassign). */}
            {showAssignMaker && (
              <Button onClick={() => setAssignOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Assign Maker
              </Button>
            )}
            {showReassignMaker && (
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Reassign Maker
              </Button>
            )}
            {showReassignSiteEngineer && (
              <Button variant="outline" onClick={() => setReassignEngineerOpen(true)}>
                <UserCog className="mr-2 h-4 w-4" />
                Reassign Site Engineer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Primary CTA for the assigned Site Engineer: jump straight into the
          Field Visit without hunting for the tab. Shown until a visit exists;
          once submitted it flips to a "View" affordance. The tab UX is kept. */}
      {isSiteEngineer && (
        <Card className={fieldVisit ? undefined : "border-primary/40 bg-primary/5"}>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 rounded-full p-2 ${
                  fieldVisit ? "bg-green-600/15" : "bg-primary/15"
                }`}
              >
                {fieldVisit ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <MapPin className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">
                  {fieldVisit ? "Field Visit submitted" : "Field Visit pending"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {fieldVisit
                    ? "Your inspection has been recorded for this case."
                    : "Record the site inspection details for this case."}
                </p>
              </div>
            </div>
            <Button
              asChild
              className="w-full sm:w-auto"
              variant={fieldVisit ? "outline" : "default"}
            >
              <Link to="/cases/$caseId/field-visit" params={{ caseId: valuationCase.id }}>
                <MapPin className="mr-2 h-4 w-4" />
                {fieldVisit ? "View Field Visit" : "Start Field Visit"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Primary CTA for the assigned Maker: open the review screen where the
          submitted field visit can be edited. Only shown once a visit exists
          and while the case is still with the Maker (MAKER_ASSIGNED/PENDING). */}
      {isMaker && fieldVisit && isMakerCasePending(valuationCase.stage) && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/15 p-2">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Field Visit ready for review</p>
                <p className="text-sm text-muted-foreground">
                  Review and, if needed, correct the submitted inspection details.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/maker/$caseId" params={{ caseId: valuationCase.id }}>
                  <PenLine className="mr-2 h-4 w-4" />
                  Open Maker Review
                </Link>
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setConfirmSubmitToChecker(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Submit to Checker
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary CTA for the Checker: review/edit the field visit and hand the
          case to the Uploader. Shown while the case is under Checker review. */}
      {isChecker && valuationCase.stage === "CHECKER_PENDING" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/15 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Checker review</p>
                <p className="text-sm text-muted-foreground">
                  Review or edit the field visit, then submit to the Uploader when ready.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/checker/$caseId" params={{ caseId: valuationCase.id }}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Open Checker Review
                </Link>
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setConfirmSubmitToUploader(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Submit to Uploader
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary CTA for the Uploader: close the case once the upload is done.
          Shown while the case awaits upload (UPLOADER_PENDING). */}
      {isUploader && valuationCase.stage === "UPLOADER_PENDING" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/15 p-2">
                <UploadCloud className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Final upload</p>
                <p className="text-sm text-muted-foreground">
                  When the upload is complete, mark this case as completed to close it.
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setConfirmMarkUploaded(true)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Upload Completed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Two tabs for every role: the full case detail (Case Overview) and the
          submitted inspection (Field Visit). Tabs are inline-width, not
          stretched across the page. */}
      <Tabs defaultValue="overview">
        <TabsList className="inline-flex w-auto">
          <TabsTrigger value="overview">Case Overview</TabsTrigger>
          <TabsTrigger value="field-visit">Field Visit</TabsTrigger>
          {!isSiteEngineer && <TabsTrigger value="maker-valuation">Maker Valuation</TabsTrigger>}
        </TabsList>

        {/* ---- Case Overview -------------------------------------------------- */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Overview strip — the essentials at a glance */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-3 lg:grid-cols-5">
              <OverviewItem
                label="Case Number"
                value={valuationCase.caseNumber}
                icon={<Hash className="h-3.5 w-3.5" />}
              />
              <OverviewItem
                label="Request Number"
                value={valuationCase.requestNumber}
                icon={<FileText className="h-3.5 w-3.5" />}
              />
              <OverviewItem
                label="Customer"
                value={customerName}
                icon={<UserIcon className="h-3.5 w-3.5" />}
              />
              <OverviewItem
                label="Stage"
                icon={<Activity className="h-3.5 w-3.5" />}
                value={
                  <Badge className={cn(stageColors[valuationCase.stage].bg, stageColors[valuationCase.stage].text, "border-0")}>
                    {stageLabels[valuationCase.stage]}
                  </Badge>
                }
              />
              <OverviewItem
                label="Created"
                value={formatDisplayDate(valuationCase.createdAt)}
                icon={<CalendarClock className="h-3.5 w-3.5" />}
              />
            </CardContent>
          </Card>

          {/* Pipeline tracker — where the case sits in the workflow at a glance.
              Hidden for Site Engineers, who only need their own case details.
              FEATURE-HIDDEN (CSS-only): the `feature-hidden-pipeline` wrapper
              visually hides the pipeline during the staged rollout. It stays
              mounted and working. To release, remove the wrapper div (keep the
              CasePipeline). See docs/feature-reveal-flags.md. */}
          {!isSiteEngineer && (
            <div className="feature-hidden-pipeline">
              <CasePipeline stage={valuationCase.stage} people={pipelinePeople} />
            </div>
          )}

          {/* Case Information — redundant with the header + overview strip, kept
              in the tree but hidden so it's a one-word revert. */}
          <Card className="hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Case Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Case Number" value={valuationCase.caseNumber} />
              <Field label="Request Number" value={valuationCase.requestNumber} />
              <Field label="Stage" value={stageLabels[valuationCase.stage]} />
              <Field label="Case ID" value={valuationCase.id} />
            </CardContent>
          </Card>

          {/* Assignment and Customer & Property sit side-by-side on desktop. */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Case Details — the non-people case attributes. Every workflow
                person, including who assigned the Maker, now lives in the
                pipeline tracker above, so this card carries only Bank, Branch,
                and the timestamps. */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Case Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Bank"
                    value={bankName}
                    icon={<Landmark className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Branch"
                    value={branchName}
                    icon={<GitBranch className="h-3.5 w-3.5" />}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Created"
                    value={formatDisplayDateTime(valuationCase.createdAt)}
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Last Updated"
                    value={formatDisplayDateTime(valuationCase.updatedAt)}
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer & Property */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Customer &amp; Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Customer Name"
                    value={customer?.name}
                    icon={<UserIcon className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Contact"
                    value={customer?.contact}
                    icon={<Phone className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Email"
                    value={customer?.email}
                    icon={<Mail className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Alternative Contact Person"
                    value={customer?.alternativeContactPersonName}
                    icon={<UserIcon className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Alternative Phone Number"
                    value={customer?.alternativePhoneNumber}
                    icon={<Phone className="h-3.5 w-3.5" />}
                  />
                </div>
                <Separator />
                <Field
                  label="Property Address"
                  value={customer?.address}
                  icon={<MapPin className="h-3.5 w-3.5" />}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Field Visit ---------------------------------------------------- */}
        <TabsContent value="field-visit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Field Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fieldVisitLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : fieldVisit ? (
                <SubmittedFieldVisit
                  visit={fieldVisit}
                  engineerName={engineerName}
                  updatedByName={fieldVisitMakerEditor?.name ?? makerName}
                  checkerUpdatedByName={fieldVisitCheckerEditor?.name ?? undefined}
                  autoFill={{
                    caseNumber: valuationCase.caseNumber,
                    requestNumber: valuationCase.requestNumber,
                    bankName,
                    customerName,
                    address: customer?.address ?? "—",
                  }}
                />
              ) : (
                <EmptyState
                  icon={MapPin}
                  title="No field visit submitted yet"
                  message={
                    isSiteEngineer
                      ? "Record the site inspection details for this case."
                      : "Once the site engineer submits the field visit, the inspection details will appear here."
                  }
                  action={
                    isSiteEngineer ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/cases/$caseId/field-visit" params={{ caseId: valuationCase.id }}>
                          <MapPin className="mr-2 h-4 w-4" />
                          Open field visit
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Maker Valuation ------------------------------------------------- */}
        <TabsContent value="maker-valuation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Maker Valuation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {makerValuation ? (
                !showValuationForm && (
                  <div className="space-y-4">
                  <Card className="border-green-600/30 bg-green-600/5 shadow-sm">
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-green-600/15 p-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold">Maker Valuation submitted</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted by{" "}
                            <span className="font-medium text-foreground">
                              {makerValuationCreator?.name || "—"}
                            </span>{" "}
                            on {formatDisplayDateTime(makerValuation.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {isMaker &&
                          (valuationCase.stage === "MAKER_ASSIGNED" ||
                            valuationCase.stage === "MAKER_PENDING") && (
                            <Button variant="outline" size="sm" onClick={() => setShowValuationForm(true)}>
                              <PenLine className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const result = await (
                                await import("@/data/makerValuation.functions")
                              ).api_downloadMakerValuationPdf(valuationCase.id);
                              const link = document.createElement("a");
                              link.href = `data:application/pdf;base64,${result.pdfBase64}`;
                              link.download = result.filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              toast.success("PDF downloaded");
                            } catch (error) {
                              toast.error("Failed to download PDF");
                              console.error("Download error:", error);
                            }
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadMakerValuationDocx(makerValuation)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Download DOCX
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                  <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
                    {makerValuationSections.map((section) => (
                      <MakerValuationSection
                        key={section.title}
                        valuation={makerValuation}
                        title={section.title}
                        fields={section.fields}
                      />
                    ))}
                  </div>
                </div>
                )
              ) : isMaker &&
                (valuationCase.stage === "MAKER_ASSIGNED" ||
                  valuationCase.stage === "MAKER_PENDING") ? (
                <MakerValuationForm
                  caseId={valuationCase.id}
                  onSuccess={() => {
                    setShowValuationForm(false);
                    refetchMakerValuation();
                  }}
                  onCancel={() => setShowValuationForm(false)}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No valuation yet"
                  message={
                    isMaker
                      ? "Create a valuation when you're ready."
                      : "Valuation will appear here once created."
                  }
                />
              )}
              {showValuationForm && makerValuation && (
                <Card className="mt-6 border-primary/40 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Edit Valuation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MakerValuationForm
                      caseId={valuationCase.id}
                      initialValues={makerValuation}
                      onSuccess={() => {
                        setShowValuationForm(false);
                        refetchMakerValuation();
                        toast.success("Valuation updated successfully");
                      }}
                      onCancel={() => setShowValuationForm(false)}
                    />
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReassignSiteEngineerDialog
        open={reassignEngineerOpen}
        onOpenChange={setReassignEngineerOpen}
        caseNumber={valuationCase.caseNumber}
        currentEngineerId={valuationCase.assignedEngineerId!}
        onReassign={handleReassignSiteEngineer}
        isSubmitting={isReassigningEngineer}
      />

      <AssignMakerDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        caseNumber={valuationCase.caseNumber}
        onAssign={handleAssignMaker}
        isSubmitting={isAssigning}
        isReassign={hasMaker}
        currentMakerId={valuationCase.assignedMakerId}
      />

      <AlertDialog open={confirmSubmitToChecker} onOpenChange={setConfirmSubmitToChecker}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this case to the Checker?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends the case forward to the Checker for review. After submitting you will no
              longer be able to edit the field visit for this case. Make sure your review is
              complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitToChecker.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submitToChecker.mutate();
              }}
              disabled={submitToChecker.isPending}
            >
              {submitToChecker.isPending ? "Submitting..." : "Submit to Checker"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSubmitToUploader} onOpenChange={setConfirmSubmitToUploader}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this case to the Uploader?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends the case forward to the Uploader for the final upload. Make sure your
              review is complete before submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitToUploader.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submitToUploader.mutate();
              }}
              disabled={submitToUploader.isPending}
            >
              {submitToUploader.isPending ? "Submitting..." : "Submit to Uploader"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmMarkUploaded} onOpenChange={setConfirmMarkUploaded}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this case as upload completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This closes the case as completed — the final stage of the workflow. Only do this once
              the upload is actually finished.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markUploaded.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                markUploaded.mutate();
              }}
              disabled={markUploaded.isPending}
            >
              {markUploaded.isPending ? "Completing..." : "Mark Upload Completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
