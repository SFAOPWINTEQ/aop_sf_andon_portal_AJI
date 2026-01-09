"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type UnitParameterResultData = {
  id: string;
  unitId: string;
  plantName: string;
  lineName: string;
  partNo: string;
  partName?: string;
  
  machineName: string;
  sequence: string;

  value: string;

  parameterName: string;
  parameterUnit: string;
};

export const unitParameterResultColumns: ColumnDef<UnitParameterResultData>[] = [
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
    accessorKey: "parameterName",
    header: "Parameter",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("parameterName")}</Badge>,
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("value")}</Badge>,
  },
  {
    accessorKey: "parameterUnit",
    header: "Unit",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("parameterUnit")}</Badge>,
  }
];