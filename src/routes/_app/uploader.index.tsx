import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant, isUploaderCasePending } from "@/lib/case-format";
import { formatDisplayDate } from "@/lib/date-format";
import { getSessionToken } from "@/lib/auth-client";
import { api_listUploaderDashboardCases } from "@/data/case.functions";
import type { ValuationCase } from "@/types";

export const Route = createFileRoute("/_app/uploader/")({
  head: () => pageMeta("My Cases", "Cases ready for final upload."),
  beforeLoad: requirePermission("uploader.access"),
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
    // Shares the same cache key as the uploader dashboard so the two views stay
    // in sync. Returns both UPLOADER_PENDING (awaiting upload) and COMPLETED
    // (already closed) cases, split into tabs below.
    queryKey: ["uploader-dashboard-cases"],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_listUploaderDashboardCases(token);
    },
  });

  const filterAndSort = (list: ValuationCase[]) => {
    const term = search.toLowerCase();
    return list
      .filter((c) => {
        const haystack = [c.caseNumber, c.requestNumber].join(" ").toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const pendingCases = useMemo(
    () => filterAndSort(cases.filter((c) => isUploaderCasePending(c.stage))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cases, search],
  );
  const completedCases = useMemo(
    () => filterAndSort(cases.filter((c) => !isUploaderCasePending(c.stage))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cases, search],
  );

  const renderList = (list: ValuationCase[], emptyMessage: string) => {
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
    if (list.length === 0) {
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
          {list.map((c) => (
            <CaseListCard
              key={c.id}
              caseNumber={c.caseNumber}
              requestNumber={c.requestNumber}
              customerName=""
              bankName=""
              branchName=""
              stage={c.stage}
              createdAt={c.createdAt}
              onOpen={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
            />
          ))}
        </div>

        {/* Desktop: full table — kept simple (case, request, stage, created) */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Number</TableHead>
                <TableHead>Request Number</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                >
                  <TableCell className="font-medium">{c.caseNumber}</TableCell>
                  <TableCell>{c.requestNumber}</TableCell>
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
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cases"
        description="Cases ready for final upload."
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
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="pending">
                Pending
                {pendingCases.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-1.5 text-xs tabular-nums">
                    {pendingCases.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                {completedCases.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-1.5 text-xs tabular-nums">
                    {completedCases.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {renderList(
                pendingCases,
                "Cases submitted by a Checker for upload will appear here.",
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {renderList(
                completedCases,
                "Cases you have marked as upload completed will appear here.",
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
