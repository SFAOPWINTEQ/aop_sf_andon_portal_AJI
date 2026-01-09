"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { formatDateLocal } from "@/lib/date";

/**
 * OEE Report Service
 * Handles data fetching for the OEE report page
 */

/**
 * Get OEE report data for charts and table
 * Returns OEE metrics grouped by shift and detailed OEE records
 */
export async function getOEEReport(params?: {
  startDate?: Date;
  endDate?: Date;
  plantId?: string;
  lineId?: string;
  shiftId?: string;
}) {
  try {
    const startDate = params?.startDate ?? startOfMonth(new Date());
    const endDate = params?.endDate ?? endOfMonth(new Date());
    const plantId = params?.plantId;
    const lineId = params?.lineId;
    const shiftId = params?.shiftId;

    // Get OEE records with production plan details
    const oeeRecords = await db.oEERecord.findMany({
      where: {
        plan: {
          planDate: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate),
          },
          ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
          ...(shiftId ? { shiftId } : {}),
        },
      },
      include: {
        plan: {
          select: {
            workOrderNo: true,
            planDate: true,
            line: {
              select: {
                name: true,
                plant: { select: { name: true } },
              },
            },
            shift: {
              select: { number: true },
            },
            part: {
              select: { partNo: true, name: true },
            },
          },
        },
      },
      orderBy: [{ plan: { planDate: "asc" } }],
    });

    // Group data by date and shift for chart
    const chartData = new Map<string, Map<number, number>>();

    oeeRecords.forEach((record) => {
      const dateKey = formatDateLocal(record.plan.planDate);

      if (!chartData.has(dateKey)) {
        chartData.set(dateKey, new Map());
      }

      const shiftMap = chartData.get(dateKey);
      if (shiftMap) {
        const currentOEE = shiftMap.get(record.plan.shift.number) || 0;
        const countKey = `${record.plan.shift.number}_count`;
        const count = (shiftMap.get(countKey as never) as number) || 0;

        // Calculate average OEE for the shift on this date
        shiftMap.set(record.plan.shift.number, currentOEE + Number(record.oee));
        shiftMap.set(countKey as never, (count + 1) as never);
      }
    });

    // Convert map to array format for chart and calculate averages
    const chartDataArray = Array.from(chartData.entries()).map(
      ([date, shifts]) => {
        const entry: Record<string, string | number> = { date };

        // Get unique shift numbers
        const shiftNumbers = Array.from(shifts.keys()).filter(
          (key) => typeof key === "number",
        ) as number[];

        shiftNumbers.forEach((shiftNum) => {
          const total = shifts.get(shiftNum) || 0;
          const countKey = `${shiftNum}_count`;
          const count = (shifts.get(countKey as never) as number) || 1;
          entry[`shift${shiftNum}`] = Math.round((total / count) * 10) / 10; // Average OEE
        });

        return entry;
      },
    );

    // Prepare table data
    const tableData = oeeRecords.map((record) => ({
      id: record.id,
      date: formatDateLocal(record.plan.planDate),
      workOrderNo: record.plan.workOrderNo,
      plantName: record.plan.line.plant?.name || "N/A",
      lineName: record.plan.line.name,
      shiftNumber: record.plan.shift.number,
      partNo: record.plan.part.partNo,
      partName: record.plan.part.name,
      availability: Number(record.availability),
      performance: Number(record.performance),
      quality: Number(record.quality),
      oee: Number(record.oee),
    }));

    return {
      success: true,
      chartData: chartDataArray,
      tableData,
    };
  } catch (error) {
    console.error("Error fetching OEE report:", error);
    return {
      success: false,
      error: "Failed to fetch OEE report data",
      chartData: [],
      tableData: [],
    };
  }
}
