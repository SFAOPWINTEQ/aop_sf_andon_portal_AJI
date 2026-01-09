"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { SortingState } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DataTable } from "@/components/ui/data-table";
import {
  getMachineTypeColumns,
  type MachineType,
} from "@/components/machine-types/machine-types-columns";
import { MachineTypeForm } from "@/components/machine-types/machine-types-form";
import {
  deleteMachineType,
} from "@/server/machineTypeService";
import { useMachineTypes } from "@/hooks/useMachineTypes";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function MachineTypesPage() {
  useDocumentTitle("Machine Types");

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  const { machineTypes, pagination, isLoading, mutate } = useMachineTypes({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
  });

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMachineType, setEditingMachineType] =
    useState<MachineType | null>(null);
  const [deletingMachineType, setDeletingMachineType] =
    useState<MachineType | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleEdit = (machineType: MachineType) => {
    setEditingMachineType(machineType);
  };

  const handleDelete = (machineType: MachineType) => {
    setDeletingMachineType(machineType);
  };

  const confirmDelete = () => {
    if (!deletingMachineType) return;

    startTransition(async () => {
      const result = await deleteMachineType(deletingMachineType.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingMachineType(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingMachineType(null);
    await mutate();
  };

  const handlePaginationChange = (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPage(pagination.pageIndex + 1);
    setPageSize(pagination.pageSize);
  };

  const handleSearchFiltersChange = (filters: SearchFilter[]) => {
    setSearchFilters(filters);
    setPage(1);
  };

  const handleSortingChange = (sorting: SortingState) => {
    setSorting(sorting);
    setPage(1);
  };

  const columns = getMachineTypeColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Machine Types</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage machine type master data
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => mutate()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Machine Type
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <DataTable
              columns={columns}
              data={machineTypes}
              useMultiColumnSearch
              searchableColumns={[
                { id: "name", label: "Machine Type", type: "string" },
                { id: "code", label: "Code", type: "string" },
                { id: "createdAt", label: "Created At", type: "date" },
                { id: "updatedAt", label: "Updated At", type: "date" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              pageCount={pagination?.totalPages}
              pageIndex={page - 1}
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              isLoading={isLoading}
              totalCount={pagination?.total}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Machine Type</DialogTitle>
            <DialogDescription>
              Add a new machine type
            </DialogDescription>
          </DialogHeader>
          <MachineTypeForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editingMachineType}
        onOpenChange={(open) => !open && setEditingMachineType(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Machine Type</DialogTitle>
            <DialogDescription>
              Update machine type data
            </DialogDescription>
          </DialogHeader>
          {editingMachineType && (
            <MachineTypeForm
              initialData={editingMachineType}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deletingMachineType}
        onOpenChange={(open) => !open && setDeletingMachineType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">
                {deletingMachineType?.name}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}