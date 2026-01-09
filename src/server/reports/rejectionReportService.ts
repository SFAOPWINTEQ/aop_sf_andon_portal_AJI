"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { formatDateLocal } from "@/lib/date";

/**
 * Rejection Report Service
 * Handles data fetching for the Rejection report page
 */

/**
 * Get rejection report data for charts and table
 * Returns rejections grouped by shift and detailed rejection event data
 */
export async function getRejectionReport(params?: {
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

    // Get rejection events with production plan details
    const rejections = await db.rejectionEvent.findMany({
      where: {
        occurredAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
        plan: {
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
        rejectCriteria: {
          select: {
            category: true,
            name: true,
          },
        },
      },
      orderBy: [{ occurredAt: "asc" }],
    });

    // Group data by date and shift for chart
    const chartData = new Map<string, Map<number, number>>();

    rejections.forEach((rejection) => {
      const dateKey = formatDateLocal(rejection.plan.planDate);

      if (!chartData.has(dateKey)) {
        chartData.set(dateKey, new Map());
      }

      const shiftMap = chartData.get(dateKey);
      if (shiftMap) {
        const currentQty = shiftMap.get(rejection.plan.shift.number) || 0;
        shiftMap.set(rejection.plan.shift.number, currentQty + rejection.qty);
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
    const tableData = rejections.map((rejection) => ({
      id: rejection.id,
      date: rejection.occurredAt,
      workOrderNo: rejection.plan.workOrderNo,
      plantName: rejection.plan.line.plant?.name || "N/A",
      lineName: rejection.plan.line.name,
      shiftNumber: rejection.plan.shift.number,
      partNo: rejection.plan.part.partNo,
      partName: rejection.plan.part.name,
      qty: rejection.qty,
      category: rejection.category,
      criteria: rejection.criteria || "N/A",
      action: rejection.note || "-",
    }));

    return {
      success: true,
      chartData: chartDataArray,
      tableData,
    };
  } catch (error) {
    console.error("Error fetching rejection report:", error);
    return {
      success: false,
      error: "Failed to fetch rejection report data",
      chartData: [],
      tableData: [],
    };
  }
}
