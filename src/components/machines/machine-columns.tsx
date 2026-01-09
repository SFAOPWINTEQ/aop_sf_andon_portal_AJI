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
export type Machine = {
  id: string;
  sequence: number;
  name: string;
  lineId: string;
  machineTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  line?: {
    id: string;
    name: string;
    plant?: {
      id: string;
      name: string;
    };
  };

  machineType?: {
    id: string;
    name: string;
    code: string;
  };
};

interface MachineColumnsProps {
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  COLUMNS                                   */
/* -------------------------------------------------------------------------- */
export const getMachineColumns = ({
  onEdit,
  onDelete,
}: MachineColumnsProps): ColumnDef<Machine>[] => [
  {
    accessorKey: "sequence",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Seq
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        #{row.getValue("sequence")}
      </Badge>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.getValue("name")}
      </Badge>
    ),
  },
  {
    id: "plant",
    accessorFn: (row) => row.line?.plant?.name,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Plant
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.original.line?.plant?.name ?? "-"}
      </Badge>
    ),
  },
  {
    id: "line",
    accessorFn: (row) => row.line?.name,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Line
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.original.line?.name ?? "-"}
      </Badge>
    ),
  },
  {
    id: "machineType",
    accessorFn: (row) => row.machineType?.name,
    header: "Machine Type",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {row.original.machineType?.name ?? "-"}
        </span>
        {row.original.machineType?.code && (
          <span className="text-xs text-muted-foreground">
            {row.original.machineType.code}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      clientFormatDateTimeMedium(row.getValue("createdAt")),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Updated At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      clientFormatDateTimeMedium(row.getValue("updatedAt")),
  },
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