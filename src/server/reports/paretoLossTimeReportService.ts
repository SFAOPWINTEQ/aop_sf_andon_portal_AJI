"use server";

import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Pareto Loss Time Report Service
 * Analyzes downtime events by category/cause to identify top loss contributors
 */

/**
 * Get Pareto loss time report data for charts and table
 * Returns downtime events grouped by category and detailed event data
 */
export async function getParetoLossTimeReport(params?: {
  startDate?: Date;
  endDate?: Date;
  plantId?: string;
  lineId?: string;
  shiftId?: string;
  department?: string;
  machineId?: string;
}) {
  try {
    const startDate = params?.startDate ?? new Date();
    const endDate = params?.endDate ?? new Date();
    const plantId = params?.plantId;
    const lineId = params?.lineId;
    const shiftId = params?.shiftId;
    const department = params?.department;
    const machineId = params?.machineId;

    // Get downtime events with related data
    const downtimeEvents = await db.downtimeEvent.findMany({
      where: {
        plan: {
          planDate: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate),
          },
          ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
          ...(shiftId ? { shiftId } : {}),
        },
        ...(department ? { updtCat: { department } } : {}),
        ...(machineId ? { machineId } : {}),
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
        updtCat: {
          select: {
            department: true,
            name: true,
          },
        },
        pdtCat: {
          select: {
            name: true,
          },
        },
        machine: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ plan: { planDate: "desc" } }, { startTime: "desc" }],
    });

    // Group by category for Pareto chart
    const categoryMap = new Map<
      string,
      { category: string; lossTimeSec: number; count: number }
    >();

    downtimeEvents.forEach((event) => {
      // Determine category name
      let categoryName = "Unknown";
      if (event.kind === "PDT" && event.pdtCat) {
        categoryName = `PDT - ${event.pdtCat.name}`;
      } else if (event.kind === "UPDT" && event.updtCat) {
        categoryName = `${event.updtCat.department} - ${event.updtCat.name}`;
      }

      const existing = categoryMap.get(categoryName);
      if (existing) {
        existing.lossTimeSec += event.durationSec;
        existing.count += 1;
      } else {
        categoryMap.set(categoryName, {
          category: categoryName,
          lossTimeSec: event.durationSec,
          count: 1,
        });
      }
    });

    // Convert to array and sort by loss time descending (Pareto principle)
    const chartData = Array.from(categoryMap.values())
      .sort((a, b) => b.lossTimeSec - a.lossTimeSec)
      .map((item) => ({
        category: item.category,
        lossTimeSec: item.lossTimeSec,
        lossTimeMin: Math.round(item.lossTimeSec / 60),
        count: item.count,
      }));

    // Calculate cumulative percentage for Pareto
    const totalLoss = chartData.reduce(
      (sum, item) => sum + item.lossTimeSec,
      0,
    );
    let cumulative = 0;
    const chartDataWithCumulative = chartData.map((item) => {
      cumulative += item.lossTimeSec;
      return {
        ...item,
        percentage:
          totalLoss > 0
            ? Number(((item.lossTimeSec / totalLoss) * 100).toFixed(2))
            : 0,
        cumulative:
          totalLoss > 0
            ? Number(((cumulative / totalLoss) * 100).toFixed(2))
            : 0,
      };
    });

    // Prepare table data
    const tableData = downtimeEvents.map((event) => {
      const categoryName =
        event.kind === "PDT" && event.pdtCat
          ? event.pdtCat.name
          : event.updtCat?.name || "Unknown";

      const categoryDetail =
        event.kind === "PDT"
          ? "Planned Downtime"
          : event.updtCat?.department || "Unknown";

      return {
        id: event.id,
        date: event.plan.planDate,
        workOrderNo: event.plan.workOrderNo,
        plantName: event.plan.line.plant?.name || "N/A",
        lineName: event.plan.line.name,
        shiftNumber: event.plan.shift.number,
        partNo: event.plan.part.partNo,
        partName: event.plan.part.name,
        department: categoryDetail,
        machineName: event.machine?.name || "N/A",
        category: categoryName,
        detail: event.note || "-",
        kind: event.kind,
        startTime: event.startTime,
        endTime: event.endTime,
        lossTimeSec: event.durationSec,
        lossTimeMin: Math.round(event.durationSec / 60),
      };
    });

    return {
      success: true,
      chartData: chartDataWithCumulative,
      tableData,
      summary: {
        totalEvents: downtimeEvents.length,
        totalLossTimeSec: totalLoss,
        totalLossTimeMin: Math.round(totalLoss / 60),
        categoriesCount: chartData.length,
      },
    };
  } catch (error) {
    console.error("[getParetoLossTimeReport] Error:", error);
    return {
      success: false,
      error: "Failed to fetch Pareto loss time report",
      chartData: [],
      tableData: [],
      summary: {
        totalEvents: 0,
        totalLossTimeSec: 0,
        totalLossTimeMin: 0,
        categoriesCount: 0,
      },
    };
  }
}
