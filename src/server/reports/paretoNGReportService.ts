"use server";

import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Pareto NG Report Service
 * Analyzes rejection events by category to identify top quality issues
 */

/**
 * Get Pareto NG report data for charts and table
 * Returns rejection events grouped by category and detailed event data
 */
export async function getParetoNGReport(params?: {
  startDate?: Date;
  endDate?: Date;
  plantId?: string;
  lineId?: string;
  shiftId?: string;
}) {
  try {
    const startDate = params?.startDate ?? new Date();
    const endDate = params?.endDate ?? new Date();
    const plantId = params?.plantId;
    const lineId = params?.lineId;
    const shiftId = params?.shiftId;

    // Get rejection events with related data
    const rejectionEvents = await db.rejectionEvent.findMany({
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

    // Group by category for Pareto analysis
    const categoryMap = new Map<
      string,
      {
        category: string;
        qty: number;
        count: number;
      }
    >();

    rejectionEvents.forEach((event) => {
      const categoryKey = event.category || "Unknown";

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          category: categoryKey,
          qty: 0,
          count: 0,
        });
      }

      const categoryData = categoryMap.get(categoryKey);
      if (categoryData) {
        categoryData.qty += event.qty;
        categoryData.count += 1;
      }
    });

    // Convert to array and sort by quantity descending
    const sortedCategories = Array.from(categoryMap.values()).sort(
      (a, b) => b.qty - a.qty,
    );

    // Calculate total and cumulative percentages
    const totalQty = sortedCategories.reduce((sum, cat) => sum + cat.qty, 0);

    let cumulativeQty = 0;
    const chartData = sortedCategories.map((cat) => {
      cumulativeQty += cat.qty;
      const percentage = totalQty > 0 ? (cat.qty / totalQty) * 100 : 0;
      const cumulative = totalQty > 0 ? (cumulativeQty / totalQty) * 100 : 0;

      return {
        category: cat.category,
        qty: cat.qty,
        count: cat.count,
        percentage: Math.round(percentage * 10) / 10,
        cumulative: Math.round(cumulative * 10) / 10,
      };
    });

    // Prepare table data
    const tableData = rejectionEvents.map((event) => ({
      id: event.id,
      date: event.occurredAt,
      shiftNumber: event.plan.shift.number,
      plantName: event.plan.line.plant?.name || "N/A",
      lineName: event.plan.line.name,
      workOrderNo: event.plan.workOrderNo,
      partNo: event.plan.part.partNo,
      partName: event.plan.part.name,
      category: event.category,
      criteria: event.criteria || "N/A",
      note: event.note || "-",
      qty: event.qty,
    }));

    return {
      success: true,
      chartData,
      tableData,
      summary: {
        totalEvents: rejectionEvents.length,
        totalQty,
        categories: sortedCategories.length,
      },
    };
  } catch (error) {
    console.error("Error fetching Pareto NG report:", error);
    return {
      success: false,
      error: "Failed to fetch Pareto NG report data",
      chartData: [],
      tableData: [],
      summary: {},
    };
  }
}
