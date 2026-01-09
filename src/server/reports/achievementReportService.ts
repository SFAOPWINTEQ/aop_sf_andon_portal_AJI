"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { formatDateLocal } from "@/lib/date";

/**
 * Achievement Report Service
 * Handles data fetching for the Achievement report page
 */

/**
 * Get achievement report data for charts and table
 * Returns daily achievements grouped by shift and detailed production plan data
 */
export async function getAchievementReport(params?: {
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

    // Get production plans for the date range
    const plans = await db.productionPlan.findMany({
      where: {
        planDate: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
        // Remove status filter to ensure all relevant plans are shown
        // status: {
        //   in: ["RUNNING", "CLOSED"],
        // },
        ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
        ...(shiftId ? { shiftId } : {}),
      },
      include: {
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
      orderBy: [{ planDate: "asc" }, { shift: { number: "asc" } }],
    });

    // Group data by date and shift for chart
    const chartData = new Map<string, Map<number, number>>();

    plans.forEach((plan) => {
      const dateKey = formatDateLocal(plan.planDate);

      if (!chartData.has(dateKey)) {
        chartData.set(dateKey, new Map());
      }

      const shiftMap = chartData.get(dateKey);
      if (shiftMap) {
        const currentQty = shiftMap.get(plan.shift.number) || 0;
        shiftMap.set(plan.shift.number, currentQty + plan.actualQty);
      }
    });

    // Convert map to array format for chart
    const chartDataArray = Array.from(chartData.entries()).map(
      ([date, shifts]) => {
        const entry: Record<string, string | number> = { date };
        shifts.forEach((qty, shiftNum) => {
          entry[`shift${shiftNum}`] = qty;
        });
        return entry;
      },
    );

    // Prepare table data
    const tableData = plans.map((plan) => ({
      id: plan.id,
      date: plan.planDate,
      workOrderNo: plan.workOrderNo,
      plantName: plan.line.plant?.name || "N/A",
      lineName: plan.line.name,
      shiftNumber: plan.shift.number,
      partNo: plan.part.partNo,
      partName: plan.part.name,
      cycleTimeSec: plan.cycleTimeSec,
      plannedQty: plan.plannedQty,
      actualQty: plan.actualQty,
      ngQty: plan.ngQty,
      achievementPercent: plan.plannedQty > 0
        ? Number(((plan.actualQty / plan.plannedQty) * 100).toFixed(1))
        : 0,
    }));

    return {
      success: true,
      chartData: chartDataArray,
      tableData,
    };
  } catch (error) {
    console.error("[getAchievementReport] Error:", error);
    return {
      success: false,
      error: "Failed to fetch achievement report",
      chartData: [],
      tableData: [],
    };
  }
}
