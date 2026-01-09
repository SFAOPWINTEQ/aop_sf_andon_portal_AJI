"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientFormatDateTimeMedium } from "@/lib/date";

export type ProductionPlan = {
  id: string;
  workOrderNo: string;
  planDate: Date;
  lineId: string;
  lineName?: string;
  plantName?: string;
  shiftId: string;
  shiftNumber?: number;
  partId: string;
  partNo?: string;
  partName?: string;
  cycleTimeSec: number;
  plannedQty: number;
  actualQty: number;
  ngQty: number;
  sequence: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdById: string | null;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface ProductionPlanColumnsProps {
  onEdit: (plan: ProductionPlan) => void;
  onDelete: (plan: ProductionPlan) => void;
}

const getStatusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "RUNNING":
      return "default";
    case "CLOSED":
      return "secondary";
    case "CANCELED":
      return "destructive";
    default:
      return "outline";
  }
};

export const getProductionPlanColumns = ({
  onEdit,
  onDelete,
}: ProductionPlanColumnsProps): ColumnDef<ProductionPlan>[] => [
  {
    accessorKey: "workOrderNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Work Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const workOrderNo = row.getValue("workOrderNo") as string;
      const plan = row.original;
      return (
        <Link
          href={`/schedule/${plan.id}`}
          className="font-medium text-primary hover:underline"
        >
          {workOrderNo}
        </Link>
      );
    },
  },
  {
    accessorKey: "planDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Plan Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("planDate") as Date;
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
    accessorKey: "plantName",
    header: "Plant",
    cell: ({ row }) => {
      const plantName = row.getValue("plantName") as string | undefined;
      return (
        <Badge variant="secondary" className="font-normal">
          {plantName || "N/A"}
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
    accessorKey: "sequence",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Seq
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const sequence = row.getValue("sequence") as number;
      return <div className="text-center font-medium">#{sequence}</div>;
    },
  },
  {
    accessorKey: "partNo",
    header: "Part",
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
    accessorKey: "plannedQty",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Planned
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
    header: "Actual",
    cell: ({ row }) => {
      const actualQty = row.getValue("actualQty") as number;
      const plannedQty = row.original.plannedQty;
      const percentage =
        plannedQty > 0 ? ((actualQty / plannedQty) * 100).toFixed(1) : "0";
      return (
        <div className="text-right">
          <div>{actualQty.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{percentage}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: "ngQty",
    header: "NG",
    cell: ({ row }) => {
      const ngQty = row.getValue("ngQty") as number;
      return (
        <div className="text-right">
          {ngQty > 0 ? (
            <Badge variant="destructive" className="font-normal">
              {ngQty.toLocaleString()}
            </Badge>
          ) : (
            <span className="text-muted-foreground">0</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={getStatusVariant(status)} className="font-normal">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "cycleTimeSec",
    header: "Cycle Time",
    cell: ({ row }) => {
      const seconds = row.getValue("cycleTimeSec") as number;
      return <div className="text-sm">{seconds}s</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-muted-foreground">
          {clientFormatDateTimeMedium(date)}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const plan = row.original;
      const canEdit = plan.status === "OPEN";
      const canDelete = plan.status === "OPEN" || plan.status === "CANCELED";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(plan.id)}
            >
              Copy plan ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(plan.workOrderNo)}
            >
              Copy work order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/schedule/${plan.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit plan
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(plan)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete plan
              </DropdownMenuItem>
            )}
            {!canEdit && !canDelete && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground text-xs">
                  No actions available
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
