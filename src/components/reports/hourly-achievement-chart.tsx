"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  getHourlyAchievementByDate,
  getActiveLines,
  getShiftsByLine,
} from "@/server/reportService";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomChartTooltip } from "./custom-chart-tooltip";

interface Shift {
  id: string;
  number: number;
}

export function HourlyAchievementChart({ plantId }: { plantId?: string }) {
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedShift, setSelectedShift] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Fetch lines with SWR
  const { data: linesData } = useSWR("active-lines", async () => {
    const result = await getActiveLines();
    return result.success ? result.lines : [];
  });

  // Fetch shifts when line changes
  useEffect(() => {
    async function fetchShifts() {
      if (selectedLine && selectedLine !== "all") {
        const result = await getShiftsByLine(selectedLine);
        if (result.success) {
          setShifts(result.shifts);
        }
      } else {
        setShifts([]);
        setSelectedShift("all");
      }
    }
    fetchShifts();
  }, [selectedLine]);

  // Fetch chart data with SWR
  const cacheKey = useMemo(
    () =>
      `hourly-achievement-${format(selectedDate, "yyyy-MM-dd")}-${selectedLine}-${selectedShift}-${plantId ?? "all"}`,
    [selectedDate, selectedLine, selectedShift, plantId],
  );

  const { data: chartData, isLoading } = useSWR(cacheKey, async () => {
    const result = await getHourlyAchievementByDate({
      date: selectedDate,
      lineId: selectedLine === "all" ? undefined : selectedLine,
      shiftId: selectedShift === "all" ? undefined : selectedShift,
      plantId,
    });

    return result.success ? result.data : [];
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Hourly Achievement</CardTitle>
            <CardDescription>Plan vs Actual Production by Hour</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "MMM dd, yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Select value={selectedLine} onValueChange={setSelectedLine}>
              <SelectTrigger className="w-full sm:w-[130px]">
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
            <Select
              value={selectedShift}
              onValueChange={setSelectedShift}
              disabled={selectedLine === "all"}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {shifts.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    Shift {shift.number}
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
                  dataKey="hour"
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
