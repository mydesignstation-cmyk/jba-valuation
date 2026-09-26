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
  api_listBranches,
  api_deleteBranch,
  api_createBranch,
  api_updateBranch,
} from "@/data/branch.functions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FormModal } from "@/components/app/FormModal";
import { BranchForm, type BranchFormValues } from "@/components/branch/BranchForm";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { requirePermission } from "@/lib/route-guard";
import { pageMeta } from "@/lib/page-meta";
import type { Branch } from "@/types";

export const Route = createFileRoute("/_app/branches/")({
  head: () => pageMeta("Branches", "Manage branch records."),
  beforeLoad: requirePermission("branches.view"),
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
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: branches = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: api_listBranches,
  });

  const openCreate = () => {
    setEditingBranch(null);
    setFormOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormOpen(true);
  };

  const handleSubmit = async (data: BranchFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingBranch) {
        await api_updateBranch(editingBranch.id, data.name);
        toast.success("Branch updated successfully");
      } else {
        await api_createBranch(data.name);
        toast.success("Branch created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setFormOpen(false);
      setEditingBranch(null);
    } catch (err) {
      toast.error(editingBranch ? "Failed to update branch" : "Failed to create branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    try {
      const result = await api_deleteBranch(branchToDelete.id);
      if (result) {
        toast.success(`Branch ${branchToDelete.name} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: ["branches"] });
        setDeleteDialogOpen(false);
        setBranchToDelete(null);
      } else {
        toast.error("Failed to delete branch");
      }
    } catch (err) {
      toast.error("Failed to delete branch");
    }
  };

  const filteredBranches = branches
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
        title="Branches"
        description="Manage branch records and information."
        actions={
          <>
            <SearchInput
              placeholder="Search branches..."
              value={search}
              onValueChange={setSearch}
            />
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading branches...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive">Error loading branches: {(error as Error).message}</p>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No branches found</h3>
              <p className="text-muted-foreground mt-2">
                {search
                  ? "Try adjusting your search terms"
                  : "Add your first branch to get started"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Branch
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
                      Branch Name {sortField === "name" && (sortDirection === "asc" ? "Γåæ" : "Γåô")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created {sortField === "createdAt" && (sortDirection === "asc" ? "Γåæ" : "Γåô")}
                    </TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow
                      key={branch.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEdit(branch)}
                    >
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{new Date(branch.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(branch)}>
                              <PenLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setBranchToDelete(branch);
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
          if (!open) setEditingBranch(null);
        }}
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        description={
          editingBranch
            ? `Update information for ${editingBranch.name}`
            : "Create a new branch record"
        }
      >
        <BranchForm
          key={editingBranch?.id ?? "new"}
          initialData={editingBranch ? { name: editingBranch.name } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingBranch(null);
          }}
          isSubmitting={isSubmitting}
          submitText={editingBranch ? "Update Branch" : "Create Branch"}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Branch"
        description={`Are you sure you want to delete "${branchToDelete?.name}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete Branch"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
