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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  getUpdtCategoryColumns,
  type UpdtCategory,
} from "@/components/updt-categories/updt-category-columns";
import { UpdtCategoryForm } from "@/components/updt-categories/updt-category-form";
import {
  deleteUpdtCategory,
  getAllUpdtCategoriesForExport,
  getUpdtCategoryTemplateData,
  importUpdtCategories,
} from "@/server/updtCategoryService";
import { useUpdtCategories } from "@/hooks/useUpdtCategories";
import {
  exportToExcel,
  formatDataForExport,
  createExcelTemplate,
} from "@/lib/excel";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";
import { ExcelImportDialog } from "@/components/ui/excel-import-dialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function UpdtCategoriesPage() {
  useDocumentTitle("UPDT Categories");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("all");
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Lines for filter dropdown
  const [lines, setLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [filteredLines, setFilteredLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [isLoadingLines, setIsLoadingLines] = useState(true);
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);

  // Extract sort parameters from sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : "department";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "asc";

  // Use SWR hook for data fetching
  const { updtCategories, pagination, isLoading, mutate } = useUpdtCategories({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
    lineId: selectedLineId === "all" ? undefined : selectedLineId,
    department: selectedDepartment === "all" ? undefined : selectedDepartment,
    plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUpdtCategory, setEditingUpdtCategory] =
    useState<UpdtCategory | null>(null);
  const [deletingUpdtCategory, setDeletingUpdtCategory] =
    useState<UpdtCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Get unique departments from current data
  const departments = Array.from(
    new Set(updtCategories.map((cat) => cat.department)),
  ).sort();

  // Fetch plants and lines on component mount
  useEffect(() => {
    async function fetchPlantsAndLines() {
      try {
        const [plantsRes, linesRes] = await Promise.all([
          getPlants({ page: 1, limit: 1000, sortBy: "name", sortOrder: "asc" }),
          getLines({ page: 1, limit: 1000, sortBy: "name", sortOrder: "asc" }),
        ]);

        if (plantsRes.success && plantsRes.plants) {
          const activePlants = plantsRes.plants
            .filter((p) => p.isActive)
            .map((p) => ({ id: p.id, name: p.name }));
          setPlants(activePlants);
        }

        if (linesRes.success && linesRes.lines) {
          const activeLines = linesRes.lines
            .filter((line) => line.isActive)
            .map((line) => ({
              id: line.id,
              name: line.name,
              plantId: line.plantId || "",
            }));
          setLines(activeLines);
          setFilteredLines(activeLines);
        }
      } catch (error) {
        console.error("Error fetching plants/lines:", error);
      } finally {
        setIsLoadingLines(false);
        setIsLoadingPlants(false);
      }
    }

    fetchPlantsAndLines();
  }, []);

  // Update filtered lines when plant changes
  useEffect(() => {
    if (selectedPlantId === "all") {
      setFilteredLines(lines);
      return;
    }
    const next = lines.filter((l) => l.plantId === selectedPlantId);
    setFilteredLines(next);
    if (
      selectedLineId !== "all" &&
      !next.some((l) => l.id === selectedLineId)
    ) {
      setSelectedLineId("all");
    }
  }, [selectedPlantId, lines, selectedLineId]);

  const handleEdit = (updtCategory: UpdtCategory) => {
    setEditingUpdtCategory(updtCategory);
  };

  const handleDelete = (updtCategory: UpdtCategory) => {
    setDeletingUpdtCategory(updtCategory);
  };

  const confirmDelete = () => {
    if (!deletingUpdtCategory) return;

    startTransition(async () => {
      const result = await deleteUpdtCategory(deletingUpdtCategory.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingUpdtCategory(null);
        await mutate(); // Revalidate SWR cache
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingUpdtCategory(null);
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

  const handlePlantFilterChange = (value: string) => {
    setSelectedPlantId(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleLineFilterChange = (value: string) => {
    setSelectedLineId(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleDepartmentFilterChange = (value: string) => {
    setSelectedDepartment(value);
    setPage(1); // Reset to first page on filter change
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing export...");

    try {
      // Fetch all UPDT categories with current filters and sorting
      const result = await getAllUpdtCategoriesForExport({
        searchFilters,
        sortBy,
        sortOrder,
        lineId: selectedLineId === "all" ? undefined : selectedLineId,
        department:
          selectedDepartment === "all" ? undefined : selectedDepartment,
        plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
      });

      if (result.success && result.updtCategories) {
        const exportData = formatDataForExport(
          result.updtCategories as unknown as Record<string, unknown>[],
          ["id", "deletedAt", "lineId"], // Exclude id, deletedAt, and lineId fields
          ["createdAt", "updatedAt"], // Format date fields
        );

        exportToExcel(
          exportData,
          `updt-categories-export-${new Date().toISOString().split("T")[0]}`,
          "UPDT Categories",
        );

        toast.success(
          `Successfully exported ${result.updtCategories.length} UPDT categories`,
          {
            id: toastId,
          },
        );
      } else {
        toast.error(result.message || "Failed to export UPDT categories", {
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
      const result = await getUpdtCategoryTemplateData();

      if (result.success && result.templateData && result.instructions) {
        createExcelTemplate(
          result.templateData,
          result.instructions,
          `updt-categories-import-template-${new Date().toISOString().split("T")[0]}`,
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
      lineName: string;
      department: string;
      name: string;
    }>,
  ) => {
    // Create line name to ID mapping
    const lineNameToIdMap: Record<string, string> = {};
    lines.forEach((line) => {
      lineNameToIdMap[line.name] = line.id;
    });

    // Ensure data is plain objects (serialize and deserialize)
    const plainData = JSON.parse(JSON.stringify(data));

    // Import data
    const result = await importUpdtCategories(plainData, lineNameToIdMap);

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors,
    };
  };

  const columns = getUpdtCategoryColumns({
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
                <CardTitle>UPDT Categories</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage unplanned downtime categories
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
                  <span className="sm:inline">Add Category</span>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={selectedPlantId}
                  onValueChange={handlePlantFilterChange}
                  disabled={isLoadingPlants}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
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
                <Select
                  value={selectedLineId}
                  onValueChange={handleLineFilterChange}
                  disabled={isLoadingLines}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue
                      placeholder={
                        isLoadingLines ? "Loading lines..." : "All lines"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lines</SelectItem>
                    {filteredLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDepartment}
                  onValueChange={handleDepartmentFilterChange}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(selectedPlantId !== "all" ||
                  selectedLineId !== "all" ||
                  selectedDepartment !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlantId("all");
                      setSelectedLineId("all");
                      setSelectedDepartment("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <DataTable
              columns={columns}
              data={updtCategories}
              // Multi-column search
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "name", label: "Category Name", type: "string" },
                { id: "department", label: "Department", type: "string" },
                { id: "lineName", label: "Line", type: "string" },
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
              // Export
              onExport={handleExport}
              exportFilename="updt-categories"
              totalCount={pagination?.total}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New UPDT Category</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new unplanned downtime category to the system. All fields
              are required.
            </DialogDescription>
          </DialogHeader>
          <UpdtCategoryForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingUpdtCategory}
        onOpenChange={(open) => !open && setEditingUpdtCategory(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit UPDT Category</DialogTitle>
            <DialogDescription className="text-sm">
              Update UPDT category information.
            </DialogDescription>
          </DialogHeader>
          {editingUpdtCategory && (
            <UpdtCategoryForm
              initialData={editingUpdtCategory}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ExcelImportDialog<{
        lineName: string;
        department: string;
        name: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import UPDT Categories from Excel"
        description="Upload an Excel file with UPDT category data. Download the template first if you haven't."
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        onSuccess={mutate}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingUpdtCategory}
        onOpenChange={(open: boolean) => !open && setDeletingUpdtCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the UPDT category{" "}
              <span className="font-semibold">
                {deletingUpdtCategory?.name}
              </span>{" "}
              from department{" "}
              <span className="font-semibold">
                {deletingUpdtCategory?.department}
              </span>
              . This action cannot be undone.
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
