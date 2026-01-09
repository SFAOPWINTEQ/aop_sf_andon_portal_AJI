"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientFormatDateTimeMedium } from "@/lib/date";

export type Shift = {
  id: string;
  lineId: string;
  lineName?: string;
  number: number;
  workStart: string;
  workEnd: string;
  break1Start?: string | null;
  break1End?: string | null;
  break2Start?: string | null;
  break2End?: string | null;
  break3Start?: string | null;
  break3End?: string | null;
  loadingTimeInSec: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

interface ShiftColumnsProps {
  onEdit: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
}

export const getShiftColumns = ({
  onEdit,
  onDelete,
}: ShiftColumnsProps): ColumnDef<Shift>[] => [
  {
    accessorKey: "lineName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Line
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lineName = row.getValue("lineName") as string;
      return (
        <Badge variant="outline" className="font-normal">
          {lineName}
        </Badge>
      );
    },
  },
  {
    accessorKey: "number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Shift #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">Shift {row.getValue("number")}</div>
    ),
  },
  {
    accessorKey: "workStart",
    header: "Work Start",
    cell: ({ row }) => {
      const time = row.getValue("workStart") as string;
      return <div className="text-sm">{time}</div>;
    },
  },
  {
    accessorKey: "workEnd",
    header: "Work End",
    cell: ({ row }) => {
      const time = row.getValue("workEnd") as string;
      return <div className="text-sm">{time}</div>;
    },
  },
  {
    id: "breaks",
    header: "Breaks",
    cell: ({ row }) => {
      const shift = row.original;
      const breaks = [];
      if (shift.break1Start && shift.break1End) {
        breaks.push(`${shift.break1Start}-${shift.break1End}`);
      }
      if (shift.break2Start && shift.break2End) {
        breaks.push(`${shift.break2Start}-${shift.break2End}`);
      }
      if (shift.break3Start && shift.break3End) {
        breaks.push(`${shift.break3Start}-${shift.break3End}`);
      }
      return (
        <div className="text-sm text-muted-foreground">
          {breaks.length > 0 ? breaks.join(", ") : "No breaks"}
        </div>
      );
    },
  },
  {
    accessorKey: "loadingTimeInSec",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Loading Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const seconds = row.getValue("loadingTimeInSec") as number;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return (
        <div className="text-sm font-medium">
          {hours}h {minutes}m
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {clientFormatDateTimeMedium(date)}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const shift = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(shift.id)}
            >
              Copy shift ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(shift)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit shift
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(shift)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete shift
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
