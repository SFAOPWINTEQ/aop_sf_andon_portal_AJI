"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export type StatusLineData = {
  id: string;
  lineName: string;
  plantName: string;
  status: string;
  workOrderNo: string;
  partNo: string;
  partName: string;
  shiftNumber: number;
  plannedQty: number;
  actualQty: number;
  lossTimeMin: number;
  ngQty: number;
  sequence: number;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "OPEN":
      return <Badge variant="outline">Open</Badge>;
    case "RUNNING":
      return <Badge className="bg-blue-500">Running</Badge>;
    case "CLOSED":
      return <Badge className="bg-green-500">Closed</Badge>;
    case "CANCELED":
      return <Badge variant="destructive">Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const statusLineColumns: ColumnDef<StatusLineData>[] = [
  {
    accessorKey: "plantName",
    header: "Plant",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("plantName")}</div>
    ),
  },
  {
    accessorKey: "lineName",
    header: "Line",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("lineName")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("status")),
  },
  {
    accessorKey: "workOrderNo",
    header: "WO No",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("workOrderNo")}</div>
    ),
  },
  {
    accessorKey: "partNo",
    header: "Part No",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("partNo")}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.partName}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "plannedQty",
    header: "Plan Qty",
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.getValue<number>("plannedQty").toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "actualQty",
    header: "Actual Qty",
    cell: ({ row }) => {
      const actual = row.getValue<number>("actualQty");
      const planned = row.original.plannedQty;
      const percentage = planned > 0 ? (actual / planned) * 100 : 0;
      const isGood = percentage >= 90;

      return (
        <div className="text-right">
          <div
            className={`font-mono ${isGood ? "text-green-600" : "text-amber-600"}`}
          >
            {actual.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}%
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "lossTimeMin",
    header: "Loss Time",
    cell: ({ row }) => {
      const minutes = row.getValue<number>("lossTimeMin");
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      return (
        <div className="text-right">
          {hours > 0 ? (
            <div className="font-mono">
              {hours}h {mins}m
            </div>
          ) : (
            <div className="font-mono">{mins}m</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "ngQty",
    header: "NG Qty",
    cell: ({ row }) => {
      const ngQty = row.getValue<number>("ngQty");
      const isHigh = ngQty > 0;

      return (
        <div className={`text-right font-mono ${isHigh ? "text-red-600" : ""}`}>
          {ngQty.toLocaleString()}
        </div>
      );
    },
  },
];
