"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export interface ParetoLossTimeTableData {
  id: string;
  date: Date;
  workOrderNo: string;
  plantName: string;
  lineName: string;
  shiftNumber: number;
  partNo: string;
  partName: string;
  department: string;
  machineName: string;
  category: string;
  detail: string;
  kind: string;
  startTime: Date;
  endTime: Date | null;
  lossTimeSec: number;
  lossTimeMin: number;
}

export const paretoLossTimeTableColumns: ColumnDef<ParetoLossTimeTableData>[] =
  [
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
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "machineName",
      header: "Machine",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const kind = row.original.kind;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={kind === "PDT" ? "secondary" : "destructive"}>
              {kind}
            </Badge>
            <span className="text-sm">{row.getValue("category")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "detail",
      header: "Detail",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("detail")}
        </span>
      ),
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {format(new Date(row.getValue("startTime")), "HH:mm:ss")}
        </span>
      ),
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => {
        const endTime = row.getValue("endTime");
        return endTime ? (
          <span className="font-mono text-xs">
            {format(new Date(endTime as Date), "HH:mm:ss")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Ongoing</span>
        );
      },
    },
    {
      accessorKey: "lossTimeMin",
      header: "Loss Time (min)",
      cell: ({ row }) => (
        <span className="font-bold text-red-600 dark:text-red-400">
          {row.getValue<number>("lossTimeMin").toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "lossTimeSec",
      header: "Loss Time (sec)",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue<number>("lossTimeSec").toLocaleString()}
        </span>
      ),
    },
  ];
