"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { format } from "date-fns";
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
import { DataTable } from "@/components/ui/data-table";
import { RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusLineReport } from "@/server/reportService";
import { getPlants } from "@/server/plantService";
import { statusLineColumns } from "./status-line-columns";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function StatusLinePage() {
  useDocumentTitle("Status Line Statistics");

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 means off

  // Fetch status line data with SWR
  const cacheKey = useMemo(
    () =>
      `status-line-${format(selectedDate, "yyyy-MM-dd")}-${selectedPlantId}`,
    [selectedDate, selectedPlantId],
  );

  const { data: reportData, isLoading } = useSWR(cacheKey, async () => {
    const result = await getStatusLineReport({
      date: selectedDate,
      plantId: selectedPlantId === "all" ? undefined : selectedPlantId,
    });
    return result.success ? result.data : [];
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
      handleRefresh();
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
            <h1 className="text-2xl font-bold tracking-tight">Status Line</h1>
            <p className="text-sm text-muted-foreground">
              Real-time production line status and performance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Last refreshed: {timeAgo}
            </span>
            <Select
              value={selectedPlantId}
              onValueChange={setSelectedPlantId}
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
      <div className="flex-1 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Production Status</CardTitle>
                <CardDescription>
                  View production plans and line status for selected date
                </CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : !reportData || reportData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">
                  No production plans found for selected date
                </p>
              </div>
            ) : (
              <DataTable
                columns={statusLineColumns}
                data={reportData}
                showColumnToggle={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
