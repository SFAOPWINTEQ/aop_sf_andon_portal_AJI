"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { format } from "date-fns";
import { CustomChartTooltip } from "./custom-chart-tooltip";

interface AchievementChartProps {
  data: Array<Record<string, string | number>>;
  isLoading?: boolean;
}

export function AchievementChart({ data, isLoading }: AchievementChartProps) {
  // Extract unique shifts from data
  const shifts = useMemo(() => {
    const shiftSet = new Set<number>();
    data.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (key.startsWith("shift")) {
          const shiftNum = parseInt(key.replace("shift", ""));
          shiftSet.add(shiftNum);
        }
      });
    });
    return Array.from(shiftSet).sort((a, b) => a - b);
  }, [data]);

  // Format data for display
  const formattedData = useMemo(() => {
    return data.map((entry) => ({
      ...entry,
      date:
        typeof entry.date === "string"
          ? format(new Date(entry.date + "T00:00:00"), "MMM dd")
          : entry.date,
    }));
  }, [data]);

  const shiftColors = [
    "#3b82f6", // blue-500
    "#f97316", // orange-500
    "#8b5cf6", // violet-500
    "#10b981", // emerald-500
    "#ec4899", // pink-500
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Production Achievement by Shift</CardTitle>
          <CardDescription>
            Comparing production quantities across shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Production Achievement by Shift</CardTitle>
          <CardDescription>
            Comparing production quantities across shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Achievement by Shift</CardTitle>
        <CardDescription>
          Comparing production quantities across shifts over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis
                label={{
                  value: "Production Quantity (Pcs)",
                  angle: -90,
                  position: "insideLeft",
                }}
                className="text-xs"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
              {shifts.map((shiftNum, index) => (
                <Bar
                  key={`shift${shiftNum}`}
                  dataKey={`shift${shiftNum}`}
                  name={`Shift ${shiftNum}`}
                  fill={shiftColors[index % shiftColors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
