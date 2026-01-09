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
import { getShiftColumns, type Shift } from "@/components/shifts/shift-columns";
import { ShiftForm } from "@/components/shifts/shift-form";
import {
  deleteShift,
  getAllShiftsForExport,
  getShiftTemplateData,
  importShifts,
} from "@/server/shiftService";
import { useShifts } from "@/hooks/useShifts";
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

export default function ShiftsPage() {
  useDocumentTitle("Shifts");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedLineId, setSelectedLineId] = useState<string>("all");
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");

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
  const sortBy = sorting.length > 0 ? sorting[0].id : "number";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "asc";

  // Use SWR hook for data fetching
  const { shifts, pagination, isLoading, mutate } = useShifts({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
    lineId: selectedLineId === "all" ? undefined : selectedLineId,
    plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
  };

  const handleDelete = (shift: Shift) => {
    setDeletingShift(shift);
  };

  const confirmDelete = () => {
    if (!deletingShift) return;

    startTransition(async () => {
      const result = await deleteShift(deletingShift.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingShift(null);
        await mutate(); // Revalidate SWR cache
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingShift(null);
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

  const handleExport = async () => {
    const toastId = toast.loading("Preparing export...");

    try {
      // Fetch all shifts with current filters and sorting
      const result = await getAllShiftsForExport({
        searchFilters,
        sortBy,
        sortOrder,
        lineId: selectedLineId === "all" ? undefined : selectedLineId,
        plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
      });

      if (result.success && result.shifts) {
        const exportData = formatDataForExport(
          result.shifts,
          ["id", "deletedAt", "lineId"], // Exclude id, deletedAt, and lineId fields
          ["createdAt", "updatedAt"], // Format date fields
        );

        exportToExcel(
          exportData,
          `shifts-export-${new Date().toISOString().split("T")[0]}`,
          "Shifts",
        );

        toast.success(`Successfully exported ${result.shifts.length} shifts`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "Failed to export shifts", {
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

  // Handle Excel template download
  async function handleDownloadTemplate() {
    try {
      const result = await getShiftTemplateData();

      if (result.success && result.templateData && result.instructions) {
        createExcelTemplate(
          result.templateData,
          result.instructions,
          "shift_import_template.xlsx",
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
      lineName: string | Date;
      number: string | Date;
      workStart: string | Date;
      workEnd: string | Date;
      break1Start: string | Date;
      break1End: string | Date;
      break2Start: string | Date;
      break2End: string | Date;
      break3Start: string | Date;
      break3End: string | Date;
    }>,
  ) {
    // Helper function to convert Date to HH:mm string or return string as-is
    const toTimeString = (value: string | Date | undefined | null): string => {
      if (!value) return "";
      if (value instanceof Date) {
        const hours = value.getHours().toString().padStart(2, "0");
        const minutes = value.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return String(value);
    };

    // Build line name to ID mapping from active lines
    const lineNameToIdMap: Record<string, string> = {};
    lines.forEach((line) => {
      lineNameToIdMap[line.name] = line.id;
    });

    // Transform and import data
    const typedData = data.map((row) => ({
      lineName: String(row.lineName || ""),
      number: String(row.number || ""),
      workStart: toTimeString(row.workStart),
      workEnd: toTimeString(row.workEnd),
      break1Start: toTimeString(row.break1Start),
      break1End: toTimeString(row.break1End),
      break2Start: toTimeString(row.break2Start),
      break2End: toTimeString(row.break2End),
      break3Start: toTimeString(row.break3Start),
      break3End: toTimeString(row.break3End),
    }));

    const result = await importShifts(typedData, lineNameToIdMap);

    // Show results
    if (result.successCount > 0) {
      toast.success(`Successfully imported ${result.successCount} shift(s)`, {
        description:
          result.failureCount > 0
            ? `${result.failureCount} row(s) failed`
            : undefined,
      });
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

  const columns = getShiftColumns({
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
                <CardTitle>Shifts</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage shift schedules and work times
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
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
                  <span className="sm:inline">Import</span>
                </Button>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Add Shift</span>
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
                <Select
                  value={selectedLineId}
                  onValueChange={handleLineFilterChange}
                  disabled={isLoadingLines}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
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
                {(selectedPlantId !== "all" || selectedLineId !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlantId("all");
                      setSelectedLineId("all");
                    }}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>

            <DataTable
              columns={columns}
              data={shifts}
              // Multi-column search
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "number", label: "Shift Number", type: "number" },
                { id: "lineName", label: "Line", type: "string" },
                { id: "workStart", label: "Work Start", type: "string" },
                { id: "workEnd", label: "Work End", type: "string" },
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
              exportFilename="shifts"
              totalCount={pagination?.total}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new shift to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <ShiftForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingShift}
        onOpenChange={(open) => !open && setEditingShift(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription className="text-sm">
              Update shift information.
            </DialogDescription>
          </DialogHeader>
          {editingShift && (
            <ShiftForm initialData={editingShift} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog<{
        lineName: string;
        number: string;
        workStart: string;
        workEnd: string;
        break1Start: string;
        break1End: string;
        break2Start: string;
        break2End: string;
        break3Start: string;
        break3End: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        title="Import Shifts"
        description="Upload an Excel file to import multiple shifts at once. Download the template to see the required format."
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingShift}
        onOpenChange={(open: boolean) => !open && setDeletingShift(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the shift{" "}
              <span className="font-semibold">
                {deletingShift?.lineName} - Shift {deletingShift?.number}
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
