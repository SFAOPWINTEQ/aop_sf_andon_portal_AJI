"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type UnitHistoryData = {
  id: string;
  unitId: string;
  plantName: string;
  lineName: string;
  partNo: string;
  partName?: string;

  operatorNpk?: string | null;
  
  machineName: string;
  sequence: string;

  cycleTimeSec: string;
  result: string;
  
  moveInTime: Date;
  moveOutTime?: Date | null;
};

export const unitHistoryColumns: ColumnDef<UnitHistoryData>[] = [
  {
    accessorKey: "unitId",
    header: "Unit ID",
    cell: ({ row }) => (
      <div className="font-mono font-medium">{row.getValue("unitId")}</div>
    ),
  },
  {
    accessorKey: "partNo",
    header: "Part Name",
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
    accessorKey: "lineName",
    header: "Line",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono">
        {row.getValue<string>("lineName") || "-"}
      </Badge>
    ),
  },
  {
    accessorKey: "machineName",
    header: "Station",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("machineName")} -  #{row.original.sequence}</Badge>,
  },
  {
    accessorKey: "userNpk",
    header: "Operator ID",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("userNpk")}</Badge>,
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("result")}</Badge>,
  },
  {
    accessorKey: "moveInTime",
    header: "Move In Time",
    cell: ({ row }) =>
      new Date(row.getValue("moveInTime")).toLocaleString(),
  },
  {
    accessorKey: "moveOutTime",
    header: "Move Out Time",
    cell: ({ row }) => {
      const date = row.getValue("moveOutTime") as Date | null;
      return date ? new Date(date).toLocaleString() : "—";
    }
  },
  {
    accessorKey: "cycleTimeSec",
    header: "Cycle Time (s)",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("cycleTimeSec")}</Badge>,
  }
];