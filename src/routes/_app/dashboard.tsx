import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FolderKanban,
  Loader2,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageHeader";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant } from "@/lib/case-format";
import { api_listCases } from "@/data/case.functions";
import { api_listCustomers } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import type { CaseStage } from "@/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => pageMeta("Dashboard", "Overview of your valuation work."),
  beforeLoad: requirePermission("dashboard.view"),
  component: Page,
});

/** Stages that represent work waiting on someone to act. */
const PENDING_STAGES: CaseStage[] = [
  "FIELD_VISIT_PENDING",
  "MAKER_PENDING",
  "CHECKER_PENDING",
  "UPLOADER_PENDING",
];

/** Fixed pipeline order so the "cases by stage" grid always reads top-to-bottom. */
const STAGE_ORDER: CaseStage[] = [
  "CREATED",
  "ASSIGNED",
  "FIELD_VISIT_PENDING",
  "FIELD_VISIT_SUBMITTED",
  "MAKER_PENDING",
  "MAKER_COMPLETED",
  "CHECKER_PENDING",
  "CHECKER_COMPLETED",
  "UPLOADER_PENDING",
  "COMPLETED",
];

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  loading: boolean;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Loader2 className="mt-1 h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Page() {
  const navigate = useNavigate();

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: api_listCases,
  });
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: api_listCustomers,
  });
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: api_listBanks,
  });
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: api_listBranches,
  });

  const stats = useMemo(() => {
    const total = cases.length;
    const completed = cases.filter((c) => c.stage === "COMPLETED").length;
    const pending = cases.filter((c) => PENDING_STAGES.includes(c.stage)).length;
    const inProgress = total - completed;

    const byStage = new Map<CaseStage, number>();
    for (const c of cases) {
      byStage.set(c.stage, (byStage.get(c.stage) ?? 0) + 1);
    }

    const recent = [...cases]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return { total, completed, pending, inProgress, byStage, recent };
  }, [cases]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your valuation work."
        crumbs={[{ label: "Dashboard" }]}
      />

      {/* Case KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Cases"
          value={stats.total}
          icon={FolderKanban}
          loading={casesLoading}
        />
        <KpiCard
          label="In Progress"
          value={stats.inProgress}
          icon={Loader2}
          loading={casesLoading}
        />
        <KpiCard
          label="Awaiting Action"
          value={stats.pending}
          icon={Clock}
          loading={casesLoading}
        />
        <KpiCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          loading={casesLoading}
        />
      </div>

      {/* Reference totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Customers" value={customers.length} icon={Users} loading={customersLoading} />
        <KpiCard label="Banks" value={banks.length} icon={Landmark} loading={banksLoading} />
        <KpiCard label="Branches" value={branches.length} icon={Building2} loading={branchesLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cases by stage */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Cases by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {casesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats.total === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No cases yet.</p>
            ) : (
              <ul className="divide-y">
                {STAGE_ORDER.filter((stage) => (stats.byStage.get(stage) ?? 0) > 0).map((stage) => (
                  <li key={stage} className="flex items-center justify-between py-2.5">
                    <Badge variant={stageBadgeVariant[stage]}>{stageLabels[stage]}</Badge>
                    <span className="text-sm font-medium tabular-nums">
                      {stats.byStage.get(stage) ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent cases */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {casesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats.recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No cases yet.</p>
            ) : (
              <ul className="divide-y">
                {stats.recent.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                      className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.caseNumber}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={stageBadgeVariant[c.stage]}>{stageLabels[c.stage]}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
