"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export interface OEETableRow {
  date: string;
  workOrderNo: string;
  plantName: string;
  lineName: string;
  shiftNumber: number;
  partNo: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export const oeeTableColumns: ColumnDef<OEETableRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("date") as string;
      return format(new Date(date + "T00:00:00"), "MMM dd, yyyy");
    },
  },
  {
    accessorKey: "workOrderNo",
    header: "WO No.",
    cell: ({ row }) => {
      const woNo = row.getValue("workOrderNo") as string;
      return <span className="font-mono text-xs">{woNo}</span>;
    },
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
    cell: ({ row }) => {
      const shift = row.getValue("shiftNumber") as number;
      return <span className="font-mono">{shift}</span>;
    },
  },
  {
    accessorKey: "partNo",
    header: "Part No.",
    cell: ({ row }) => {
      const partNo = row.getValue("partNo") as string;
      return <span className="font-mono text-xs">{partNo}</span>;
    },
  },
  {
    accessorKey: "availability",
    header: "Availability",
    cell: ({ row }) => {
      const value = row.getValue("availability") as number;
      return (
        <span className="font-medium text-blue-600">{value.toFixed(2)}%</span>
      );
    },
  },
  {
    accessorKey: "performance",
    header: "Performance",
    cell: ({ row }) => {
      const value = row.getValue("performance") as number;
      return (
        <span className="font-medium text-orange-600">{value.toFixed(2)}%</span>
      );
    },
  },
  {
    accessorKey: "quality",
    header: "Quality",
    cell: ({ row }) => {
      const value = row.getValue("quality") as number;
      return (
        <span className="font-medium text-violet-600">{value.toFixed(2)}%</span>
      );
    },
  },
  {
    accessorKey: "oee",
    header: "OEE",
    cell: ({ row }) => {
      const value = row.getValue("oee") as number;
      const color =
        value >= 85
          ? "text-emerald-600"
          : value >= 60
            ? "text-orange-600"
            : "text-red-600";
      return (
        <span className={`font-semibold ${color}`}>{value.toFixed(2)}%</span>
      );
    },
  },
];
