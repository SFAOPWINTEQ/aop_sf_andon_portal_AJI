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
import { getAchievementReport } from "@/server/reportService";
import { getPlants } from "@/server/plantService";
import { getLines } from "@/server/lineService";
import { getShifts } from "@/server/shiftService";
import { AchievementChart } from "@/components/reports/achievement-chart";
import { achievementTableColumns } from "./achievement-table-columns";
import { DataTable } from "@/components/ui/data-table";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { exportToExcel, formatDataForExport } from "@/lib/excel";

export default function AchievementsReportPage() {
  useDocumentTitle("Achievement Report");

  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");
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
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  // Fetch achievement report data with SWR
  const cacheKey = useMemo(
    () =>
      `achievement-report-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}-${selectedPlantId}-${selectedLineId}-${selectedShiftId}`,
    [startDate, endDate, selectedPlantId, selectedLineId, selectedShiftId],
  );

  const { data: reportData, isLoading } = useSWR(cacheKey, async () => {
    const result = await getAchievementReport({
      startDate,
      endDate,
      plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
      lineId: selectedLineId === "all" ? undefined : selectedLineId,
      shiftId: selectedShiftId === "all" ? undefined : selectedShiftId,
    });
    return result.success
      ? { chartData: result.chartData, tableData: result.tableData }
      : { chartData: [], tableData: [] };
  });

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

  // Fetch filter data (lines and shifts)
  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [linesResult, shiftsResult] = await Promise.all([
          getLines({ page: 1, limit: 1000, sortBy: "name", sortOrder: "asc" }),
          getShifts({
            page: 1,
            limit: 1000,
            sortBy: "number",
            sortOrder: "asc",
          }),
        ]);

        if (linesResult.success && linesResult.lines) {
          const activeLines = linesResult.lines
            .filter((line) => line.isActive)
            .map((line) => ({
              id: line.id,
              name: line.name,
              plantId: line.plantId,
            }));
          setLines(activeLines);
        }

        if (shiftsResult.success && shiftsResult.shifts) {
          setShifts(
            shiftsResult.shifts.map((shift) => ({
              id: shift.id,
              lineId: shift.lineId,
              number: shift.number,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setIsLoadingFilters(false);
      }
    }

    fetchFilterData();
  }, []);

  // Filter lines based on selected plant
  const availableLines = lines.filter(
    (line) => line.plantId === selectedPlantId || selectedPlantId === "all",
  );

  // Filter shifts based on selected line
  const availableShifts = shifts.filter(
    (shift) => shift.lineId === selectedLineId || selectedLineId === "all",
  );

  const handlePlantFilterChange = (value: string) => {
    setSelectedPlantId(value);
    // Reset line and shift when plant changes
    if (value !== "all") {
      setSelectedLineId("all");
      setSelectedShiftId("all");
    }
  };

  const handleLineFilterChange = (value: string) => {
    setSelectedLineId(value);
    // Reset shift when line changes
    if (value !== "all") {
      setSelectedShiftId("all");
    }
  };

  const handleShiftFilterChange = (value: string) => {
    setSelectedShiftId(value);
  };

  const handleClearFilters = () => {
    setSelectedPlantId("all");
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
    selectedPlantId !== "all" ||
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

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b bg-muted/40 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Production Achievements
            </h1>
            <p className="text-sm text-muted-foreground">
              Achievement report by date and shift with detailed production data
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Last refreshed: {timeAgo}
            </span>
            <Select
              value={selectedPlantId}
              onValueChange={handlePlantFilterChange}
              disabled={isLoadingPlants}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={
                    isLoadingPlants ? "Loading plants..." : "All plants"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plants</SelectItem>
                {plants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Filters</h3>
              </div>
              <div className="space-y-3">
                {/* Date Range */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Start Date
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            if (date) {
                              setStartDate(date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      End Date
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            if (date) {
                              setEndDate(date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Other Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={selectedPlantId}
                    onValueChange={handlePlantFilterChange}
                    disabled={isLoadingPlants}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue
                        placeholder={
                          isLoadingPlants ? "Loading plants..." : "All plants"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plants</SelectItem>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedLineId}
                    onValueChange={handleLineFilterChange}
                    disabled={isLoadingFilters || selectedPlantId === "all"}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue
                        placeholder={
                          isLoadingFilters ? "Loading lines..." : "All lines"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Lines</SelectItem>
                      {availableLines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedShiftId}
                    onValueChange={handleShiftFilterChange}
                    disabled={isLoadingFilters || selectedLineId === "all"}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All shifts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shifts</SelectItem>
                      {availableShifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          Shift {shift.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="w-full sm:w-auto"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Chart */}
        <AchievementChart
          data={reportData?.chartData || []}
          isLoading={isLoading}
        />

        {/* Achievement Table */}
        <Card>
          <CardHeader>
            <CardTitle>Achievement Details</CardTitle>
            <CardDescription>
              Detailed production data for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !reportData?.tableData || reportData.tableData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">
                  No production data found for selected period
                </p>
              </div>
            ) : (
              <DataTable
                columns={achievementTableColumns}
                data={reportData.tableData}
                showColumnToggle={true}
                onExport={handleExport}
                exportFilename="achievement-report"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
