"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, TrendingUp } from "lucide-react";
import {
  getMonthlyAchievement,
  getTodayStatistics,
} from "@/server/reportService";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  unit?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  unit = "",
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              vs target
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AchievementStats({ plantId }: { plantId?: string }) {
  // Fetch monthly achievement with SWR
  const { data: monthlyData } = useSWR(
    `monthly-achievement-${plantId ?? "all"}`,
    async () => {
      const result = await getMonthlyAchievement({ plantId });
      return result;
    },
  );

  // Fetch today's statistics with SWR
  const { data: todayData } = useSWR(
    `today-statistics-${plantId ?? "all"}`,
    async () => {
      const result = await getTodayStatistics({ plantId });
      return result;
    },
  );

  const monthlyPlanned = monthlyData?.plannedQty || 0;
  const monthlyActual = monthlyData?.actualQty || 0;
  const todayPlanned = todayData?.achievement.plannedQty || 0;
  const todayActual = todayData?.achievement.actualQty || 0;
  const todayLossTimeSec = todayData?.lossTimeSec || 0;
  const todayRejectQty = todayData?.rejectQty || 0;

  // Calculate achievement percentages
  const monthlyAchievementPercent =
    monthlyPlanned > 0
      ? Number(((monthlyActual / monthlyPlanned) * 100).toFixed(1))
      : 0;
  const todayAchievementPercent =
    todayPlanned > 0
      ? Number(((todayActual / todayPlanned) * 100).toFixed(1))
      : 0;

  // Convert loss time to hours and minutes
  const lossTimeHours = Math.floor(todayLossTimeSec / 3600);
  const lossTimeMinutes = Math.floor((todayLossTimeSec % 3600) / 60);
  const lossTimeDisplay =
    lossTimeHours > 0
      ? `${lossTimeHours}h ${lossTimeMinutes}m`
      : `${lossTimeMinutes}m`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Monthly Achievement"
        value={monthlyActual}
        subtitle={`Target: ${monthlyPlanned.toLocaleString()} pcs (${monthlyAchievementPercent}%)`}
        trend={
          monthlyPlanned > 0
            ? {
                value: Number((monthlyAchievementPercent - 100).toFixed(1)),
                isPositive: monthlyActual >= monthlyPlanned,
              }
            : undefined
        }
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        unit="pcs"
      />

      <StatsCard
        title="Today Achievement"
        value={todayActual}
        subtitle={`Target: ${todayPlanned.toLocaleString()} pcs (${todayAchievementPercent}%)`}
        trend={
          todayPlanned > 0
            ? {
                value: Number((todayAchievementPercent - 100).toFixed(1)),
                isPositive: todayActual >= todayPlanned,
              }
            : undefined
        }
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        unit="pcs"
      />

      <StatsCard
        title="Today Loss Time"
        value={lossTimeDisplay}
        subtitle={`Total unplanned downtime`}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
            aria-label="Clock icon"
          >
            <title>Clock</title>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />

      <StatsCard
        title="Today Reject"
        value={todayRejectQty}
        subtitle="Total rejected products"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
            aria-label="Error icon"
          >
            <title>Error</title>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        }
        unit="pcs"
      />
    </div>
  );
}
