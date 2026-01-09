"use client";

import { useState, useTransition, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { getUserPerLineColumns } from "@/components/user-per-lines/user-per-lines-columns";
import { UserPerLineForm } from "@/components/user-per-lines/user-per-lines-form";
import { deleteUserPerLine, getUserPerLines } from "@/server/userPerLineService";
import { useUserPerLines } from "@/hooks/useUserPerLines";
import { exportToExcel, formatDataForExport } from "@/lib/excel";
import type { SearchFilter as ServerSearchFilter } from "@/server/userPerLineRepository";
import type { SearchFilter as UISearchFilter } from "@/components/ui/multi-column-search";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";

export default function UserPerLinePage() {
  useDocumentTitle("User Per Lines");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<UISearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [selectedPlantId, setSelectedPlantId] = useState("all");
  const [selectedLineId, setSelectedLineId] = useState("all");

  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [lines, setLines] = useState<{ id: string; name: string; plantId: string }[]>([]);
  const [filteredLines, setFilteredLines] = useState<typeof lines>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUserPerLine, setEditingUserPerLine] = useState<any | null>(null);
  const [deletingUserPerLine, setDeletingUserPerLine] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  // --- Map UI filters to server filters ---
  const serverFilters: ServerSearchFilter[] = searchFilters
  .map(f => ({
    field: f.column,                        // map column → field
    operator: f.operator as ServerSearchFilter["operator"],
    value: f.value,
    column: f.column,                        // keep column
    type: f.type,
  }));

  useEffect(() => {
    setPage(1);
  }, [searchFilters, selectedPlantId, selectedLineId]);


  const { userPerLines, pagination, isLoading, mutate } = useUserPerLines({
    page,
    limit: pageSize,
    searchFilters: serverFilters,
    sortBy,
    sortOrder,
    plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
    lineId: selectedLineId === "all" ? undefined : selectedLineId,
  });

  const handleEdit = (record: any) => setEditingUserPerLine(record);
  const handleDelete = (record: any) => setDeletingUserPerLine(record);

  const confirmDelete = () => {
    if (!deletingUserPerLine) return;
    startTransition(async () => {
      const result = await deleteUserPerLine(deletingUserPerLine.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingUserPerLine(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingUserPerLine(null);
    await mutate();
  };

  const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
    setPage(newPagination.pageIndex + 1);
    setPageSize(newPagination.pageSize);
  };

  const handleSearchFiltersChange = (filters: UISearchFilter[]) => {
    setSearchFilters(filters);
    setPage(1);
  };

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPage(1);
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing export...");
    try {
      const result = await getUserPerLines({ searchFilters: serverFilters, sortBy, sortOrder });
      if (result.success && result.usersPerLine) {
        const exportData = formatDataForExport(
          result.usersPerLine,
          ["id", "userId", "lineId"],
          ["createdAt", "lastLoginAt"]
        );
        exportToExcel(
          exportData,
          `user-per-lines-export-${new Date().toISOString().split("T")[0]}`,
          "UserPerLines"
        );
        toast.success(`Successfully exported ${result.usersPerLine.length} records`, { id: toastId });
      } else {
        toast.error(result.message || "Failed to export records", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during export", { id: toastId });
    }
  };
  useEffect(() => {
    async function fetchMasterData() {
        const [plantsRes, linesRes] = await Promise.all([
            getPlants({ page: 1, limit: 1000 }),
            getLines({ page: 1, limit: 1000 }),
        ]);

        if (plantsRes.success && plantsRes.plants) {
            setPlants(plantsRes.plants.filter((p) => p.isActive));
        }

        if (linesRes.success) {
        const activeLines = linesRes.lines.filter(l => l.isActive);
            setLines(activeLines);
            setFilteredLines(activeLines);
        }
    }

    fetchMasterData();
  }, []);

  useEffect(() => {
    if (selectedPlantId === "all") {
    setFilteredLines(lines);
    return;
    }

    const next = lines.filter((l) => l.plantId === selectedPlantId);
    setFilteredLines(next);

    if (selectedLineId !== "all" && !next.some((l) => l.id === selectedLineId)) {
    setSelectedLineId("all");
    }
  }, [selectedPlantId, lines, selectedLineId]);

  const columns = getUserPerLineColumns({ onEdit: handleEdit, onDelete: handleDelete });

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>User Per Lines</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage user assignments to production lines
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="icon" onClick={() => mutate()} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button onClick={() => setIsCreateOpen(true)} className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Add Assignment</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter */}
            <div className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters</span>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                    <Select
                  value={selectedPlantId}
                  onValueChange={(v) => setSelectedPlantId(v)}
                >
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="All plants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plants</SelectItem>
                    {plants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedLineId}
                  onValueChange={(v) => setSelectedLineId(v)}
                >
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="All lines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lines</SelectItem>
                    {filteredLines.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                </div>
            </div>
         </CardContent>
          <CardContent>
            <DataTable
              columns={columns}
              data={userPerLines}
              useMultiColumnSearch
              searchableColumns={[
                { id: "userName", label: "Name", type: "string" },
                { id: "userNpk", label: "NPK", type: "string" },
                { id: "lineName", label: "Line", type: "string" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              searchPlaceholder="Search assignments..."
              pageCount={pagination?.totalPages}
              pageIndex={page - 1}
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              isLoading={isLoading}
              onExport={handleExport}
              exportFilename="user-per-lines"
              totalCount={pagination?.total}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add User Assignment</DialogTitle>
            <DialogDescription>Select user and line to assign</DialogDescription>
          </DialogHeader>
          <UserPerLineForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingUserPerLine}
        onOpenChange={(open) => !open && setEditingUserPerLine(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update user-line assignment details</DialogDescription>
          </DialogHeader>
          {editingUserPerLine && (
            <UserPerLineForm initialData={editingUserPerLine} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingUserPerLine}
        onOpenChange={(open) => !open && setDeletingUserPerLine(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the assignment of user{" "}
              <span className="font-semibold">{deletingUserPerLine?.userName}</span> to line{" "}
              <span className="font-semibold">{deletingUserPerLine?.lineName}</span>.
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