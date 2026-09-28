import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { CaseListCard } from "@/components/app/CaseListCard";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant } from "@/lib/case-format";
import { getSessionToken } from "@/lib/auth-client";
import { api_listUploaderCases } from "@/data/case.functions";

export const Route = createFileRoute("/_app/uploader/")({
  head: () => pageMeta("Uploader Queue", "Cases ready for final upload."),
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
    queryKey: ["uploader-cases"],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      return api_listUploaderCases(token);
    },
  });

  const filteredCases = useMemo(() => {
    const term = search.toLowerCase();
    return cases
      .filter((c) => {
        const haystack = [c.caseNumber, c.requestNumber].join(" ").toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cases, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uploader Queue"
        description="Cases ready for final upload."
        actions={
          <SearchInput placeholder="Search cases..." value={search} onValueChange={setSearch} />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Uploader Queue</CardTitle>
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
                  : "Cases submitted by a Checker for upload will appear here."}
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
                    {filteredCases.map((c) => (
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
                        <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
