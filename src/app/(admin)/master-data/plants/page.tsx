"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw, Upload } from "lucide-react";
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
import { getPlantColumns, type Plant } from "@/components/plants/plant-columns";
import { PlantForm } from "@/components/plants/plant-form";
import {
  deletePlant,
  getAllPlantsForExport,
  getPlantTemplateData,
  importPlants,
} from "@/server/plantService";
import { usePlants } from "@/hooks/usePlants";
import {
  exportToExcel,
  formatDataForExport,
  createExcelTemplate,
} from "@/lib/excel";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { ExcelImportDialog } from "@/components/ui/excel-import-dialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function PlantsPage() {
  useDocumentTitle("Plants");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Extract sort parameters from sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  // Use SWR hook for data fetching
  const { plants, pagination, isLoading, mutate } = usePlants({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);
  const [isPending, startTransition] = useTransition();

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
  };

  const handleDelete = (plant: Plant) => {
    setDeletingPlant(plant);
  };

  const confirmDelete = () => {
    if (!deletingPlant) return;

    startTransition(async () => {
      const result = await deletePlant(deletingPlant.id);
      if (result.success) {
        toast.success(result.message || "Plant deleted successfully");
        setDeletingPlant(null);
        await mutate(); // Revalidate SWR cache
      } else {
        toast.error(result.message || "Failed to delete plant");
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingPlant(null);
    await mutate(); // Revalidate SWR cache
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPage(newPagination.pageIndex + 1); // Table uses 0-based index, API uses 1-based
    setPageSize(newPagination.pageSize);
  };

  const handleSearchFiltersChange = (filters: SearchFilter[]) => {
    setSearchFilters(filters);
    setPage(1); // Reset to first page on filter change
  };

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPage(1); // Reset to first page on sort
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing export...");

    try {
      // Fetch all plants with current filters and sorting
      const result = await getAllPlantsForExport({
        searchFilters,
        sortBy,
        sortOrder,
      });

      if (result.success && result.plants) {
        const exportData = formatDataForExport(
          result.plants,
          ["id"], // Exclude id field
          ["createdAt", "updatedAt"], // Format date fields
        );

        exportToExcel(
          exportData,
          `plants-export-${new Date().toISOString().split("T")[0]}`,
          "Plants",
        );

        toast.success(`Successfully exported ${result.plants.length} plants`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "Failed to export plants", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred while exporting", {
        id: toastId,
      });
    }
  };

  const handleDownloadTemplate = async () => {
    const toastId = toast.loading("Generating template...");

    try {
      const result = await getPlantTemplateData();

      if (result.success && result.templateData && result.instructions) {
        createExcelTemplate(
          result.templateData,
          result.instructions,
          `plants-import-template-${new Date().toISOString().split("T")[0]}`,
          "Data",
          "Instructions",
        );

        toast.success("Template downloaded successfully", {
          id: toastId,
        });
      } else {
        toast.error(result.message || "Failed to generate template", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Template generation error:", error);
      toast.error("An error occurred while generating template", {
        id: toastId,
      });
    }
  };

  const handleImport = async (
    data: Array<{
      name: string;
      subplant: string;
      isActive: string;
    }>,
  ) => {
    // Ensure data is plain objects (serialize and deserialize)
    const plainData = JSON.parse(JSON.stringify(data));

    // Import data
    const result = await importPlants(plainData);

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors,
    };
  };

  const columns = getPlantColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Plants</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage plants and their subplant configurations
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => mutate()}
                  disabled={isLoading}
                  className="flex-none"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Add Plant</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={plants}
              // Multi-column search
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "name", label: "Name", type: "string" },
                { id: "subplant", label: "Subplant", type: "string" },
                { id: "isActive", label: "Active", type: "boolean" },
                { id: "createdAt", label: "Created At", type: "date" },
                { id: "updatedAt", label: "Updated At", type: "date" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              searchPlaceholder="Enter search value..."
              // Server-side props
              pageCount={pagination?.totalPages}
              pageIndex={page - 1} // Table uses 0-based index
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              isLoading={isLoading}
              totalCount={pagination?.total}
              // Export
              onExport={handleExport}
              exportFilename="plants"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New Plant</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new plant to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <PlantForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPlant}
        onOpenChange={(open) => !open && setEditingPlant(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
            <DialogDescription className="text-sm">
              Update plant information.
            </DialogDescription>
          </DialogHeader>
          {editingPlant && (
            <PlantForm initialData={editingPlant} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ExcelImportDialog<{
        name: string;
        subplant: string;
        isActive: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Plants from Excel"
        description="Upload an Excel file with plant data. Download the template first if you haven't."
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        onSuccess={mutate}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPlant}
        onOpenChange={(open: boolean) => !open && setDeletingPlant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plant{" "}
              <span className="font-semibold">{deletingPlant?.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
