"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  getPerformanceByDateRange,
  getActiveLines,
} from "@/server/reportService";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export function PerformanceEfficiencyChart({ plantId }: { plantId?: string }) {
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [dateRange, setDateRange] = useState<number>(30); // days

  // Fetch lines with SWR
  const { data: linesData } = useSWR("active-lines", async () => {
    const result = await getActiveLines();
    return result.success ? result.lines : [];
  });

  // Calculate date range
  const startDate = useMemo(
    () => startOfDay(subDays(new Date(), dateRange)),
    [dateRange],
  );
  const endDate = useMemo(() => endOfDay(new Date()), []);

  // Fetch chart data with SWR
  const cacheKey = useMemo(
    () =>
      `performance-efficiency-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}-${selectedLine}-${plantId ?? "all"}`,
    [startDate, endDate, selectedLine, plantId],
  );

  const { data: chartData, isLoading } = useSWR(cacheKey, async () => {
    const result = await getPerformanceByDateRange({
      startDate,
      endDate,
      lineId: selectedLine === "all" ? undefined : selectedLine,
      plantId,
    });

    if (result.success) {
      return result.data.map((item) => ({
        ...item,
        date: format(new Date(item.date), "MMM dd"),
      }));
    }
    return [];
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Performance Efficiency</CardTitle>
            <CardDescription>
              Actual vs Planned Output Performance (%)
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={dateRange.toString()}
              onValueChange={(value) => setDateRange(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLine} onValueChange={setSelectedLine}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Select line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {linesData?.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : !chartData || chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="w-full min-w-[300px]">
            <ResponsiveContainer
              width="100%"
              height={300}
              className="sm:!h-[400px]"
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <defs>
                  <linearGradient
                    id="colorPerformance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  domain={[0, 150]}
                  label={{
                    value: "Performance (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <Card className="shadow-lg">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-2">{label}</p>
                          <div className="space-y-1">
                            {payload.map((entry, index) => (
                              <div
                                key={`${String((entry && (entry as { dataKey?: string; name?: string }).dataKey) || (entry as { name?: string }).name || index)}`}
                                className="flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {entry.name}:
                                  </span>
                                </div>
                                <span className="text-sm font-medium">
                                  {entry.name === "Performance"
                                    ? `${entry.value}%`
                                    : `${entry.value} pcs`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                />
                <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                <ReferenceLine
                  y={100}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{ value: "Target (100%)", position: "right" }}
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Performance"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
