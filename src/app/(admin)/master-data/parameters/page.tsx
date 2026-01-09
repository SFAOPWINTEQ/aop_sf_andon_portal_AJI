"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw, Filter } from "lucide-react";
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

import { getParameterColumns, type Parameter } from "@/components/parameters/parameter-columns";
import { ParameterForm } from "@/components/parameters/parameter-form";
import { deleteParameter } from "@/server/parameterService";
import { useParameters } from "@/hooks/useParameters";

import type { SearchFilter } from "@/components/ui/multi-column-search";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ParametersPage() {
  useDocumentTitle("Parameters");

  // pagination & table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  const { parameters, pagination, isLoading, mutate } = useParameters({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
  });

  // dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [deletingParameter, setDeletingParameter] = useState<Parameter | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (parameter: Parameter) => {
    setEditingParameter(parameter);
  };

  const handleDelete = (parameter: Parameter) => {
    setDeletingParameter(parameter);
  };

  const confirmDelete = () => {
    if (!deletingParameter) return;

    startTransition(async () => {
      const result = await deleteParameter(deletingParameter.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingParameter(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingParameter(null);
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

  const columns = getParameterColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Parameters</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage machine parameters and units
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => mutate()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>

                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Parameter
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <DataTable
              columns={columns}
              data={parameters}
              useMultiColumnSearch
              searchableColumns={[
                { id: "name", label: "Parameter", type: "string" },
                { id: "unit", label: "Unit", type: "string" },
                { id: "createdAt", label: "Created At", type: "date" },
                { id: "updatedAt", label: "Updated At", type: "date" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              searchPlaceholder="Search parameter..."
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
            <DialogTitle>Create Parameter</DialogTitle>
            <DialogDescription>
              Add new parameter and its unit
            </DialogDescription>
          </DialogHeader>
          <ParameterForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editingParameter}
        onOpenChange={(open) => !open && setEditingParameter(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Parameter</DialogTitle>
            <DialogDescription>
              Update parameter information
            </DialogDescription>
          </DialogHeader>
          {editingParameter && (
            <ParameterForm
              initialData={editingParameter}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deletingParameter}
        onOpenChange={(open) => !open && setDeletingParameter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete parameter{" "}
              <span className="font-semibold">
                {deletingParameter?.name}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}