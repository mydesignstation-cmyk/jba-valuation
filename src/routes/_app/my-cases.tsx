import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Hash,
  FileText,
  User as UserIcon,
  Landmark,
  GitBranch,
  Activity,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { getSessionToken } from "@/lib/auth-client";
import { api_listMyCases } from "@/data/case.functions";
import { api_listCustomers } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { CaseListCard } from "@/components/app/CaseListCard";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant, isEngineerCasePending } from "@/lib/case-format";
import { formatDisplayDate } from "@/lib/date-format";
import type { ValuationCase } from "@/types";

export const Route = createFileRoute("/_app/my-cases")({
  head: () => pageMeta("My Cases", "Cases assigned to you for field visits."),
  beforeLoad: requirePermission("myCases.view"),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const {
    data: cases = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["my-cases"],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_listMyCases(token);
    },
  });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: api_listCustomers });
  const { data: banks = [] } = useQuery({ queryKey: ["banks"], queryFn: api_listBanks });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: api_listBranches });

  const customerName = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const bankName = useMemo(() => new Map(banks.map((b) => [b.id, b.name])), [banks]);
  const branchName = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);

  const filteredCases = useMemo(() => {
    const term = search.toLowerCase();
    return cases
      .filter((c) => {
        const haystack = [
          c.caseNumber,
          c.requestNumber,
          customerName.get(c.customerId) ?? "",
          bankName.get(c.bankId) ?? "",
          branchName.get(c.branchId) ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cases, search, customerName, bankName, branchName]);

  // Split the engineer's cases by whether their field visit is still pending.
  const pendingCases = useMemo(
    () => filteredCases.filter((c) => isEngineerCasePending(c.stage)),
    [filteredCases],
  );
  const completedCases = useMemo(
    () => filteredCases.filter((c) => !isEngineerCasePending(c.stage)),
    [filteredCases],
  );

  function renderTable(rows: ValuationCase[], emptyMessage: string) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading cases...</p>
        </div>
      );
    }
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error loading cases: {(error as Error).message}</p>
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No cases found</h3>
          <p className="text-muted-foreground mt-2">
            {search ? "Try adjusting your search terms" : emptyMessage}
          </p>
        </div>
      );
    }
    return (
      <>
        {/* Mobile: compact card list */}
        <div className="flex flex-col gap-2 md:hidden">
          {rows.map((c) => (
            <CaseListCard
              key={c.id}
              caseNumber={c.caseNumber}
              requestNumber={c.requestNumber}
              customerName={customerName.get(c.customerId) ?? "—"}
              bankName={bankName.get(c.bankId) ?? "—"}
              branchName={branchName.get(c.branchId) ?? "—"}
              stage={c.stage}
              createdAt={c.createdAt}
              onOpen={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
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
                <TableHead>
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Customer
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                    Bank
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    Branch
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
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
                  <TableCell>{customerName.get(c.customerId) ?? "—"}</TableCell>
                  <TableCell>{bankName.get(c.bankId) ?? "—"}</TableCell>
                  <TableCell>{branchName.get(c.branchId) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={stageBadgeVariant[c.stage]}>{stageLabels[c.stage]}</Badge>
                  </TableCell>
                  <TableCell>{formatDisplayDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cases"
        description="Cases assigned to you for field visits."
        actions={
          <SearchInput placeholder="Search cases..." value={search} onValueChange={setSearch} />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>My Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="pending">
                Pending{!isLoading && !isError ? ` (${pendingCases.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed{!isLoading && !isError ? ` (${completedCases.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {renderTable(
                pendingCases,
                "Cases awaiting your field visit will appear here.",
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {renderTable(
                completedCases,
                "Cases where you have submitted the field visit will appear here.",
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
