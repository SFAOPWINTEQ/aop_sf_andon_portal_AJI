"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import type { SortingState } from "@tanstack/react-table";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  Target,
  Edit,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductionPlanForm } from "@/components/production-plans/production-plan-form";
import {
  getProductionPlanById,
  deleteProductionPlan,
} from "@/server/productionPlanService";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DataTable } from "@/components/ui/data-table";
import {
  productDetailColumns,
  type ProductDetail,
} from "@/components/production-plans/product-detail-columns";

type ProductionPlanDetail = {
  id: string;
  workOrderNo: string;
  planDate: Date;
  lineId: string;
  lineName?: string;
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
  createdAt: Date;
  updatedAt: Date;
  productDetails?: ProductDetail[];
};

export default function ProductionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [plan, setPlan] = useState<ProductionPlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Server-side state for ProductDetails table
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsPageSize, setDetailsPageSize] = useState(10);
  const [detailsSearchFilters, setDetailsSearchFilters] = useState<
    SearchFilter[]
  >([]);
  const [detailsSorting, setDetailsSorting] = useState<SortingState>([
    { id: "sequenceNo", desc: false },
  ]);

  useDocumentTitle(
    plan ? `${plan.workOrderNo} - Detail` : "Production Plan Detail",
  );

  useEffect(() => {
    if (!id) return;

    async function fetchPlan() {
      try {
        const result = await getProductionPlanById(id);

        if (result.success && result.productionPlan) {
          setPlan(result.productionPlan as ProductionPlanDetail);
        } else {
          toast.error(result.message || "Failed to load production plan");
          router.push("/schedule");
        }
      } catch (error) {
        console.error("Error fetching production plan:", error);
        toast.error("An error occurred while loading production plan");
        router.push("/schedule");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlan();
  }, [id, router]);

  const handleDelete = async () => {
    if (!plan) return;

    setIsDeleting(true);
    try {
      const result = await deleteProductionPlan(plan.id);

      if (result.success) {
        toast.success(result.message || "Production plan deleted successfully");
        router.push("/schedule");
      } else {
        toast.error(result.message || "Failed to delete production plan");
      }
    } catch (error) {
      console.error("Error deleting production plan:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleEditSuccess = async () => {
    setShowEditDialog(false);
    // Refresh the plan data
    if (!id) return;

    try {
      const result = await getProductionPlanById(id);
      if (result.success && result.productionPlan) {
        setPlan(result.productionPlan as ProductionPlanDetail);
        toast.success("Production plan updated successfully");
      }
    } catch (error) {
      console.error("Error refreshing plan:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { label: "Open", variant: "secondary" as const, icon: PauseCircle },
      RUNNING: {
        label: "Running",
        variant: "default" as const,
        icon: PlayCircle,
      },
      CLOSED: {
        label: "Closed",
        variant: "outline" as const,
        icon: CheckCircle2,
      },
      CANCELED: {
        label: "Canceled",
        variant: "destructive" as const,
        icon: XCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateProgress = () => {
    if (!plan) return 0;
    return Math.min(100, Math.round((plan.actualQty / plan.plannedQty) * 100));
  };

  const calculateEfficiency = () => {
    if (!plan || plan.actualQty === 0) return 0;
    const goodQty = plan.actualQty - plan.ngQty;
    return Math.round((goodQty / plan.actualQty) * 100);
  };

  const handleDetailsPaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setDetailsPage(newPagination.pageIndex + 1);
    setDetailsPageSize(newPagination.pageSize);
  };

  const handleDetailsSearchFiltersChange = (filters: SearchFilter[]) => {
    setDetailsSearchFilters(filters);
    setDetailsPage(1);
  };

  const handleDetailsSortingChange = (newSorting: SortingState) => {
    setDetailsSorting(newSorting);
    setDetailsPage(1);
  };

  // Extract sort parameters for ProductDetails
  const detailsSortBy =
    detailsSorting.length > 0 ? detailsSorting[0].id : "sequenceNo";
  const detailsSortOrder =
    detailsSorting.length > 0
      ? detailsSorting[0].desc
        ? "desc"
        : "asc"
      : "asc";

  // Client-side pagination and filtering for ProductDetails
  const getFilteredProductDetails = () => {
    if (!plan?.productDetails) return [];

    let filtered = [...plan.productDetails];

    // Apply search filters
    if (detailsSearchFilters.length > 0) {
      filtered = filtered.filter((detail) => {
        return detailsSearchFilters.every((filter) => {
          const value = detail[filter.column as keyof ProductDetail];
          if (value === null || value === undefined) return false;

          // Special handling for isGood boolean field
          if (filter.column === "isGood") {
            const displayValue = value ? "good" : "ng";
            const filterValue = filter.value.toLowerCase();

            switch (filter.operator) {
              case "equals":
                return displayValue === filterValue;
              case "contains":
                return displayValue.includes(filterValue);
              case "startsWith":
                return displayValue.startsWith(filterValue);
              case "endsWith":
                return displayValue.endsWith(filterValue);
              default:
                return displayValue.includes(filterValue);
            }
          }

          const stringValue = String(value).toLowerCase();
          const filterValue = filter.value.toLowerCase();

          switch (filter.operator) {
            case "equals":
              return stringValue === filterValue;
            case "contains":
              return stringValue.includes(filterValue);
            case "startsWith":
              return stringValue.startsWith(filterValue);
            case "endsWith":
              return stringValue.endsWith(filterValue);
            case "gt":
              return Number(value) > Number(filter.value);
            case "gte":
              return Number(value) >= Number(filter.value);
            case "lt":
              return Number(value) < Number(filter.value);
            case "lte":
              return Number(value) <= Number(filter.value);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[detailsSortBy as keyof ProductDetail];
      const bValue = b[detailsSortBy as keyof ProductDetail];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return detailsSortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue);
      const bString = String(bValue);
      const comparison = aString.localeCompare(bString);
      return detailsSortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredDetails = getFilteredProductDetails();
  const totalDetails = filteredDetails.length;
  const detailsPageCount = Math.ceil(totalDetails / detailsPageSize);
  const paginatedDetails = filteredDetails.slice(
    (detailsPage - 1) * detailsPageSize,
    detailsPage * detailsPageSize,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const progress = calculateProgress();
  const efficiency = calculateEfficiency();

  return (
    <div className="flex flex-col p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/schedule")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {plan.workOrderNo}
            </h1>
            <p className="text-muted-foreground">Production Plan Details</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowEditDialog(true)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div>{getStatusBadge(plan.status)}</div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Production Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Production Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Part Number</p>
              <p className="text-lg font-semibold">{plan.partNo || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Part Name</p>
              <p className="text-base">{plan.partName || "-"}</p>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sequence</span>
              <span className="font-medium">#{plan.sequence}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cycle Time</span>
              <span className="font-medium">{plan.cycleTimeSec}s</span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Schedule Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan Date</p>
              <p className="text-lg font-semibold">
                {formatDate(plan.planDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Line</p>
              <p className="text-base">{plan.lineName || "-"}</p>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shift</span>
              <span className="font-medium">Shift {plan.shiftNumber}</span>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Started At</p>
              <p className="text-base">{formatDateTime(plan.startedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed At</p>
              <p className="text-base">{formatDateTime(plan.completedAt)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDateTime(plan.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quantity & Progress Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Planned Quantity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-blue-500" />
              Planned Qty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {plan.plannedQty.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Target production
            </p>
          </CardContent>
        </Card>

        {/* Actual Quantity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Actual Qty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {plan.actualQty.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {progress}% of target
            </p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* NG Quantity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <XCircle className="h-4 w-4 text-red-500" />
              NG Qty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {plan.ngQty.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {plan.actualQty > 0
                ? `${((plan.ngQty / plan.actualQty) * 100).toFixed(1)}% rejection rate`
                : "No production yet"}
            </p>
          </CardContent>
        </Card>

        {/* Quality Efficiency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{efficiency}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {plan.actualQty - plan.ngQty} good units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Details</CardTitle>
          <CardDescription>
            {plan.productDetails && plan.productDetails.length > 0
              ? `Individual product tracking (${plan.productDetails.length} units completed)`
              : "No production details recorded yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan.productDetails && plan.productDetails.length > 0 ? (
            <DataTable
              columns={productDetailColumns}
              data={paginatedDetails}
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "sequenceNo", label: "Sequence No", type: "number" },
                { id: "completedAt", label: "Completed At", type: "date" },
                { id: "cycleTimeSec", label: "Cycle Time", type: "number" },
                { id: "isGood", label: "Status", type: "string" },
              ]}
              searchFilters={detailsSearchFilters}
              onSearchFiltersChange={handleDetailsSearchFiltersChange}
              searchPlaceholder="Enter search value..."
              pageCount={detailsPageCount}
              pageIndex={detailsPage - 1}
              pageSize={detailsPageSize}
              onPaginationChange={handleDetailsPaginationChange}
              sorting={detailsSorting}
              onSortingChange={handleDetailsSortingChange}
              isLoading={false}
              totalCount={totalDetails}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Production details will appear here once units start being
                produced
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Timestamps and metadata</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Created At
            </p>
            <p className="text-sm mt-1">{formatDateTime(plan.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Last Updated
            </p>
            <p className="text-sm mt-1">{formatDateTime(plan.updatedAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plan ID</p>
            <p className="text-sm mt-1 font-mono">{plan.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="mt-1">{getStatusBadge(plan.status)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Production Plan</DialogTitle>
            <DialogDescription>
              Update production plan details for {plan.workOrderNo}
            </DialogDescription>
          </DialogHeader>
          <ProductionPlanForm
            initialData={{
              id: plan.id,
              workOrderNo: plan.workOrderNo,
              planDate: plan.planDate,
              lineId: plan.lineId,
              shiftId: plan.shiftId,
              partId: plan.partId,
              cycleTimeSec: plan.cycleTimeSec,
              plannedQty: plan.plannedQty,
              sequence: plan.sequence,
              status: plan.status,
            }}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the production plan "
              {plan.workOrderNo}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
