import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
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
import { api_listMyCases } from "@/data/case.functions";
import { api_listCustomers } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels } from "@/lib/case-format";

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
    queryFn: api_listMyCases,
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
                  : "Your assigned cases will appear here."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Request Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Branch</TableHead>
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
                      <TableCell>{customerName.get(c.customerId) ?? "—"}</TableCell>
                      <TableCell>{bankName.get(c.bankId) ?? "—"}</TableCell>
                      <TableCell>{branchName.get(c.branchId) ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stageLabels[c.stage]}</Badge>
                      </TableCell>
                      <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
