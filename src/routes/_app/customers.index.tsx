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
  api_listCustomers,
  api_deleteCustomer,
  api_createCustomer,
  api_updateCustomer,
} from "@/data/customer.functions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FormModal } from "@/components/app/FormModal";
import { CustomerForm, type CustomerFormValues } from "@/components/customer/CustomerForm";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SearchInput } from "@/components/app/SearchInput";
import { requirePermission } from "@/lib/route-guard";
import { can } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/auth-client";
import { formatDisplayDate } from "@/lib/date-format";
import { pageMeta } from "@/lib/page-meta";
import type { Customer } from "@/types";

export const Route = createFileRoute("/_app/customers/")({
  head: () => pageMeta("Customers", "Manage customer records."),
  beforeLoad: requirePermission("customers.view"),
  component: Page,
});

type SortField = "name" | "createdAt";
type SortDirection = "asc" | "desc";

function Page() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const canDelete = can(user?.role, "customers.delete");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: api_listCustomers,
  });

  const openCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await api_updateCustomer(editingCustomer.id, {
          name: data.name,
          contact: data.contact,
          email: data.email ?? "",
          address: data.address,
          alternativeContactPersonName: data.alternativeContactPersonName ?? "",
          alternativePhoneNumber: data.alternativePhoneNumber ?? "",
        });
        toast.success("Customer updated successfully");
      } else {
        await api_createCustomer({
          name: data.name,
          contact: data.contact,
          email: data.email ?? "",
          address: data.address,
          alternativeContactPersonName: data.alternativeContactPersonName ?? "",
          alternativePhoneNumber: data.alternativePhoneNumber ?? "",
        });
        toast.success("Customer created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setFormOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      toast.error(editingCustomer ? "Failed to update customer" : "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    if (!canDelete) {
      toast.error("You do not have permission to delete customers");
      return;
    }
    try {
      await api_deleteCustomer(customerToDelete.id);
      toast.success(`Customer ${customerToDelete.name} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contact.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        c.address.toLowerCase().includes(search.toLowerCase()),
    )
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
        title="Customers"
        description="Manage customer records and information."
        actions={
          <>
            <SearchInput
              placeholder="Search customers..."
              value={search}
              onValueChange={setSearch}
            />
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive">
                Error loading customers: {(error as Error).message}
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No customers found</h3>
              <p className="text-muted-foreground mt-2">
                {search
                  ? "Try adjusting your search terms"
                  : "Add your first customer to get started"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
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
                      Customer {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
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
                  {filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openEdit(customer)}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.contact}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={customer.address}>
                        {customer.address}
                      </TableCell>
                      <TableCell>{formatDisplayDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(customer)}>
                              <PenLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setCustomerToDelete(customer);
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
          if (!open) setEditingCustomer(null);
        }}
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        description={
          editingCustomer
            ? `Update information for ${editingCustomer.name}`
            : "Create a new customer record"
        }
      >
        <CustomerForm
          key={editingCustomer?.id ?? "new"}
          initialData={
            editingCustomer
              ? {
                  name: editingCustomer.name,
                  contact: editingCustomer.contact,
                  email: editingCustomer.email ?? "",
                  address: editingCustomer.address,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingCustomer(null);
          }}
          isSubmitting={isSubmitting}
          submitText={editingCustomer ? "Update Customer" : "Create Customer"}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${customerToDelete?.name}"? This action cannot be undone.`}
        cancelText="Cancel"
        confirmText="Delete Customer"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
