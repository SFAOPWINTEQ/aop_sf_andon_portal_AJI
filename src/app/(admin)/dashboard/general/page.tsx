"use client";

import { useState, useEffect, useCallback } from "react";
import { mutate } from "swr";
import { AchievementStats } from "@/components/reports/achievement-stats";
import { DailyAchievementChart } from "@/components/reports/daily-achievement-chart";
import { HourlyAchievementChart } from "@/components/reports/hourly-achievement-chart";
import { PerformanceEfficiencyChart } from "@/components/reports/performance-efficiency-chart";
import { OEEChart } from "@/components/reports/oee-chart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { getPlants } from "@/server/plantService";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 means off
  const [selectedPlantId, setSelectedPlantId] = useState<string>("all");
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Mutate all SWR cache keys used in dashboard
    await Promise.all([
      mutate(
        (key) =>
          typeof key === "string" && key.startsWith("monthly-achievement"),
      ),
      mutate(
        (key) => typeof key === "string" && key.startsWith("today-statistics"),
      ),
      mutate("active-lines"),
      mutate(
        (key) => typeof key === "string" && key.startsWith("daily-achievement"),
      ),
      mutate(
        (key) =>
          typeof key === "string" && key.startsWith("hourly-achievement"),
      ),
      mutate(
        (key) =>
          typeof key === "string" && key.startsWith("performance-efficiency"),
      ),
      mutate((key) => typeof key === "string" && key.startsWith("oee-chart")),
    ]);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshInterval === 0) return;

    const interval = setInterval(() => {
      // call the current refresh handler
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

  // Format time ago
  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const [timeAgo, setTimeAgo] = useState(getTimeAgo());

  // Update time ago every second
  useEffect(() => {
    // Recompute on lastRefresh change
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
          setTimeAgo(`${minutes}m ago`);
        } else {
          const hours = Math.floor(minutes / 60);
          setTimeAgo(`${hours}h ago`);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b bg-muted/40 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Production Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time production monitoring and analytics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Last refreshed: {timeAgo}
            </span>
            <Select value={selectedPlantId} onValueChange={setSelectedPlantId}>
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
        {/* Stats Cards */}
        <AchievementStats
          plantId={selectedPlantId === "all" ? undefined : selectedPlantId}
        />

        {/* Daily Achievement Chart */}
        <div className="overflow-x-auto">
          <DailyAchievementChart
            plantId={selectedPlantId === "all" ? undefined : selectedPlantId}
          />
        </div>

        {/* Hourly Achievement Chart */}
        <div className="overflow-x-auto">
          <HourlyAchievementChart
            plantId={selectedPlantId === "all" ? undefined : selectedPlantId}
          />
        </div>

        {/* Performance Efficiency Chart */}
        <div className="overflow-x-auto">
          <PerformanceEfficiencyChart
            plantId={selectedPlantId === "all" ? undefined : selectedPlantId}
          />
        </div>

        {/* OEE Chart */}
        <div className="overflow-x-auto">
          <OEEChart
            plantId={selectedPlantId === "all" ? undefined : selectedPlantId}
          />
        </div>
      </div>
    </div>
  );
}
