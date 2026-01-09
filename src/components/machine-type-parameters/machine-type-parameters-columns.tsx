"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientFormatDateTimeMedium } from "@/lib/date";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
export type MachineTypeParameter = {
  id: string;
  parameterId: string;
  machineTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  parameter?: {
    id: string;
    name: string;
  };

  machineType?: {
    id: string;
    name: string;
    code: string;
  };
};

interface MachineTypeParameterColumnsProps {
  onEdit: (machine: MachineTypeParameter) => void;
  onDelete: (machine: MachineTypeParameter) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  COLUMNS                                   */
/* -------------------------------------------------------------------------- */
export const getMachineTypeParameterColumns = ({
  onEdit,
  onDelete,
}: MachineTypeParameterColumnsProps): ColumnDef<MachineTypeParameter>[] => [
  // Machine Type
  {
    id: "machineType",
    accessorFn: (row): string => row.machineType?.name ?? "",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Machine Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.original.machineType?.name ?? "-"}
      </Badge>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue<string>(columnId);
      const b = rowB.getValue<string>(columnId);
      return a.localeCompare(b);
    },
  },

  // Parameter
  {
    id: "parameter",
    accessorFn: (row): string => row.parameter?.name ?? "",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Parameter
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.original.parameter?.name ?? "-"}
      </Badge>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue<string>(columnId);
      const b = rowB.getValue<string>(columnId);
      return a.localeCompare(b);
    },
  },

  // Created At
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      clientFormatDateTimeMedium(row.getValue("createdAt")),
  },

  // Updated At
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Updated At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      clientFormatDateTimeMedium(row.getValue("updatedAt")),
  },

  // Actions
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(row.original)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];