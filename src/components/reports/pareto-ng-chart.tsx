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

export interface ParetoNGChartData {
  category: string;
  qty: number;
  count: number;
  percentage: number;
  cumulative: number;
}

interface ParetoNGChartProps {
  data: ParetoNGChartData[];
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
    payload: ParetoNGChartData;
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
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-sm text-muted-foreground">
                Rejection Qty:
              </span>
            </div>
            <span className="text-sm font-medium">
              {data.qty.toLocaleString()} pcs
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-muted-foreground">
                Cumulative %:
              </span>
            </div>
            <span className="text-sm font-medium">{data.cumulative}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Events:</span>
            <span className="text-sm font-medium">
              {data.count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Percentage:</span>
            <span className="text-sm font-medium">{data.percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ParetoNGChart({ data, isLoading }: ParetoNGChartProps) {
  const chartHeight = useMemo(() => {
    // Adjust height based on number of categories for better readability
    const baseHeight = 400;
    const itemCount = data.length;
    if (itemCount > 15) return 600;
    if (itemCount > 10) return 500;
    return baseHeight;
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pareto NG Analysis</CardTitle>
          <CardDescription>
            Top rejection categories by quantity with cumulative percentage
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
          <CardTitle>Pareto NG Analysis</CardTitle>
          <CardDescription>
            Top rejection categories by quantity with cumulative percentage
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
        <CardTitle>Pareto NG Analysis</CardTitle>
        <CardDescription>
          Top rejection categories by quantity with cumulative percentage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`h-[${chartHeight}px] w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="category"
                tick={<CustomXAxisTick x={0} y={0} payload={{ value: "" }} />}
                height={100}
                interval={0}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                label={{
                  value: "Rejection Qty (pcs)",
                  angle: -90,
                  position: "insideLeft",
                  className: "text-xs fill-muted-foreground",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                domain={[0, 100]}
                label={{
                  value: "Cumulative %",
                  angle: 90,
                  position: "insideRight",
                  className: "text-xs fill-muted-foreground",
                }}
              />
              <Tooltip content={<ParetoTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                }}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
              <Bar
                yAxisId="left"
                dataKey="qty"
                name="Rejection Qty"
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
                dot={{ fill: "#f97316", r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Categories</p>
            <p className="text-xl font-bold">{data.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xl font-bold">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Rejections</p>
            <p className="text-xl font-bold">
              {data.reduce((sum, item) => sum + item.qty, 0).toLocaleString()}{" "}
              pcs
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Top Category</p>
            <p
              className="text-sm font-semibold truncate"
              title={data[0]?.category}
            >
              {data[0]?.category || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data[0]?.percentage || 0}% of total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
