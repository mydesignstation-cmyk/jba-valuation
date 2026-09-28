import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GitBranch,
  Hash,
  Landmark,
  Mail,
  MapPin,
  PenLine,
  Phone,
  Send,
  ShieldCheck,
  UploadCloud,
  User as UserIcon,
  UserCheck,
  UserCog,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
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
import { CasePipeline } from "@/components/case/CasePipeline";
import { requirePermission } from "@/lib/route-guard";
import { getSessionToken, useCurrentUser, roleLabels } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant, isMakerCasePending } from "@/lib/case-format";
import {
  api_getCase,
  api_assignMaker,
  api_submitToChecker,
  api_submitToUploader,
  api_markUploadCompleted,
} from "@/data/case.functions";
import { api_getCustomer } from "@/data/customer.functions";
import { api_getBank } from "@/data/bank.functions";
import { api_getBranch } from "@/data/branch.functions";
import { api_getCaseFieldVisit } from "@/data/fieldVisit.functions";
import { SubmittedFieldVisit } from "@/components/case/SubmittedFieldVisit";
import { AssignMakerDialog } from "@/components/case/AssignMakerDialog";
import { getSiteEngineer, getMaker, getAssigner } from "@/services/user.service";

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
  const [confirmSubmitToChecker, setConfirmSubmitToChecker] = useState(false);
  const [confirmSubmitToUploader, setConfirmSubmitToUploader] = useState(false);
  const [confirmMarkUploaded, setConfirmMarkUploaded] = useState(false);

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
    if (isChecker)
      return {
        backTo: "/checker",
        backLabel: "Checker Queue",
        backAction: "Back to Checker Queue",
      };
    if (isMaker)
      return { backTo: "/maker", backLabel: "Maker Queue", backAction: "Back to Maker Queue" };
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

  // The submitted field visit for this case. Role-agnostic read (no token):
  // authorization is handled by the case-detail route guard, mirroring how the
  // case itself is read. Resolves to null when nothing has been submitted yet.
  const { data: fieldVisit, isLoading: fieldVisitLoading } = useQuery({
    queryKey: ["case-field-visit", caseId],
    queryFn: async () => (await api_getCaseFieldVisit(caseId)) ?? null,
    enabled: !!caseId,
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
  // Role-aware label so it reads "Assigned By (Checker)" or "(Admin)" etc.
  const assignedByLabel = assignedBy?.role
    ? `Assigned By (${roleLabels[assignedBy.role]})`
    : "Assigned By";

  // Maker (re)assignment is only meaningful once the field visit is submitted
  // and before the case moves past Maker assignment.
  const makerAssignable =
    valuationCase.stage === "FIELD_VISIT_SUBMITTED" || valuationCase.stage === "MAKER_ASSIGNED";

  // Assign: Checker or admin, only while no Maker is assigned yet.
  const showAssignMaker = canAssignMaker && makerAssignable && !hasMaker;
  // Reassign: admins only, to change an already-assigned Maker. Checkers never
  // see this. These gate the buttons; the server re-checks both rules.
  const showReassignMaker = canReassignMaker && makerAssignable && hasMaker;

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

  // Maker action: hand the case to the Checker for review. Advances the stage
  // to CHECKER_PENDING; the server enforces the assigned-maker + stage rules.
  const submitToChecker = useMutation({
    mutationFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_submitToChecker(token, valuationCase.id);
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
      return api_submitToUploader(token, valuationCase.id);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      queryClient.invalidateQueries({ queryKey: ["uploader-cases"] });
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
      return api_markUploadCompleted(token, valuationCase.id);
    },
    onSuccess: (updatedCase) => {
      queryClient.setQueryData(["cases", caseId], updatedCase);
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["uploader-cases"] });
      setConfirmMarkUploaded(false);
      toast.success("Case marked as upload completed");
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to mark upload completed");
    },
  });

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
            <Badge variant={stageBadgeVariant[valuationCase.stage]} className="text-sm">
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

      {/* Primary CTA for the Checker: hand the case to the Uploader once the
          Maker's work has been reviewed. Shown while the case is under Checker
          review (CHECKER_PENDING). */}
      {isChecker && valuationCase.stage === "CHECKER_PENDING" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/15 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Ready for the Uploader</p>
                <p className="text-sm text-muted-foreground">
                  Once your review is done, submit the case to the Uploader for the final upload.
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setConfirmSubmitToUploader(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit to Uploader
            </Button>
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
                  <Badge variant={stageBadgeVariant[valuationCase.stage]}>
                    {stageLabels[valuationCase.stage]}
                  </Badge>
                }
              />
              <OverviewItem
                label="Created"
                value={new Date(valuationCase.createdAt).toLocaleDateString()}
                icon={<CalendarClock className="h-3.5 w-3.5" />}
              />
            </CardContent>
          </Card>

          {/* Pipeline tracker — where the case sits in the workflow at a glance.
              Hidden for Site Engineers, who only need their own case details. */}
          {!isSiteEngineer && <CasePipeline stage={valuationCase.stage} />}

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
            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Assignment
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
                  <Field
                    label="Assigned Site Engineer"
                    value={engineerName}
                    icon={<UserCog className="h-3.5 w-3.5" />}
                  />
                  {/* Assigned Maker — explicitly shows "Not assigned yet" until
                      a Checker assigns one, so a submitted-but-unassigned case
                      never looks like it already has a Maker. */}
                  <Field
                    label="Assigned Maker"
                    value={hasMaker ? makerName : "Not assigned yet"}
                    icon={<UserCheck className="h-3.5 w-3.5" />}
                  />
                  {/* Who assigned the Maker (Checker/Admin/Super Admin). Only
                      shown once assigned; blank on cases assigned before this
                      was tracked. */}
                  {hasMaker && assignedByName && (
                    <Field
                      label={assignedByLabel}
                      value={assignedByName}
                      icon={<UserCog className="h-3.5 w-3.5" />}
                    />
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Created"
                    value={new Date(valuationCase.createdAt).toLocaleString()}
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Last Updated"
                    value={new Date(valuationCase.updatedAt).toLocaleString()}
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
                  updatedByName={makerName}
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
      </Tabs>

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
