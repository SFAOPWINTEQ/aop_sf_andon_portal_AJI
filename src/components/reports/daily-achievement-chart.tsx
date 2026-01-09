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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getDailyAchievementByMonth,
  getActiveLines,
} from "@/server/reportService";
import { format, startOfMonth } from "date-fns";
import { CustomChartTooltip } from "./custom-chart-tooltip";

export function DailyAchievementChart({ plantId }: { plantId?: string }) {
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Fetch lines with SWR
  const { data: linesData } = useSWR("active-lines", async () => {
    const result = await getActiveLines();
    return result.success ? result.lines : [];
  });

  // Fetch chart data with SWR
  const cacheKey = useMemo(
    () =>
      `daily-achievement-${format(selectedMonth, "yyyy-MM")}-${selectedLine}-${plantId ?? "all"}`,
    [selectedMonth, selectedLine, plantId],
  );

  const { data: chartData, isLoading } = useSWR(cacheKey, async () => {
    const result = await getDailyAchievementByMonth({
      month: selectedMonth,
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

  // Generate month options (last 6 months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return startOfMonth(date);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Daily Achievement</CardTitle>
            <CardDescription>Plan vs Actual Production by Day</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={format(selectedMonth, "yyyy-MM")}
              onValueChange={(value) => setSelectedMonth(new Date(value))}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem
                    key={month.toISOString()}
                    value={format(month, "yyyy-MM")}
                  >
                    {format(month, "MMMM yyyy")}
                  </SelectItem>
                ))}
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
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
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
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                />
                <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                <Bar
                  dataKey="plannedQty"
                  fill="#3b82f6"
                  name="Planned"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actualQty"
                  fill="#10b981"
                  name="Actual"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
