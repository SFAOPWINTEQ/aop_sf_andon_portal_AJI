"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type AchievementData = {
  id: string;
  date: Date;
  workOrderNo: string;
  plantName: string;
  lineName: string;
  shiftNumber: number;
  partNo: string;
  partName: string;
  cycleTimeSec: number;
  plannedQty: number;
  actualQty: number;
  ngQty: number;
  achievementPercent: number;
};

export const achievementTableColumns: ColumnDef<AchievementData>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;
      return (
        <div className="text-sm">
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "workOrderNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          WO No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const workOrderNo = row.getValue("workOrderNo") as string;
      return <div className="font-medium">{workOrderNo}</div>;
    },
  },
  {
    accessorKey: "plantName",
    header: "Plant",
    cell: ({ row }) => {
      const plantName = row.getValue("plantName") as string;
      return (
        <Badge variant="secondary" className="font-normal">
          {plantName}
        </Badge>
      );
    },
  },
  {
    accessorKey: "lineName",
    header: "Line",
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
    accessorKey: "shiftNumber",
    header: "Shift",
    cell: ({ row }) => {
      const shiftNumber = row.getValue("shiftNumber") as number;
      return <div className="text-sm">Shift {shiftNumber}</div>;
    },
  },
  {
    accessorKey: "partNo",
    header: "Part No",
    cell: ({ row }) => {
      const partNo = row.getValue("partNo") as string;
      const partName = row.original.partName;
      return (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{partNo}</div>
          {partName && (
            <div className="text-xs text-muted-foreground truncate">
              {partName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "cycleTimeSec",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cycle Time (s)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const cycleTime = row.getValue("cycleTimeSec") as number;
      return <div className="text-right">{cycleTime}</div>;
    },
  },
  {
    accessorKey: "plannedQty",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Plan Qty (Pcs)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const qty = row.getValue("plannedQty") as number;
      return <div className="text-right">{qty.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "actualQty",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Actual Qty (Pcs)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const actualQty = row.getValue("actualQty") as number;
      return (
        <div className="text-right">
          <div>{actualQty.toLocaleString()}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "achievementPercent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Achv (%)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const percentage = row.getValue("achievementPercent") as number;
      return (
        <div className="text-right font-medium">
          <span className={percentage >= 100 ? "text-green-600" : percentage < 90 ? "text-red-600" : ""}>
            {percentage}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "ngQty",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          NG (Pcs)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const ngQty = row.getValue("ngQty") as number;
      return (
        <div className="text-right">
          <span className={ngQty > 0 ? "text-destructive font-medium" : ""}>
            {ngQty.toLocaleString()}
          </span>
        </div>
      );
    },
  },
];
