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
  getChildPartColumns,
  type ChildPart,
} from "@/components/child-parts/child-part-columns";
import { ChildPartForm } from "@/components/child-parts/child-part-form";

import {
  deleteChildPart,
} from "@/server/childPartService";
import { useChildParts } from "@/hooks/useChildParts";

import type { SearchFilter } from "@/components/ui/multi-column-search";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import { getPlants } from "@/server/plantService";
import { getLines } from "@/server/lineService";
import { getParts } from "@/server/partService";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChildPartsPage() {
  useDocumentTitle("Child Parts");

  /* ========================
   * Table State
   * ======================== */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  /* FILTER */
  const [selectedPlantId, setSelectedPlantId] = useState("all");
  const [selectedLineId, setSelectedLineId] = useState("all");
  const [selectedPartId, setSelectedPartId] = useState("all");

  /* MASTER DATA */
  const [plants, setPlants] = useState<{ id: string; name: string }[]>([]);
  const [lines, setLines] = useState<{ id: string; name: string; plantId: string }[]>([]);
  const [parts, setParts] = useState<{ id: string; partNo: string; name: string; lineId: string }[]>([]);

  /* DERIVED */
  const [filteredLines, setFilteredLines] = useState<typeof lines>([]);
  const [filteredParts, setFilteredParts] = useState<typeof parts>([]);

  const sortBy = sorting.length > 0 ? sorting[0].id : "childPartNo";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "asc";

  const { childParts, pagination, isLoading, mutate } = useChildParts({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
    plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
    lineId: selectedLineId === "all" ? undefined : selectedLineId,
    partId: selectedPartId === "all" ? undefined : selectedPartId,
  });

  /* ========================
   * Dialog State
   * ======================== */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  type ChildPartWithRelations = {
    id: string
    childPartNo: string
    childPartname: string
    qtyLotSupply: number | null
    partId: string

    part: {
        id: string
        lineId: string
        line: {
        plantId: string
        }
    }

    // ❌ TIDAK ADA lineId & plantId di root
  }

  useEffect(() => {
    async function fetchMasterData() {
        const [plantsRes, linesRes, partsRes] = await Promise.all([
        getPlants({ page: 1, limit: 1000 }),
        getLines({ page: 1, limit: 1000 }),
        getParts({ page: 1, limit: 1000 }),
        ]);

        if (plantsRes.success) {
        setPlants(plantsRes.plants.filter(p => p.isActive));
        }

        if (linesRes.success) {
        const activeLines = linesRes.lines.filter(l => l.isActive);
        setLines(activeLines);
        setFilteredLines(activeLines);
        }

        if (partsRes.success) {
        setParts(partsRes.parts);
        setFilteredParts(partsRes.parts);
        }
    }

    fetchMasterData();
  }, []);

  useEffect(() => {
    if (selectedPlantId === "all") {
        setFilteredLines(lines);
        return;
    }

    const next = lines.filter(l => l.plantId === selectedPlantId);
    setFilteredLines(next);

    if (!next.some(l => l.id === selectedLineId)) {
        setSelectedLineId("all");
    }
  }, [selectedPlantId, lines]);

  useEffect(() => {
    if (selectedLineId === "all") {
        setFilteredParts(parts);
        return;
    }

    const next = parts.filter(p => p.lineId === selectedLineId);
    setFilteredParts(next);

    if (!next.some(p => p.id === selectedPartId)) {
        setSelectedPartId("all");
    }
    }, [selectedLineId, parts]);


  const [editingChildPart, setEditingChildPart] =
    useState<ChildPart | null>(null);
  const [deletingChildPart, setDeletingChildPart] =
    useState<ChildPart | null>(null);

  const [isPending, startTransition] = useTransition();

  /* ========================
   * Handlers
   * ======================== */
  const handleEdit = (childPart: ChildPart) => {
    setEditingChildPart(childPart);
  };


  const handleDelete = (childPart: ChildPart) => {
    setDeletingChildPart(childPart);
  };

  const confirmDelete = () => {
    if (!deletingChildPart) return;

    startTransition(async () => {
      const result = await deleteChildPart(deletingChildPart.id);

      if (result.success) {
        toast.success(result.message);
        setDeletingChildPart(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingChildPart(null);
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

  /* ========================
   * Columns
   * ======================== */
  const columns = getChildPartColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  /* ========================
   * Render
   * ======================== */
  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Child Parts</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage child parts linked to parent parts
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
                  Add Child Part
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
                <Select value={selectedPlantId} onValueChange={setSelectedPlantId}>
                    <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="All plants" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All plants</SelectItem>
                        {plants.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                    <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="All lines" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All lines</SelectItem>
                        {filteredLines.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                    <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="All lines" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All parts</SelectItem>
                        {filteredParts.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                            {p.partNo} - {p.name}
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
              data={childParts}
              useMultiColumnSearch
              searchableColumns={[
                { id: "partSku", label: "SKU", type: "string" },
                { id: "partNo", label: "Part Number", type: "string" },
                { id: "partName", label: "Part Name", type: "string" },
                { id: "childPartNo", label: "Child Part Number", type: "string" },
                { id: "childPartname", label: "Child Part Name", type: "string" },
                { id: "qtyLotSupply", label: "Qty Lot Supply", type: "number" },
                { id: "createdAt", label: "Created At", type: "date" },
                { id: "updatedAt", label: "Updated At", type: "date" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              searchPlaceholder="Search child parts..."
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Child Part</DialogTitle>
            <DialogDescription>
              Select plant, line, and part before creating child part.
            </DialogDescription>
          </DialogHeader>
          <ChildPartForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editingChildPart}
        onOpenChange={(open) => !open && setEditingChildPart(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Child Part</DialogTitle>
            <DialogDescription>
              Update child part information.
            </DialogDescription>
          </DialogHeader>
          {editingChildPart && (
            <ChildPartForm
              initialData={editingChildPart}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deletingChildPart}
        onOpenChange={(open) => !open && setDeletingChildPart(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete child part{" "}
              <span className="font-semibold">
                {deletingChildPart?.childPartNo} –{" "}
                {deletingChildPart?.childPartname}
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