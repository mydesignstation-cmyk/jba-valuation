import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GitBranch,
  History,
  Landmark,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/PageHeader";
import { CasePipeline } from "@/components/case/CasePipeline";
import { requirePermission } from "@/lib/route-guard";
import { useCurrentUser } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant } from "@/lib/case-format";
import { api_getCase } from "@/data/case.functions";
import { api_getCustomer } from "@/data/customer.functions";
import { api_getBank } from "@/data/bank.functions";
import { api_getBranch } from "@/data/branch.functions";
import { getSiteEngineer } from "@/services/user.service";

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
function OverviewItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

/**
 * Consistent empty state for workflow artifacts that don't have backing data
 * yet (maker/checker notes, field-visit form, history). Keeps unbuilt areas
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

  // Site Engineers reach case detail from "My Cases" and cannot view the
  // admin-only /cases list, so send them back where they came from.
  const currentUser = useCurrentUser();
  const listsAllCases = can(currentUser?.role, "cases.view");
  // Site Engineers get a slimmed-down detail view: the pipeline tracker and the
  // workflow (maker/checker/history) artifacts are internal to the admin flow,
  // so hide them for that role.
  const isSiteEngineer = currentUser?.role === "SITE_ENGINEER";
  const backTo = listsAllCases ? "/cases" : "/my-cases";
  const backLabel = listsAllCases ? "Cases" : "My Cases";
  const backAction = listsAllCases ? "Back to Cases" : "Back to My Cases";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={valuationCase.caseNumber}
        description={`Request ${valuationCase.requestNumber}`}
        crumbs={[{ label: backLabel, link: { to: backTo } }, { label: valuationCase.caseNumber }]}
        actions={
          <>
            <Badge variant={stageBadgeVariant[valuationCase.stage]} className="text-sm">
              {stageLabels[valuationCase.stage]}
            </Badge>
            <Button asChild variant="outline">
              <Link to={backTo}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backAction}
              </Link>
            </Button>
          </>
        }
      />

      {/* Overview strip — the essentials at a glance */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 py-5 sm:grid-cols-3 lg:grid-cols-5">
          <OverviewItem label="Case Number" value={valuationCase.caseNumber} />
          <OverviewItem label="Request Number" value={valuationCase.requestNumber} />
          <OverviewItem label="Customer" value={customerName} />
          <OverviewItem
            label="Stage"
            value={
              <Badge variant={stageBadgeVariant[valuationCase.stage]}>
                {stageLabels[valuationCase.stage]}
              </Badge>
            }
          />
          <OverviewItem
            label="Created"
            value={new Date(valuationCase.createdAt).toLocaleDateString()}
          />
        </CardContent>
      </Card>

      {/* Pipeline tracker — where the case sits in the workflow at a glance.
          Hidden for Site Engineers, who only need their own case details. */}
      {!isSiteEngineer && <CasePipeline stage={valuationCase.stage} />}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Information */}
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

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bank" value={bankName} icon={<Landmark className="h-3.5 w-3.5" />} />
            <Field label="Branch" value={branchName} icon={<GitBranch className="h-3.5 w-3.5" />} />
            <Field
              label="Assigned Site Engineer"
              value={engineerName}
              icon={<UserCog className="h-3.5 w-3.5" />}
            />
            {engineer?.email && (
              <Field
                label="Engineer Email"
                value={engineer.email}
                icon={<Mail className="h-3.5 w-3.5" />}
              />
            )}
          </CardContent>
        </Card>

        {/* Customer & Property */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Customer &amp; Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* Timestamps */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </CardContent>
        </Card>
      </div>

      {/* Field Visit entry — Site Engineers submit the inspection here.
          The Field Visit page itself enforces per-case ownership server-side. */}
      {isSiteEngineer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Field Visit
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Record the site inspection details for this case.
            </p>
            <Button asChild>
              <Link to="/cases/$caseId/field-visit" params={{ caseId: valuationCase.id }}>
                <MapPin className="mr-2 h-4 w-4" />
                Field Visit
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workflow artifacts — field visit, notes and activity.
          Read-only for now; each tab has a clean slot for data landing later.
          Hidden for Site Engineers, who don't work the maker/checker flow. */}
      {!isSiteEngineer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="field-visit">
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
                <TabsTrigger value="field-visit">Field Visit</TabsTrigger>
                <TabsTrigger value="maker">Maker Notes</TabsTrigger>
                <TabsTrigger value="checker">Checker Notes</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="field-visit" className="mt-4">
                <EmptyState
                  icon={MapPin}
                  title="No field visit submitted yet"
                  message="Once the site engineer submits the field visit, the inspection details and report PDF will appear here."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link to="/cases/$caseId/field-visit" params={{ caseId: valuationCase.id }}>
                        <MapPin className="mr-2 h-4 w-4" />
                        Open field visit
                      </Link>
                    </Button>
                  }
                />
              </TabsContent>

              <TabsContent value="maker" className="mt-4">
                <EmptyState
                  icon={ClipboardCheck}
                  title="No maker notes yet"
                  message="Notes recorded by the maker while preparing the valuation will show here."
                />
              </TabsContent>

              <TabsContent value="checker" className="mt-4">
                <EmptyState
                  icon={CheckCircle2}
                  title="No checker notes yet"
                  message="Review notes and approvals from the checker will show here."
                />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <EmptyState
                  icon={History}
                  title="No activity recorded yet"
                  message="A timeline of stage changes and actions on this case will appear here."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
