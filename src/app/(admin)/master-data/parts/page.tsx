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
import { getPartColumns, type Part } from "@/components/parts/part-columns";
import { PartForm } from "@/components/parts/part-form";
import {
  deletePart,
  getAllPartsForExport,
  getPartTemplateData,
  importParts,
} from "@/server/partService";
import { getLines } from "@/server/lineService";
import { useParts } from "@/hooks/useParts";
import {
  exportToExcel,
  formatDataForExport,
  createExcelTemplate,
} from "@/lib/excel";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { ExcelImportDialog } from "@/components/ui/excel-import-dialog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function PartsPage() {
  useDocumentTitle("Parts");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Extract sort parameters from sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : "partNo";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "asc";

  // Use SWR hook for data fetching
  const { parts, pagination, isLoading, mutate } = useParts({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deletingPart, setDeletingPart] = useState<Part | null>(null);
  const [isPending, startTransition] = useTransition();

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleEdit = (part: Part) => {
    setEditingPart(part);
  };

  const handleDelete = (part: Part) => {
    setDeletingPart(part);
  };

  const confirmDelete = () => {
    if (!deletingPart) return;

    startTransition(async () => {
      const result = await deletePart(deletingPart.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingPart(null);
        await mutate(); // Revalidate SWR cache
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingPart(null);
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
      // Fetch all parts with current filters and sorting
      const result = await getAllPartsForExport({
        searchFilters,
        sortBy,
        sortOrder,
      });

      if (result.success && result.parts) {
        // Map the data to include lineName and exclude lineId
        const exportData = result.parts.map((part) => ({
          sku: part.sku || "",
          partNo: part.partNo,
          name: part.name,
          lineName: part.lineName || "",
          qtyPerLot: part.qtyPerLot || "",
          cycleTimeSec: part.cycleTimeSec || "",
          createdAt: part.createdAt,
          updatedAt: part.updatedAt,
        }));

        const formattedData = formatDataForExport(
          exportData as unknown as Record<string, unknown>[],
          [], // Don't exclude any fields
          ["createdAt", "updatedAt"], // Format date fields
        );

        exportToExcel(
          formattedData,
          `parts-export-${new Date().toISOString().split("T")[0]}`,
          "Parts",
        );

        toast.success(`Successfully exported ${result.parts.length} parts`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "Failed to export parts", {
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
      const result = await getPartTemplateData();

      if (result.success && result.templateData && result.instructions) {
        createExcelTemplate(
          result.templateData,
          result.instructions,
          `parts-import-template-${new Date().toISOString().split("T")[0]}`,
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
      sku: string;
      partNo: string;
      name: string;
      lineName: string;
      qtyPerLot: string;
      cycleTimeSec: string;
    }>,
  ) => {
    // Ensure data is plain objects (serialize and deserialize)
    const plainData = JSON.parse(JSON.stringify(data));

    // Fetch all lines to build the mapping
    const linesResult = await getLines({
      page: 1,
      limit: 1000,
      sortBy: "name",
      sortOrder: "asc",
    });

    if (!linesResult.success || !linesResult.lines) {
      return {
        successCount: 0,
        failureCount: data.length,
        errors: [{ row: 1, error: "Failed to fetch lines data" }],
      };
    }

    // Build line name to ID mapping
    const lineNameToIdMap: Record<string, string> = {};
    linesResult.lines.forEach((line) => {
      lineNameToIdMap[line.name] = line.id;
    });

    // Import data
    const result = await importParts(plainData, lineNameToIdMap);

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors,
    };
  };

  const columns = getPartColumns({
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
                <CardTitle>Parts</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage parts and components inventory
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
                  <span className="sm:inline">Add Part</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={parts}
              // Multi-column search
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "sku", label: "SKU", type: "string" },
                { id: "partNo", label: "Part Number", type: "string" },
                { id: "name", label: "Part Name", type: "string" },
                { id: "lineName", label: "Line", type: "string" },
                { id: "qtyPerLot", label: "Qty per Lot", type: "number" },
                { id: "cycleTimeSec", label: "Cycle Time", type: "number" },
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
              exportFilename="parts"
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New Part</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new part to the system. Part number is required.
            </DialogDescription>
          </DialogHeader>
          <PartForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPart}
        onOpenChange={(open) => !open && setEditingPart(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription className="text-sm">
              Update part information.
            </DialogDescription>
          </DialogHeader>
          {editingPart && (
            <PartForm initialData={editingPart} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ExcelImportDialog<{
        sku: string;
        partNo: string;
        name: string;
        lineName: string;
        qtyPerLot: string;
        cycleTimeSec: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Import Parts from Excel"
        description="Upload an Excel file with part data. Download the template first if you haven't."
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        onSuccess={mutate}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPart}
        onOpenChange={(open: boolean) => !open && setDeletingPart(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the part{" "}
              <span className="font-semibold">
                {deletingPart?.partNo} - {deletingPart?.name}
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
