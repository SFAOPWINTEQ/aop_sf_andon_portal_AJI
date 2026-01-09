"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, RefreshCw, Upload, Filter } from "lucide-react";
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
import { getLineColumns, type Line } from "@/components/lines/line-columns";
import { LineForm } from "@/components/lines/line-form";
import {
  deleteLine,
  getAllLinesForExport,
  getLineTemplateData,
  importLines,
} from "@/server/lineService";
import { useLines } from "@/hooks/useLines";
import {
  exportToExcel,
  formatDataForExport,
  createExcelTemplate,
} from "@/lib/excel";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { ExcelImportDialog } from "@/components/ui/excel-import-dialog";
import { getPlants } from "@/server/plantService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function LinesPage() {
  useDocumentTitle("Lines");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);

  // Extract sort parameters from sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  // Use SWR hook for data fetching
  const { lines, pagination, isLoading, mutate } = useLines({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
    plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
  });
  // Fetch plants on mount for filter dropdown
  useEffect(() => {
    async function fetchPlants() {
      try {
        const result = await getPlants({
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (result.success && result.plants) {
          const activePlants = result.plants
            .filter((p) => p.isActive)
            .map((p) => ({ id: p.id, name: p.name }));
          setPlants(activePlants);
        }
      } catch (e) {
        console.error("Error fetching plants:", e);
      } finally {
        setIsLoadingPlants(false);
      }
    }
    fetchPlants();
  }, []);

  const handlePlantFilterChange = (value: string) => {
    setSelectedPlantId(value);
    setPage(1);
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [deletingLine, setDeletingLine] = useState<Line | null>(null);
  const [isPending, startTransition] = useTransition();

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleEdit = (line: Line) => {
    setEditingLine(line);
  };

  const handleDelete = (line: Line) => {
    setDeletingLine(line);
  };

  const confirmDelete = () => {
    if (!deletingLine) return;

    startTransition(async () => {
      const result = await deleteLine(deletingLine.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingLine(null);
        await mutate(); // Revalidate SWR cache
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingLine(null);
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
      // Fetch all lines with current filters and sorting
      const result = await getAllLinesForExport({
        searchFilters,
        sortBy,
        sortOrder,
        plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
      });

      if (result.success && result.lines) {
        const exportData = formatDataForExport(
          result.lines,
          ["id", "deletedAt"], // Exclude id and deletedAt fields
          ["createdAt", "updatedAt"], // Format date fields
        );

        exportToExcel(
          exportData,
          `lines-export-${new Date().toISOString().split("T")[0]}`,
          "Lines",
        );

        toast.success(`Successfully exported ${result.lines.length} lines`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "Failed to export lines", {
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
      const result = await getLineTemplateData();

      if (result.success && result.templateData && result.instructions) {
        createExcelTemplate(
          result.templateData,
          result.instructions,
          `lines-import-template-${new Date().toISOString().split("T")[0]}`,
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
      plantName: string;
      isActive: string;
    }>,
  ) => {
    // Ensure data is plain objects (serialize and deserialize)
    const plainData = JSON.parse(JSON.stringify(data));

    // Import data
    const result = await importLines(plainData);

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors,
    };
  };

  const columns = getLineColumns({
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
                <CardTitle>Lines</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage production lines and their configurations
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
                  <span className="sm:inline">Add Line</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Filters</h3>
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Select
                  value={selectedPlantId}
                  onValueChange={handlePlantFilterChange}
                  disabled={isLoadingPlants}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue
                      placeholder={
                        isLoadingPlants ? "Loading plants..." : "All plants"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plants</SelectItem>
                    {plants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlantId !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPlantId("all")}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
            <DataTable
              columns={columns}
              data={lines}
              // Multi-column search
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "name", label: "Name", type: "string" },
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
              exportFilename="lines"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New Line</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new production line to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <LineForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingLine}
        onOpenChange={(open) => !open && setEditingLine(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Line</DialogTitle>
            <DialogDescription className="text-sm">
              Update line information.
            </DialogDescription>
          </DialogHeader>
          {editingLine && (
            <LineForm initialData={editingLine} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ExcelImportDialog<{
        name: string;
        plantName: string;
        isActive: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Lines from Excel"
        description="Upload an Excel file with line data. Download the template first if you haven't."
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        onSuccess={mutate}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingLine}
        onOpenChange={(open: boolean) => !open && setDeletingLine(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the line{" "}
              <span className="font-semibold">{deletingLine?.name}</span>. This
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
