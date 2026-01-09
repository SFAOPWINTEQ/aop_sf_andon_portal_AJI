"use client";

import { useEffect, useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DataTable } from "@/components/ui/data-table";
import {
  getMachineColumns,
  type Machine,
} from "@/components/machines/machine-columns";
import { MachineForm } from "@/components/machines/machine-form";
import { deleteMachine } from "@/server/machineService";
import { useMachines } from "@/hooks/useMachines";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { MachineFormInitialData } from "@/components/machines/machine-form";
import { getMachineTypes } from "@/server/machineTypeService";

export function mapMachineToFormInitialData(
  machine: Machine,
): MachineFormInitialData {
  return {
    id: machine.id,
    name: machine.name,
    lineId: machine.lineId,
    machineTypeId: machine.machineTypeId,
    sequence: machine.sequence,
    line: machine.line?.plant
      ? { plantId: machine.line.plant.id }
      : undefined,
  };
}

export default function MachinesPage() {
  useDocumentTitle("Machines");

  /* -------------------------------------------------------------------------- */
  /*                                 TABLE STATE                                */
  /* -------------------------------------------------------------------------- */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  /* -------------------------------------------------------------------------- */
  /*                                   FILTER                                   */
  /* -------------------------------------------------------------------------- */
  const [selectedPlantId, setSelectedPlantId] = useState("all");
  const [selectedMachineTypeId, setSelectedMachineTypeId] = useState("all");
  const [selectedLineId, setSelectedLineId] = useState("all");

  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [machineTypes, setMachineTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [lines, setLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [filteredLines, setFilteredLines] = useState<typeof lines>([]);
  const [filteredMachineTypes, setFilteredMachineTypes] = useState<typeof machineTypes>([]);

  /* -------------------------------------------------------------------------- */
  /*                                   DATA                                     */
  /* -------------------------------------------------------------------------- */
  const { machines, pagination, isLoading, mutate } = useMachines({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
    plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
    lineId: selectedLineId === "all" ? undefined : selectedLineId,
    machineTypeId: selectedMachineTypeId === "all" ? undefined : selectedMachineTypeId,
  });

  /* -------------------------------------------------------------------------- */
  /*                                   DIALOG                                   */
  /* -------------------------------------------------------------------------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);
  const [isPending, startTransition] = useTransition();

  /* -------------------------------------------------------------------------- */
  /*                              INITIAL FETCH                                 */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function fetchMasterData() {
      const [plantsRes, linesRes, machineTypeRes] = await Promise.all([
        getPlants({ page: 1, limit: 1000 }),
        getLines({ page: 1, limit: 1000 }),
        getMachineTypes({page: 1, limit: 1000})
      ]);

      if (plantsRes.success && plantsRes.plants) {
        setPlants(plantsRes.plants.filter((p) => p.isActive));
      }

      if (machineTypeRes.success && machineTypeRes.machineTypes) {
        setMachineTypes(machineTypeRes.machineTypes.filter((p) => p.status));
      }

      if (linesRes.success && linesRes.lines) {
        const activeLines = linesRes.lines.filter((l) => l.isActive);
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
  }, [selectedPlantId, lines, selectedLineId, selectedMachineTypeId]);

  useEffect(() => {
    if (selectedMachineTypeId === "all") {
      setFilteredMachineTypes(machineTypes);
      return;
    }

    const next = machineTypes.filter((l) => l.id === selectedMachineTypeId);
    setFilteredMachineTypes(next);

    if (selectedMachineTypeId !== "all" && !next.some((l) => l.id === selectedMachineTypeId)) {
      setSelectedMachineTypeId("all");
    }
  }, [selectedPlantId, lines, selectedLineId, selectedMachineTypeId]);

  /* -------------------------------------------------------------------------- */
  /*                                  HANDLER                                   */
  /* -------------------------------------------------------------------------- */
  const confirmDelete = () => {
    if (!deletingMachine) return;

    startTransition(async () => {
      const result = await deleteMachine(deletingMachine.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingMachine(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const columns = getMachineColumns({
    onEdit: setEditingMachine,
    onDelete: setDeletingMachine,
  });

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Machines</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage machines and line assignments
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
                  Add Machine
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

                <Select
                  value={selectedMachineTypeId}
                  onValueChange={(v) => setSelectedMachineTypeId(v)}
                >
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="All machine types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All machine types</SelectItem>
                    {machineTypes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={machines}
              useMultiColumnSearch
              searchableColumns={[
                { id: "name", label: "Name", type: "string" },
                { id: "plant", label: "Plant", type: "string" },
                { id: "line", label: "Line", type: "string" },
                { id: "sequence", label: "Sequence", type: "number" },
                { id: "machineType", label: "Machine Type", type: "string" },
                { id: "createdAt", label: "Created At", type: "date" },
                { id: "updatedAt", label: "Updated At", type: "date" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={(f) => {
                setSearchFilters(f);
                setPage(1);
              }}
              pageCount={pagination?.totalPages}
              pageIndex={page - 1}
              pageSize={pageSize}
              onPaginationChange={({ pageIndex, pageSize }) => {
                setPage(pageIndex + 1);
                setPageSize(pageSize);
              }}
              sorting={sorting}
              onSortingChange={(s) => {
                setSorting(s);
                setPage(1);
              }}
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
            <DialogTitle>Create Machine</DialogTitle>
            <DialogDescription>
              Add a new machine
            </DialogDescription>
          </DialogHeader>
          <MachineForm onSuccess={async () => {
            setIsCreateOpen(false);
            await mutate();
          }} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editingMachine}
        onOpenChange={(open) => !open && setEditingMachine(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Machine</DialogTitle>
            <DialogDescription>
              Update machine data
            </DialogDescription>
          </DialogHeader>
          {editingMachine && (
            <MachineForm
              initialData={mapMachineToFormInitialData(editingMachine)}
              onSuccess={async () => {
                setEditingMachine(null);
                await mutate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deletingMachine}
        onOpenChange={(open) => !open && setDeletingMachine(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">
                {deletingMachine?.machineType?.name} - {deletingMachine?.line?.name}
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