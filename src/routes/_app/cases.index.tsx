import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  PenLine,
  Trash2,
  Hash,
  FileText,
  User as UserIcon,
  Landmark,
  GitBranch,
  HardHat,
  Activity,
  CalendarClock,
} from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api_listCases,
  api_createCase,
  api_updateCase,
  api_deleteCase,
} from "@/data/case.functions";
import { api_listCustomers } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import { listSiteEngineers } from "@/services/user.service";
import { formatDisplayDate } from "@/lib/date-format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { FormModal } from "@/components/app/FormModal";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { CaseWithCustomerTabs, type CaseFormValues } from "@/components/case/CaseWithCustomerTabs";
import { CaseListCard } from "@/components/app/CaseListCard";
import { requirePermission } from "@/lib/route-guard";
import { can } from "@/lib/permissions";
import { pageMeta } from "@/lib/page-meta";
import { stageLabels, stageBadgeVariant } from "@/lib/case-format";
import { getCurrentUser, useCurrentUser } from "@/lib/auth-client";
import type { ValuationCase } from "@/types";

export const Route = createFileRoute("/_app/cases/")({
  head: () => pageMeta("Cases", "All valuation cases."),
  beforeLoad: requirePermission("cases.view"),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const canDelete = can(user?.role, "cases.delete");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<ValuationCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<ValuationCase | null>(null);

  const {
    data: cases = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["cases"],
    queryFn: api_listCases,
  });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: api_listCustomers });
  const { data: banks = [] } = useQuery({ queryKey: ["banks"], queryFn: api_listBanks });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: api_listBranches });
  const { data: engineers = [] } = useQuery({
    queryKey: ["site-engineers"],
    queryFn: listSiteEngineers,
  });

  const customerName = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const bankName = useMemo(() => new Map(banks.map((b) => [b.id, b.name])), [banks]);
  const branchName = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);
  const engineerName = useMemo(() => new Map(engineers.map((e) => [e.id, e.name])), [engineers]);

  const openCreate = () => {
    setEditingCase(null);
    setFormOpen(true);
  };

  const openEdit = (valuationCase: ValuationCase) => {
    setEditingCase(valuationCase);
    setFormOpen(true);
  };

  const handleSubmit = async (data: CaseFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCase) {
        await api_updateCase(editingCase.id, {
          requestNumber: data.requestNumber,
          customerId: data.customerId,
          bankId: data.bankId,
          branchId: data.branchId,
          assignedEngineerId: data.assignedEngineerId,
        });
        toast.success("Case updated successfully");
      } else {
        const currentUser = getCurrentUser();
        console.log("Current user:", currentUser);
        if (!currentUser?.id) {
          throw new Error("User not authenticated - cannot create case");
        }
        const created = await api_createCase({
          requestNumber: data.requestNumber,
          customerId: data.customerId,
          bankId: data.bankId,
          branchId: data.branchId,
          assignedEngineerId: data.assignedEngineerId,
          createdById: currentUser.id,
        });
        console.log("Case created successfully:", created);
        toast.success(`Case ${created.caseNumber} created successfully`);
      }
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setFormOpen(false);
      setEditingCase(null);
    } catch (err) {
      console.error("Error in case submission:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(editingCase ? `Failed to update case: ${errorMessage}` : `Failed to create case: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!caseToDelete) return;
    if (!canDelete) {
      toast.error("You do not have permission to delete cases");
      return;
    }
    try {
      const result = await api_deleteCase(caseToDelete.id);
      if (result) {
        toast.success(`Case ${caseToDelete.caseNumber} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: ["cases"] });
        setDeleteDialogOpen(false);
        setCaseToDelete(null);
      } else {
        toast.error("Failed to delete case");
      }
    } catch (err) {
      toast.error("Failed to delete case");
    }
  };

  // Shared row-actions dropdown, used by both the desktop table and the
  // mobile card list so View / Edit / Delete stay consistent everywhere.
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
          {c.stage === "FIELD_VISIT_PENDING" && can(user?.role, "cases.update") && (
            <DropdownMenuItem onClick={() => openEdit(c)}>
              <PenLine className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => {
                setCaseToDelete(c);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

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
          engineerName.get(c.assignedEngineerId) ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cases, search, customerName, bankName, branchName, engineerName]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cases"
        description="All valuation cases."
        actions={
          <>
            <SearchInput placeholder="Search cases..." value={search} onValueChange={setSearch} />
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
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
                  : "Create your first case to get started"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Case
                </Button>
              )}
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
                    customerName={customerName.get(c.customerId) ?? "—"}
                    bankName={bankName.get(c.bankId) ?? "—"}
                    branchName={branchName.get(c.branchId) ?? "—"}
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
                        <TableCell>{customerName.get(c.customerId) ?? "—"}</TableCell>
                        <TableCell>{bankName.get(c.bankId) ?? "—"}</TableCell>
                        <TableCell>{branchName.get(c.branchId) ?? "—"}</TableCell>
                        <TableCell>{engineerName.get(c.assignedEngineerId) ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={stageBadgeVariant[c.stage]}>{stageLabels[c.stage]}</Badge>
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

      <FormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCase(null);
        }}
        title={editingCase ? "Edit Case" : "New Case"}
        description={
          editingCase
            ? `Update details for ${editingCase.caseNumber}`
            : "Create a new valuation case. The case number is generated automatically."
        }
      >
        <CaseWithCustomerTabs
          key={editingCase?.id ?? "new"}
          initialData={
            editingCase
              ? {
                  customerId: editingCase.customerId,
                  requestNumber: editingCase.requestNumber,
                  bankId: editingCase.bankId,
                  branchId: editingCase.branchId,
                  assignedEngineerId: editingCase.assignedEngineerId,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingCase(null);
          }}
          isSubmitting={isSubmitting}
          submitText={editingCase ? "Update Case" : "Create Case"}
          isNewCase={!editingCase}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Case"
        description={`Are you sure you want to delete "${caseToDelete?.caseNumber}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete Case"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
