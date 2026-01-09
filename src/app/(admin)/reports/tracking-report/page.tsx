"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RefreshCw, Calendar as CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTrackingReport } from "@/server/reportService";
import { getPlants } from "@/server/plantService";
import { getLines } from "@/server/lineService";
import { getShifts } from "@/server/shiftService";
import { AchievementChart } from "@/components/reports/achievement-chart";
import { unitTrackingColumns } from "./unit-tracking-table-columns";
import { unitHistoryColumns } from "./unit-history-table-column";
import { unitParameterResultColumns } from "./unit-parameter-result-table-column";
import { DataTable } from "@/components/ui/data-table";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { exportToExcel, formatDataForExport } from "@/lib/excel";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function AchievementsReportPage() {
  useDocumentTitle("Achievement Report");

  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedUnitId, setSelectedUnitId] = useState<string | null >(null);
  const [selectedLineId, setSelectedLineId] = useState<string>("all");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("all");
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [lines, setLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [shifts, setShifts] = useState<
    Array<{ id: string; lineId: string; number: number }>
  >([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [inputId, setInputId] = useState<string>("");
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  // Fetch achievement report data with SWR
  const cacheKey = selectedUnitId
  ? `tracking-report-unit-${selectedUnitId}`
  : null;


  const shouldFetch = Boolean(selectedUnitId && selectedUnitId.trim());

  const { data: reportData, isLoading } = useSWR(
    cacheKey,
    async () => {
        const result = await getTrackingReport({
        unitId: selectedUnitId!,
        });

        return result.success
        ? { tableData: result.data, tableDataUnitHistory: result.dataUnitHistory, tableDataUnitParameterResult: result.dataUnitParameterResult}
        : { tableData: [], tableDataUnitHistory: [], tableDataUnitParameterResult: [] };
    },
    {
        revalidateOnFocus: false,
        keepPreviousData: true,
    }
  );


  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await mutate(cacheKey);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, [cacheKey]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      void handleRefresh();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, handleRefresh]);

  // Fetch plants
  useEffect(() => {
    async function fetchPlants() {
      try {
        const res = await getPlants({
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (res.success && res.plants) {
          const activePlants = res.plants
            .filter((p) => p.isActive)
            .map((p) => ({ id: p.id, name: p.name }));
          setPlants(activePlants);
        }
      } finally {
        setIsLoadingPlants(false);
      }
    }
    fetchPlants();
  }, []);

  const handlePlantFilterChange = (value: string) => {
    setSelectedUnitId(value);
    // Reset line and shift when plant changes
    if (value !== "all") {
      setSelectedLineId("all");
      setSelectedShiftId("all");
    }
  };

  const handleClearFilters = () => {
    setSelectedUnitId("all");
    setSelectedLineId("all");
    setSelectedShiftId("all");
  };

  const handleExport = () => {
    const toastId = toast.loading("Preparing export...");

    try {
      if (!reportData?.tableData || reportData.tableData.length === 0) {
        toast.error("No data available to export", { id: toastId });
        return;
      }

      const exportData = formatDataForExport(
        reportData.tableData,
        [], // No fields to exclude
        ["planDate", "createdAt", "updatedAt"], // Format date fields
      );

      const dateRange = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
      exportToExcel(
        exportData,
        `achievement-report-${dateRange}`,
        "Achievement Report",
      );

      toast.success(
        `Successfully exported ${reportData.tableData.length} records`,
        { id: toastId },
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred while exporting", { id: toastId });
    }
  };

  const hasActiveFilters =
    selectedUnitId !== "all" ||
    selectedLineId !== "all" ||
    selectedShiftId !== "all";

  // Format time ago
  const getTimeAgo = useCallback(() => {
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [lastRefresh]);

  const [timeAgo, setTimeAgo] = useState(getTimeAgo());

  // Update time ago every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo());
    }, 5000);
    return () => clearInterval(interval);
  }, [getTimeAgo]);

  const handleShow = () => {
    if (!inputId.trim()) return;
    setSelectedUnitId(inputId.trim());
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b bg-muted/40 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tracking Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Tracking report by Input ID with detailed production data
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Last refreshed: {timeAgo}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-none"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Select
              value={autoRefreshInterval.toString()}
              onValueChange={(value) => setAutoRefreshInterval(Number(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Auto refresh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="10">Every 10s</SelectItem>
                <SelectItem value="30">Every 30s</SelectItem>
                <SelectItem value="60">Every 1m</SelectItem>
                <SelectItem value="300">Every 5m</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Filters */}
        <Card>
        <CardContent className="pt-6">
            <div className="flex justify-center items-center h-24 border rounded p-4 bg-muted/50">
            <div className="flex items-center gap-2">
                <label htmlFor="unitId" className="text-sm font-medium">
                Unit ID
                </label>

                <Input
                id="unitId"
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Enter ID"
                className="w-40 border rounded px-2 py-1 text-center bg-white"
                />

                <button
                type="button"
                onClick={handleShow}
                disabled={!inputId.trim()}
                className="bg-gray-600 text-white px-4 py-1 rounded disabled:opacity-50"
                >
                SHOW
                </button>
            </div>
            </div>
        </CardContent>
        </Card>


        <Tabs defaultValue="part-tracking" className="w-full">
            <TabsList className="w-1/2">
                <TabsTrigger value="part-tracking" className="flex-1 gap-2">
                    Part Tracking
                </TabsTrigger>
                <TabsTrigger value="unit-history" className="flex-1">
                    Unit History
                </TabsTrigger>
                <TabsTrigger value="unit-parameter-result" className="flex-1">
                    Unit Parameter Result
                </TabsTrigger>
            </TabsList>
            <TabsContent value="part-tracking">
                {/* Achievement Table */}
                <Card>
                <CardHeader>
                    <CardTitle>Part Tracking</CardTitle>
                    <CardDescription>
                        Detailed part tracking data for the selected unit id
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                    ) : !reportData?.tableData || reportData.tableData.length === 0 ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <p className="text-muted-foreground">
                        No part tracking data found for selected unit id
                        </p>
                    </div>
                    ) : (
                    <DataTable
                        columns={unitTrackingColumns}
                        data={reportData.tableData}
                        showColumnToggle={true}
                        onExport={handleExport}
                        exportFilename="achievement-report"
                    />
                    )}
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="unit-history">
                {/* Achievement Table */}
                <Card>
                <CardHeader>
                    <CardTitle>Unit History</CardTitle>
                    <CardDescription>
                    Detailed unit history data for the selected unit id
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                    ) : !reportData?.tableDataUnitHistory || reportData.tableDataUnitHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <p className="text-muted-foreground">
                        No unit history data found for selected unit id
                        </p>
                    </div>
                    ) : (
                    <DataTable
                        columns={unitHistoryColumns}
                        data={reportData.tableDataUnitHistory}
                        showColumnToggle={true}
                        onExport={handleExport}
                        exportFilename="achievement-report"
                    />
                    )}
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="unit-parameter-result">
                {/* Achievement Table */}
                <Card>
                <CardHeader>
                    <CardTitle>Unit Parameter Result</CardTitle>
                    <CardDescription>
                    Detailed unit parameter result data for the selected unit id
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                    ) : !reportData?.tableDataUnitParameterResult || reportData.tableDataUnitParameterResult.length === 0 ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <p className="text-muted-foreground">
                        No unit parameter result data found for selected unit id
                        </p>
                    </div>
                    ) : (
                    <DataTable
                        columns={unitParameterResultColumns}
                        data={reportData.tableDataUnitParameterResult}
                        showColumnToggle={true}
                        onExport={handleExport}
                        exportFilename="achievement-report"
                    />
                    )}
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}