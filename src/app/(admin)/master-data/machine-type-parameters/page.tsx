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
  getMachineTypeParameterColumns,
  type MachineTypeParameter,
} from "@/components/machine-type-parameters/machine-type-parameters-columns";
import { MachineTypeParameterForm } from "@/components/machine-type-parameters/machine-type-parameters-form";
import { deleteMachine } from "@/server/machineService";
import { useMachineTypeParameters } from "@/hooks/useMachineTypeParameters";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { MachineTypeParameterFormInitialData } from "@/components/machine-type-parameters/machine-type-parameters-form";
import { getMachineTypes } from "@/server/machineTypeService";
import { getParameters } from "@/server/parameterService";
import { deleteMachineTypeParameter } from "@/server/machineTypeParameterService";

export function mapMachineToFormInitialData(
  machine: MachineTypeParameter,
): MachineTypeParameterFormInitialData {
  return {
    id: machine.id,
    machineTypeId: machine.machineTypeId,
    parameterId: machine.parameterId
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
  const [selectedMachineTypeId, setSelectedMachineTypeId] = useState("all");
  const [selectedParameterId, setSelectedParameterId] = useState("all");

  const [parameters, setParameters] = useState<Array<{ id: string; name: string }>>([]);
  const [machineTypes, setMachineTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [lines, setLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [filteredLines, setFilteredLines] = useState<typeof lines>([]);
  const [filteredMachineTypes, setFilteredMachineTypes] = useState<typeof machineTypes>([]);

    /* -------------------------------------------------------------------------- */
    /*                              INITIAL FETCH                                 */
    /* -------------------------------------------------------------------------- */
    useEffect(() => {
        async function fetchMasterData() {
            const [parameters, machineTypeRes] = await Promise.all([
                getParameters({ page: 1, limit: 1000 }),
                getMachineTypes({page: 1, limit: 1000})
            ]);

            if (parameters.success && parameters.parameters) {
                setParameters(parameters.parameters.filter((p) => p.status));
            }

            if (machineTypeRes.success && machineTypeRes.machineTypes) {
                setMachineTypes(machineTypeRes.machineTypes.filter((p) => p.status));
            }
        }

        fetchMasterData();
    }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   DATA                                     */
  /* -------------------------------------------------------------------------- */
  const { machineTypeParameters, pagination, isLoading, mutate } = useMachineTypeParameters({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
    parameterId: selectedParameterId === "all" ? undefined : selectedParameterId,
    machineTypeId: selectedMachineTypeId === "all" ? undefined : selectedMachineTypeId,
  });

  /* -------------------------------------------------------------------------- */
  /*                                   DIALOG                                   */
  /* -------------------------------------------------------------------------- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMachineTypeParameter, setEditingMachineTypeParameter] = useState<MachineTypeParameter | null>(null);
  const [deletingMachineTypeParameterer, setDeletingMachineTypeParameterer] = useState<MachineTypeParameter | null>(null);
  const [isPending, startTransition] = useTransition();

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
  }, [ selectedParameterId, selectedMachineTypeId]);

  /* -------------------------------------------------------------------------- */
  /*                                  HANDLER                                   */
  /* -------------------------------------------------------------------------- */
  const confirmDelete = () => {
    if (!deletingMachineTypeParameterer) return;

    startTransition(async () => {
      const result = await deleteMachineTypeParameter(deletingMachineTypeParameterer.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingMachineTypeParameterer(null);
        await mutate();
      } else {
        toast.error(result.message);
      }
    });
  };

  const columns = getMachineTypeParameterColumns({
    onEdit: setEditingMachineTypeParameter,
    onDelete: setDeletingMachineTypeParameterer,
  });

  const handleSortingChange = (sorting: SortingState) => {
    setSorting(sorting);
    setPage(1);
  };
  
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
                <CardTitle>Machine Type Parameter</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage machine types and parameter assignments
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
                  Add Machine Type Parameter
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

                <Select
                  value={selectedParameterId}
                  onValueChange={(v) => setSelectedParameterId(v)}
                >
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue placeholder="All parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All parameter</SelectItem>
                    {parameters.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={machineTypeParameters}
              useMultiColumnSearch
              searchableColumns={[
                { id: "machineType", label: "Machine Type", type: "string" },
                { id: "parameter", label: "Parameter", type: "string" },
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
            <DialogTitle>Create Machine Type Parameter</DialogTitle>
            <DialogDescription>
              Add a new machine type parameter
            </DialogDescription>
          </DialogHeader>
          <MachineTypeParameterForm onSuccess={async () => {
            setIsCreateOpen(false);
            await mutate();
          }} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={!!editingMachineTypeParameter}
        onOpenChange={(open) => !open && setEditingMachineTypeParameter(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Machine Type Parameter</DialogTitle>
            <DialogDescription>
              Update machine type parameter data
            </DialogDescription>
          </DialogHeader>
          {editingMachineTypeParameter && (
            <MachineTypeParameterForm
              initialData={mapMachineToFormInitialData(editingMachineTypeParameter)}
              onSuccess={async () => {
                setEditingMachineTypeParameter(null);
                await mutate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog
        open={!!deletingMachineTypeParameterer}
        onOpenChange={(open) => !open && setDeletingMachineTypeParameterer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">
                {deletingMachineTypeParameterer?.machineType?.name} - {deletingMachineTypeParameterer?.parameter?.name}
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