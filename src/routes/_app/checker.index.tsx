import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Hash,
  FileText,
  HardHat,
  Activity,
  CalendarClock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { CaseListCard } from "@/components/app/CaseListCard";
import { formatDisplayDate } from "@/lib/date-format";
import { AssignMakerDialog } from "@/components/case/AssignMakerDialog";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant, stageColors } from "@/lib/case-format";
import { cn } from "@/lib/utils";
import { getSessionToken } from "@/lib/auth-client";
import { api_listCheckerCases, api_assignMaker } from "@/data/case.functions";
import { listSiteEngineers } from "@/services/user.service";
import type { ValuationCase } from "@/types";

type CheckerCase = ValuationCase & {
  bankName?: string;
  branchName?: string;
  customerName?: string;
};

export const Route = createFileRoute("/_app/checker/")({
  head: () => pageMeta("My Cases", "Cases waiting for Checker review."),
  beforeLoad: requirePermission("checker.access"),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [assignCase, setAssignCase] = useState<ValuationCase | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const {
    data: cases = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["checker-cases"],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_listCheckerCases(token);
    },
  });
  const { data: engineers = [] } = useQuery({
    queryKey: ["site-engineers"],
    queryFn: listSiteEngineers,
  });

  const engineerName = useMemo(() => new Map(engineers.map((e) => [e.id, e.name])), [engineers]);

  const filteredCases = useMemo(() => {
    const term = search.toLowerCase();
    return cases
      .filter((c) => {
        const haystack = [
          c.caseNumber,
          c.requestNumber,
          engineerName.get(c.assignedEngineerId) ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cases, search, engineerName]);

  const handleAssign = async (makerId: string) => {
    if (!assignCase) return;
    setIsAssigning(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      await api_assignMaker(token, assignCase.id, makerId);
      toast.success(`Maker assigned to ${assignCase.caseNumber}`);
      queryClient.invalidateQueries({ queryKey: ["checker-cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", assignCase.id] });
      setAssignCase(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign Maker");
    } finally {
      setIsAssigning(false);
    }
  };

  // Secondary shortcut only — the primary Assign Maker action lives on Case
  // Detail. A case can only be assigned while it's still FIELD_VISIT_SUBMITTED
  // and has no Maker yet; the server enforces this regardless of the UI.
  const canAssign = (c: ValuationCase) => c.stage === "FIELD_VISIT_SUBMITTED" && !c.assignedMakerId;

  const renderActions = (c: ValuationCase) => (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            {/* @ts-expect-error - route path type inference issue with template literals */}
            <Link to={`/cases/${c.id}`} className="block w-full">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
          {canAssign(c) && (
            <DropdownMenuItem onClick={() => setAssignCase(c)}>
              <UserCog className="mr-2 h-4 w-4" />
              Assign Maker
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cases"
        description="Cases with a submitted field visit, ready for Maker assignment."
        actions={
          <SearchInput placeholder="Search cases..." value={search} onValueChange={setSearch} />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>My Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading cases...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive">Error loading cases: {(error as Error).message}</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No cases found</h3>
              <p className="text-muted-foreground mt-2">
                {search
                  ? "Try adjusting your search terms"
                  : "Cases with a submitted field visit will appear here."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: compact card list */}
              <div className="flex flex-col gap-2 md:hidden">
                {filteredCases.map((c) => (
                  <CaseListCard
                    key={c.id}
                    caseNumber={c.caseNumber}
                    requestNumber={c.requestNumber}
                    customerName=""
                    bankName=""
                    branchName=""
                    engineerName={engineerName.get(c.assignedEngineerId) ?? "—"}
                    stage={c.stage}
                    createdAt={c.createdAt}
                    onOpen={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                    actions={renderActions(c)}
                  />
                ))}
              </div>

              {/* Desktop: full table */}
              <div className="hidden rounded-md border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <span className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          Case Number
                        </span>
                      </TableHead>
                      <TableHead>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Request Number
                        </span>
                      </TableHead>
                      <TableHead>Bank Name</TableHead>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>
                        <span className="flex items-center gap-1.5">
                          <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                          Site Engineer
                        </span>
                      </TableHead>
                      <TableHead>
                        <span className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          Stage
                        </span>
                      </TableHead>
                      <TableHead>
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                          Created
                        </span>
                      </TableHead>
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.caseNumber}
                          </span>
                        </TableCell>
                        <TableCell>{c.requestNumber}</TableCell>
                        <TableCell>{(c as CheckerCase).bankName ?? "—"}</TableCell>
                        <TableCell>{(c as CheckerCase).branchName ?? "—"}</TableCell>
                        <TableCell>{(c as CheckerCase).customerName ?? "—"}</TableCell>
                        <TableCell>{engineerName.get(c.assignedEngineerId) ?? "—"}</TableCell>
                        <TableCell>
                          <Badge className={cn(stageColors[c.stage].bg, stageColors[c.stage].text, "border-0")}>
                            {stageLabels[c.stage]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDisplayDate(c.createdAt)}</TableCell>
                        <TableCell className="text-right">{renderActions(c)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AssignMakerDialog
        open={!!assignCase}
        onOpenChange={(open) => {
          if (!open) setAssignCase(null);
        }}
        caseNumber={assignCase?.caseNumber ?? ""}
        onAssign={handleAssign}
        isSubmitting={isAssigning}
      />
    </div>
  );
}
