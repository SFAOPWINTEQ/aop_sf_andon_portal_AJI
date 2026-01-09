"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface RejectionTableData {
  id: string;
  date: Date;
  workOrderNo: string;
  plantName: string;
  lineName: string;
  shiftNumber: number;
  partNo: string;
  partName: string;
  qty: number;
  category: string;
  criteria: string;
  action: string;
}

export const rejectionTableColumns: ColumnDef<RejectionTableData>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      format(new Date(row.getValue("date")), "MMM dd, yyyy HH:mm"),
  },
  {
    accessorKey: "workOrderNo",
    header: "WO No",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("workOrderNo")}</span>
    ),
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
    accessorKey: "shiftNumber",
    header: "Shift",
    cell: ({ row }) => `Shift ${row.getValue("shiftNumber")}`,
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
    accessorKey: "qty",
    header: "Rejection (pcs)",
    cell: ({ row }) => {
      const qty = row.getValue<number>("qty");
      return (
        <span className="font-bold text-red-600 dark:text-red-400">
          {qty.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.getValue("category")}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.criteria}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue<string>("action");
      return (
        <span className="text-sm">
          {action === "-" ? (
            <span className="text-muted-foreground">{action}</span>
          ) : (
            action
          )}
        </span>
      );
    },
  },
];
