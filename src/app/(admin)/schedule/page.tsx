"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Upload, Filter, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import type { SortingState } from "@tanstack/react-table";

import { useProductionPlans } from "@/hooks/useProductionPlans";
import {
  getProductionPlanColumns,
  type ProductionPlan,
} from "@/components/production-plans/production-plan-columns";
import { ProductionPlanForm } from "@/components/production-plans/production-plan-form";
import {
  deleteProductionPlan,
  getAllProductionPlansForExport,
  getProductionPlanTemplateData,
} from "@/server/productionPlanService";
import { getPlants } from "@/server/plantService";
import { getLines } from "@/server/lineService";
import { getShifts } from "@/server/shiftService";
import { getParts } from "@/server/partService";
import {
  exportToExcel,
  formatDataForExport,
  createExcelTemplate,
} from "@/lib/excel";
import { ExcelImportDialog } from "@/components/ui/excel-import-dialog";
import { importProductionPlans } from "@/server/productionPlanService";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function SchedulePage() {
  useDocumentTitle("Production Schedule");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "planDate", desc: true },
  ]);

  // Filter states
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");
  const [selectedLineId, setSelectedLineId] = useState<string>("all");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("all");
  const [selectedPartId, setSelectedPartId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Data for filters
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [lines, setLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [shifts, setShifts] = useState<
    Array<{ id: string; lineId: string; number: number }>
  >([]);
  const [parts, setParts] = useState<
    Array<{ id: string; partNo: string; name: string; lineId: string }>
  >([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Extract sort parameters from sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : "planDate";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  // Use SWR hook for data fetching
  const { productionPlans, pagination, isLoading, mutate } = useProductionPlans(
    {
      page,
      limit: pageSize,
      searchFilters,
      sortBy,
      sortOrder,
      plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
      lineId: selectedLineId === "all" ? undefined : selectedLineId,
      shiftId: selectedShiftId === "all" ? undefined : selectedShiftId,
      partId: selectedPartId === "all" ? undefined : selectedPartId,
      status: selectedStatus === "all" ? undefined : selectedStatus,
    },
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<ProductionPlan | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch filter data on component mount
  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [plantsResult, linesResult, shiftsResult, partsResult] =
          await Promise.all([
            getPlants({
              page: 1,
              limit: 1000,
              sortBy: "name",
              sortOrder: "asc",
            }),
            getLines({
              page: 1,
              limit: 1000,
              sortBy: "name",
              sortOrder: "asc",
            }),
            getShifts({
              page: 1,
              limit: 1000,
              sortBy: "number",
              sortOrder: "asc",
            }),
            getParts({
              page: 1,
              limit: 1000,
              sortBy: "partNo",
              sortOrder: "asc",
            }),
          ]);

        if (plantsResult.success && plantsResult.plants) {
          setPlants(
            plantsResult.plants.map((plant) => ({
              id: plant.id,
              name: plant.name,
            })),
          );
        }

        if (linesResult.success && linesResult.lines) {
          const activeLines = linesResult.lines
            .filter((line) => line.isActive)
            .map((line) => ({
              id: line.id,
              name: line.name,
              plantId: line.plantId,
            }));
          setLines(activeLines);
        }

        if (shiftsResult.success && shiftsResult.shifts) {
          setShifts(
            shiftsResult.shifts.map((shift) => ({
              id: shift.id,
              lineId: shift.lineId,
              number: shift.number,
            })),
          );
        }

        if (partsResult.success && partsResult.parts) {
          setParts(
            partsResult.parts.map((part) => ({
              id: part.id,
              partNo: part.partNo,
              name: part.name,
              lineId: part.lineId,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setIsLoadingFilters(false);
      }
    }

    fetchFilterData();
  }, []);

  // Filter lines based on selected plant
  const availableLines = lines.filter(
    (line) => line.plantId === selectedPlantId || selectedPlantId === "all",
  );

  // Filter shifts based on selected line
  const availableShifts = shifts.filter(
    (shift) => shift.lineId === selectedLineId || selectedLineId === "all",
  );

  const handleEdit = (plan: ProductionPlan) => {
    setEditingPlan(plan);
  };

  const handleDelete = (plan: ProductionPlan) => {
    setDeletingPlan(plan);
  };

  const confirmDelete = () => {
    if (!deletingPlan) return;

    startTransition(async () => {
      const result = await deleteProductionPlan(deletingPlan.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingPlan(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingPlan(null);
    await mutate();
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPage(newPagination.pageIndex + 1);
    setPageSize(newPagination.pageSize);
  };

  const handleSearchFiltersChange = (filters: SearchFilter[]) => {
    setSearchFilters(filters);
    setPage(1);
  };

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPage(1);
  };

  const handlePlantFilterChange = (value: string) => {
    setSelectedPlantId(value);
    // Reset line and shift when plant changes
    if (value !== "all") {
      setSelectedLineId("all");
      setSelectedShiftId("all");
    }
    setPage(1);
  };

  const handleLineFilterChange = (value: string) => {
    setSelectedLineId(value);
    // Reset shift when line changes
    if (value !== "all") {
      setSelectedShiftId("all");
    }
    setPage(1);
  };

  const handleShiftFilterChange = (value: string) => {
    setSelectedShiftId(value);
    setPage(1);
  };

  const handlePartFilterChange = (value: string) => {
    setSelectedPartId(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setSelectedStatus(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedPlantId("all");
    setSelectedLineId("all");
    setSelectedShiftId("all");
    setSelectedPartId("all");
    setSelectedStatus("all");
    setPage(1);
  };

  const hasActiveFilters =
    selectedPlantId !== "all" ||
    selectedLineId !== "all" ||
    selectedShiftId !== "all" ||
    selectedPartId !== "all" ||
    selectedStatus !== "all";

  const handleExport = async () => {
    const toastId = toast.loading("Preparing export...");

    try {
      const result = await getAllProductionPlansForExport({
        searchFilters,
        sortBy,
        sortOrder,
        plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
        lineId: selectedLineId === "all" ? undefined : selectedLineId,
        shiftId: selectedShiftId === "all" ? undefined : selectedShiftId,
        partId: selectedPartId === "all" ? undefined : selectedPartId,
        status: selectedStatus === "all" ? undefined : selectedStatus,
      });

      if (result.success && result.productionPlans) {
        const exportData = formatDataForExport(
          result.productionPlans,
          ["id", "lineId", "shiftId", "partId", "createdById"],
          ["planDate", "startedAt", "completedAt", "createdAt", "updatedAt"],
        );

        exportToExcel(
          exportData,
          `production-plans-export-${new Date().toISOString().split("T")[0]}`,
          "Production Plans",
        );

        toast.success(
          `Successfully exported ${result.productionPlans.length} production plans`,
          { id: toastId },
        );
      } else {
        toast.error(result.message || "Failed to export production plans", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred while exporting", { id: toastId });
    }
  };

  // Handle Excel template download
  async function handleDownloadTemplate() {
    try {
      const result = await getProductionPlanTemplateData();

      if (result.success && result.templateData && result.instructions) {
        // Convert instructions object to array of strings
        const instructionStrings = [
          result.instructions.title,
          result.instructions.description,
          "",
          ...result.instructions.fields.map(
            (f: { field: string; description: string; required: boolean }) =>
              `${f.field}: ${f.description} (${f.required ? "Required" : "Optional"})`,
          ),
        ];

        createExcelTemplate(
          result.templateData,
          instructionStrings,
          "production_plan_import_template",
          "Data",
          "Instructions",
        );
        toast.success("Template downloaded successfully");
      } else {
        toast.error(result.message || "Failed to generate template");
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  }

  // Handle Excel import
  async function handleImport(
    data: Array<{
      workOrderNo: string | Date;
      planDate: string | Date;
      lineName: string | Date;
      shiftNumber: string | Date | number;
      partNo: string | Date;
      cycleTimeSec: string | Date | number;
      plannedQty: string | Date | number;
      sequence: string | Date | number;
      status?: string | Date;
    }>,
  ) {
    // Build mappings
    const lineNameToIdMap: Record<string, string> = {};
    lines.forEach((line) => {
      lineNameToIdMap[line.name] = line.id;
    });

    const shiftMap: Record<string, Record<number, string>> = {};
    shifts.forEach((shift) => {
      if (!shiftMap[shift.lineId]) {
        shiftMap[shift.lineId] = {};
      }
      shiftMap[shift.lineId][shift.number] = shift.id;
    });

    const partNoToIdMap: Record<string, string> = {};
    parts.forEach((part) => {
      partNoToIdMap[part.partNo] = part.id;
    });

    // Transform data
    const typedData = data.map((row) => ({
      workOrderNo: String(row.workOrderNo || ""),
      planDate: String(row.planDate || ""),
      lineName: String(row.lineName || ""),
      shiftNumber: Number(row.shiftNumber) || 0,
      partNo: String(row.partNo || ""),
      cycleTimeSec: Number(row.cycleTimeSec) || 0,
      plannedQty: Number(row.plannedQty) || 0,
      sequence: Number(row.sequence) || 0,
      status: row.status ? String(row.status) : "OPEN",
    }));

    const result = await importProductionPlans(
      typedData,
      lineNameToIdMap,
      shiftMap,
      partNoToIdMap,
    );

    // Show results
    if (result.successCount > 0) {
      toast.success(
        `Successfully imported ${result.successCount} production plan(s)`,
        {
          description:
            result.failureCount > 0
              ? `${result.failureCount} row(s) failed`
              : undefined,
        },
      );
    }

    if (result.errors.length > 0) {
      toast.error(`Import completed with ${result.errors.length} error(s)`, {
        description: result.errors
          .slice(0, 3)
          .map((e) => `Row ${e.row}: ${e.error}`)
          .join("\n"),
      });
    }

    // Refresh data if successful
    if (result.successCount > 0) {
      mutate();
    }

    return result;
  }

  const columns = getProductionPlanColumns({
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
                <CardTitle>Production Schedule</CardTitle>
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
                  <span className="sm:inline">New Plan</span>
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
                <Combobox
                  options={[
                    { value: "all", label: "All Plants" },
                    ...plants.map((plant) => ({
                      value: plant.id,
                      label: plant.name,
                    })),
                  ]}
                  value={selectedPlantId}
                  onValueChange={handlePlantFilterChange}
                  placeholder={
                    isLoadingFilters ? "Loading plants..." : "All plants"
                  }
                  searchPlaceholder="Search plants..."
                  emptyText="No plants found."
                  disabled={isLoadingFilters}
                  className="w-full sm:w-[200px]"
                />

                <Combobox
                  options={[
                    { value: "all", label: "All Lines" },
                    ...availableLines.map((line) => ({
                      value: line.id,
                      label: line.name,
                    })),
                  ]}
                  value={selectedLineId}
                  onValueChange={handleLineFilterChange}
                  placeholder={
                    isLoadingFilters ? "Loading lines..." : "All lines"
                  }
                  searchPlaceholder="Search lines..."
                  emptyText="No lines found."
                  disabled={isLoadingFilters || selectedPlantId === "all"}
                  className="w-full sm:w-[200px]"
                />

                <Combobox
                  options={[
                    { value: "all", label: "All Shifts" },
                    ...availableShifts.map((shift) => ({
                      value: shift.id,
                      label: `Shift ${shift.number}`,
                    })),
                  ]}
                  value={selectedShiftId}
                  onValueChange={handleShiftFilterChange}
                  placeholder="All shifts"
                  searchPlaceholder="Search shifts..."
                  emptyText="No shifts found."
                  disabled={isLoadingFilters || selectedLineId === "all"}
                  className="w-full sm:w-[200px]"
                />

                <Combobox
                  options={[
                    { value: "all", label: "All Parts" },
                    ...parts.map((part) => ({
                      value: part.id,
                      label: part.partNo,
                    })),
                  ]}
                  value={selectedPartId}
                  onValueChange={handlePartFilterChange}
                  placeholder="All parts"
                  searchPlaceholder="Search parts..."
                  emptyText="No parts found."
                  disabled={isLoadingFilters}
                  className="w-full sm:w-[200px]"
                />

                <Combobox
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "OPEN", label: "Open" },
                    { value: "RUNNING", label: "Running" },
                    { value: "CLOSED", label: "Closed" },
                    { value: "CANCELED", label: "Canceled" },
                  ]}
                  value={selectedStatus}
                  onValueChange={handleStatusFilterChange}
                  placeholder="All statuses"
                  searchPlaceholder="Search statuses..."
                  emptyText="No status found."
                  className="w-full sm:w-[200px]"
                />

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
            <DataTable
              columns={columns}
              data={productionPlans}
              // Multi-column search with operators
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "workOrderNo", label: "Work Order", type: "string" },
                { id: "planDate", label: "Plan Date", type: "date" },
                { id: "lineName", label: "Line", type: "string" },
                { id: "shiftNumber", label: "Shift", type: "number" },
                { id: "partNo", label: "Part No", type: "string" },
                { id: "partName", label: "Part Name", type: "string" },
                { id: "status", label: "Status", type: "string" },
                { id: "sequence", label: "Sequence", type: "number" },
                { id: "plannedQty", label: "Planned Qty", type: "number" },
                { id: "actualQty", label: "Actual Qty", type: "number" },
                { id: "ngQty", label: "NG Qty", type: "number" },
                { id: "cycleTimeSec", label: "Cycle Time", type: "number" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              searchPlaceholder="Enter search value..."
              // Server-side props
              pageCount={pagination?.totalPages}
              pageIndex={page - 1}
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              isLoading={isLoading}
              totalCount={pagination?.total}
              // Export
              onExport={handleExport}
              exportFilename="production-plans"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Production Plan</DialogTitle>
            <DialogDescription>
              Add a new production plan to the schedule
            </DialogDescription>
          </DialogHeader>
          <ProductionPlanForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Production Plan</DialogTitle>
            <DialogDescription>
              Update production plan details
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <ProductionPlanForm
              initialData={editingPlan}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog<{
        workOrderNo: string;
        planDate: string;
        lineName: string;
        shiftNumber: number;
        partNo: string;
        cycleTimeSec: number;
        plannedQty: number;
        sequence: number;
        status?: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        title="Import Production Plans"
        description="Upload an Excel file to import multiple production plans at once. Download the template to see the required format."
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={(open: boolean) => !open && setDeletingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the production plan "
              {deletingPlan?.workOrderNo}". This action cannot be undone.
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
