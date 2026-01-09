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

/**
 * Table row type (UI-ready)
 */
export type ChildPart = {
  id: string;
  childPartNo: string;
  childPartname: string;
  qtyLotSupply: number | null;

  partId: string;
  lineId: string;
  plantId: string;

  partNo?: string;
  partName?: string;
  partSku?: string;
  lineName?: string;

  createdAt: Date;
  updatedAt: Date;
};

interface ChildPartColumnsProps {
  onEdit: (childPart: ChildPart) => void;
  onDelete: (childPart: ChildPart) => void;
}

export const getChildPartColumns = ({
  onEdit,
  onDelete,
}: ChildPartColumnsProps): ColumnDef<ChildPart>[] => [
     /**
   * Line
   */
  {
    accessorKey: "lineName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Line
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const lineName = row.getValue("lineName") as string | undefined;
      return lineName ? (
        <Badge variant="outline" className="font-normal">
          {lineName}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );
    },
  },

    /**
   * Parent Part SKU
   */
  {
    accessorKey: "partSku",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        SKU
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const partSku = row.getValue("partSku") as string;
      return (
        <Badge variant="secondary" className="font-mono">
          {partSku}
        </Badge>
      );
    },
  },

  /**
   * Parent Part NopartSku
   */
  {
    accessorKey: "partNo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Parent Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const partNo = row.getValue("partNo") as string;
      return (
        <Badge variant="secondary" className="font-mono">
          {partNo}
        </Badge>
      );
    },
  },

  /**
   * Parent Part Name
   */
  {
    accessorKey: "partName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Part Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("partName")}</div>
    ),
  },

  /**
   * Child Part No
   */
  {
    accessorKey: "childPartNo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Child Part Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-mono font-medium">
        {row.getValue("childPartNo")}
      </div>
    ),
  },

  /**
   * Child Part Name
   */
  {
    accessorKey: "childPartname",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Child Part Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("childPartname")}</div>
    ),
  },

  /**
   * Qty Lot Supply
   */
  {
    accessorKey: "qtyLotSupply",
    meta: {
        className: "text-center", // ← penting untuk header & cell
    },
    header: ({ column }) => (
        <div className="flex justify-center w-full">
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            Qty Lot Supply
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
        </div>
    ),
    cell: ({ row }) => {
        const qty = row.getValue("qtyLotSupply") as number | null;

        return qty ? (
        <div className="flex justify-center items-center gap-2">
            <span className="font-mono">{qty.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">pcs</span>
        </div>
        ) : (
        <div className="flex justify-center text-muted-foreground text-sm">
            -
        </div>
        );
    },
  },

  /**
   * Created At
   */
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {clientFormatDateTimeMedium(date)}
        </div>
      );
    },
  },

  /**
   * Actions
   */
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const childPart = row.original;

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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onEdit(childPart)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(childPart)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];