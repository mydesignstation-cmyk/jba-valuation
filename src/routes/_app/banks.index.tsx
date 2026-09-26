import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  api_listBanks,
  api_deleteBank,
  api_createBank,
  api_updateBank,
} from "@/data/bank.functions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FormModal } from "@/components/app/FormModal";
import { BankForm, type BankFormValues } from "@/components/bank/BankForm";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import type { Bank } from "@/types";

export const Route = createFileRoute("/_app/banks/")({
  head: () => pageMeta("Banks", "Manage bank records."),
  beforeLoad: requirePermission("banks.view"),
  component: Page,
});

type SortField = "name" | "createdAt";
type SortDirection = "asc" | "desc";

function Page() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: banks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: api_listBanks,
  });

  const openCreate = () => {
    setEditingBank(null);
    setFormOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormOpen(true);
  };

  const handleSubmit = async (data: BankFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingBank) {
        await api_updateBank(editingBank.id, data.name);
        toast.success("Bank updated successfully");
      } else {
        await api_createBank(data.name);
        toast.success("Bank created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setFormOpen(false);
      setEditingBank(null);
    } catch (err) {
      toast.error(editingBank ? "Failed to update bank" : "Failed to create bank");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!bankToDelete) return;
    try {
      const result = await api_deleteBank(bankToDelete.id);
      if (result) {
        toast.success(`Bank ${bankToDelete.name} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: ["banks"] });
        setDeleteDialogOpen(false);
        setBankToDelete(null);
      } else {
        toast.error("Failed to delete bank");
      }
    } catch (err) {
      toast.error("Failed to delete bank");
    }
  };

  const filteredBanks = banks
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banks"
        description="Manage bank records and information."
        actions={
          <>
            <SearchInput placeholder="Search banks..." value={search} onValueChange={setSearch} />
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Bank
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Banks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading banks...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive">Error loading banks: {(error as Error).message}</p>
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No banks found</h3>
              <p className="text-muted-foreground mt-2">
                {search ? "Try adjusting your search terms" : "Add your first bank to get started"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bank
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("name")}
                    >
                      Bank Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanks.map((bank) => (
                    <TableRow
                      key={bank.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEdit(bank)}
                    >
                      <TableCell className="font-medium">{bank.name}</TableCell>
                      <TableCell>{new Date(bank.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(bank)}>
                              <PenLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setBankToDelete(bank);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBank(null);
        }}
        title={editingBank ? "Edit Bank" : "Add Bank"}
        description={
          editingBank ? `Update information for ${editingBank.name}` : "Create a new bank record"
        }
      >
        <BankForm
          key={editingBank?.id ?? "new"}
          initialData={editingBank ? { name: editingBank.name } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingBank(null);
          }}
          isSubmitting={isSubmitting}
          submitText={editingBank ? "Update Bank" : "Create Bank"}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bank"
        description={`Are you sure you want to delete "${bankToDelete?.name}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete Bank"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
