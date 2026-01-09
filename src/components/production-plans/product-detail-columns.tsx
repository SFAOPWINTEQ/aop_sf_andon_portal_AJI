"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type ProductDetail = {
  id: string;
  sequenceNo: number;
  completedAt: Date;
  cycleTimeSec: number | null;
  isGood: boolean;
};

export const productDetailColumns: ColumnDef<ProductDetail>[] = [
  {
    accessorKey: "sequenceNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sequence No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const sequenceNo = row.getValue("sequenceNo") as number;
      return <div className="text-center font-medium">#{sequenceNo}</div>;
    },
  },
  {
    accessorKey: "completedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Completed At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("completedAt") as Date;
      return (
        <div className="text-sm">
          {new Date(date).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
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
          className="w-full justify-start"
        >
          Cycle Time (s)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const cycleTime = row.getValue("cycleTimeSec") as number | null;
      return (
        <div className="text-left font-mono">
          {cycleTime !== null ? cycleTime.toFixed(2) : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "isGood",
    header: "Status",
    cell: ({ row }) => {
      const isGood = row.getValue("isGood") as boolean;
      return (
        <Badge variant={isGood ? "default" : "destructive"}>
          {isGood ? "Good" : "NG"}
        </Badge>
      );
    },
  },
];
