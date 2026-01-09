"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type UnitTrackingData = {
  id: string;
  unitId: string;
  plantName: string;
  lineName: string;
  partNo: string;
  partName?: string;
  previousStation: string;
  currentStation: string;
  nextStation: string;
  moveInTime: Date;
  moveOutTime?: Date | null;
};

export const unitTrackingColumns: ColumnDef<UnitTrackingData>[] = [
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
    accessorKey: "previousStation",
    header: "Previous Station",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("previousStation")}</Badge>,
  },
  {
    accessorKey: "currentStation",
    header: "Current Station",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("currentStation")}</Badge>,
  },
  {
    accessorKey: "nextStation",
    header: "Next Station",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("nextStation")}</Badge>,
  },
  {
    accessorKey: "moveInTime",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Move In Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
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
];