"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface ParetoNGTableData {
  id: string;
  date: Date;
  shiftNumber: number;
  plantName: string;
  lineName: string;
  workOrderNo: string;
  partNo: string;
  partName: string;
  category: string;
  criteria: string;
  note: string;
  qty: number;
}

export const paretoNGTableColumns: ColumnDef<ParetoNGTableData>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      format(new Date(row.getValue("date")), "MMM dd, yyyy HH:mm"),
  },
  {
    accessorKey: "shiftNumber",
    header: "Shift",
    cell: ({ row }) => `Shift ${row.getValue("shiftNumber")}`,
  },
  {
    accessorKey: "plantName",
    header: "Plant",
  },
  {
    accessorKey: "lineName",
    header: "Line",
  },
  {
    accessorKey: "workOrderNo",
    header: "WO No",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("workOrderNo")}</span>
    ),
  },
  {
    accessorKey: "partNo",
    header: "Part No",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-mono text-sm">{row.getValue("partNo")}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.partName}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "NG Category",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.getValue("category")}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.criteria}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => {
      const note = row.getValue<string>("note");
      return (
        <span className="text-sm">
          {note === "-" ? (
            <span className="text-muted-foreground">{note}</span>
          ) : (
            note
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "qty",
    header: "Qty (pcs)",
    cell: ({ row }) => {
      const qty = row.getValue<number>("qty");
      return (
        <span className="font-bold text-red-600 dark:text-red-400">
          {qty.toLocaleString()}
        </span>
      );
    },
  },
];
