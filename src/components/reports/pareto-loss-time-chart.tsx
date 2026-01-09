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
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

export interface ParetoChartData {
  category: string;
  lossTimeSec: number;
  lossTimeMin: number;
  count: number;
  percentage: number;
  cumulative: number;
}

interface ParetoLossTimeChartProps {
  data: ParetoChartData[];
  isLoading?: boolean;
}

// Custom X-Axis tick with truncation and hover
function CustomXAxisTick({
  x,
  y,
  payload,
}: {
  x: number;
  y: number;
  payload: { value: string };
}) {
  const fullText = payload.value;
  const maxLength = 20;
  const truncatedText =
    fullText.length > maxLength
      ? fullText.substring(0, maxLength - 3) + "..."
      : fullText;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullText}</title>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="currentColor"
        className="text-xs"
        transform="rotate(-45)"
      >
        {truncatedText}
      </text>
    </g>
  );
}

// Custom tooltip for Pareto chart
function ParetoTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: ParetoChartData;
  }>;
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <Card className="shadow-lg">
      <CardContent className="p-3">
        <p className="font-medium text-sm mb-2">{data.category}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: payload[0].color }}
              />
              <span className="text-sm text-muted-foreground">Loss Time:</span>
            </div>
            <span className="text-sm font-medium">
              {data.lossTimeMin.toLocaleString()} min
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground pl-5">Events:</span>
            <span className="text-sm font-medium">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground pl-5">
              Percentage:
            </span>
            <span className="text-sm font-medium">{data.percentage}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: payload[1]?.color }}
              />
              <span className="text-sm text-muted-foreground">Cumulative:</span>
            </div>
            <span className="text-sm font-medium">{data.cumulative}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ParetoLossTimeChart({
  data,
  isLoading,
}: ParetoLossTimeChartProps) {
  const chartData = useMemo(() => data, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pareto Loss Time Analysis</CardTitle>
          <CardDescription>
            Top downtime causes ranked by total loss time
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

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pareto Loss Time Analysis</CardTitle>
          <CardDescription>
            Top downtime causes ranked by total loss time
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
        <CardTitle>Pareto Loss Time Analysis</CardTitle>
        <CardDescription>
          Top downtime causes ranked by total loss time with cumulative
          percentage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="category"
                tick={<CustomXAxisTick x={0} y={0} payload={{ value: "" }} />}
                height={80}
                interval={0}
              />
              <YAxis
                yAxisId="left"
                label={{
                  value: "Loss Time (Minutes)",
                  angle: -90,
                  position: "insideLeft",
                }}
                className="text-xs"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                label={{
                  value: "Cumulative %",
                  angle: 90,
                  position: "insideRight",
                }}
                className="text-xs"
              />
              <Tooltip content={<ParetoTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
              <Bar
                yAxisId="left"
                dataKey="lossTimeMin"
                name="Loss Time (min)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="Cumulative %"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Categories</p>
            <p className="text-xl font-bold">{chartData.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xl font-bold">
              {chartData.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Loss Time</p>
            <p className="text-xl font-bold">
              {chartData
                .reduce((sum, item) => sum + item.lossTimeMin, 0)
                .toLocaleString()}{" "}
              min
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Top Contributor</p>
            <p
              className="text-sm font-semibold truncate"
              title={chartData[0]?.category}
            >
              {chartData[0]?.category || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {chartData[0]?.percentage || 0}% of total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
