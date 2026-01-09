"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface LossTimeTableData {
  id: string;
  date: Date;
  workOrderNo: string;
  plantName: string;
  lineName: string;
  shiftNumber: number;
  partNo: string;
  partName: string;
  planWorkingMin: number;
  actualWorkingMin: number;
  pdtMin: number;
  updtMin: number;
  overPdtMin: number;
  smallStopFreq: number;
  lossTimeMin: number;
}

export const lossTimeTableColumns: ColumnDef<LossTimeTableData>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.getValue("date")), "MMM dd, yyyy"),
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
    accessorKey: "planWorkingMin",
    header: "Plan Working (min)",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue<number>("planWorkingMin").toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "actualWorkingMin",
    header: "Actual Working (min)",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue<number>("actualWorkingMin").toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "pdtMin",
    header: "PDT (min)",
    cell: ({ row }) => {
      const pdtMin = row.getValue<number>("pdtMin");
      return (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {pdtMin.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "updtMin",
    header: "UPDT (min)",
    cell: ({ row }) => {
      const updtMin = row.getValue<number>("updtMin");
      return (
        <span className="font-medium text-orange-600 dark:text-orange-400">
          {updtMin.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "overPdtMin",
    header: "Over PDT (min)",
    cell: ({ row }) => {
      const val = row.getValue<number>("overPdtMin");
      return (
        <span className="font-medium text-orange-600 dark:text-orange-400">
          {val.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "smallStopFreq",
    header: "Small Stop (Freq)",
    cell: ({ row }) => {
      const val = row.getValue<number>("smallStopFreq");
      return (
        <span className="font-medium">
          {val.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "lossTimeMin",
    header: "Loss Time (min)",
    cell: ({ row }) => {
      const lossTimeMin = row.getValue<number>("lossTimeMin");
      return (
        <span className="font-bold text-red-600 dark:text-red-400">
          {lossTimeMin.toLocaleString()}
        </span>
      );
    },
  },
];
