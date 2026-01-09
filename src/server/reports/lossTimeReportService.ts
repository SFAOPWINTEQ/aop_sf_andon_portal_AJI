"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { formatDateLocal } from "@/lib/date";

/**
 * Loss Time Report Service
 * Handles data fetching for the Loss Time report page
 */

/**
 * Get loss time report data for charts and table
 * Returns loss time grouped by shift and detailed production plan data with time calculations
 */
export async function getLossTimeReport(params?: {
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

    // Get production plans with loss time summaries
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
        shift: true, // Include full shift details for time calculation
        part: {
          select: { partNo: true, name: true },
        },
        downtimes: true, // Include downtimes for calculation
        planneddowntimeevent: { // Include planned downtimes for calculation
          include: {
            pdtcategory: true
          }
        },
        lossSummary: true,
      },
      orderBy: [{ planDate: "asc" }, { shift: { number: "asc" } }],
    });

    // Group data by date and shift for chart (loss time in minutes)
    const chartData = new Map<string, Map<number, number>>();

    plans.forEach((plan) => {
      const dateKey = formatDateLocal(plan.planDate);

      if (!chartData.has(dateKey)) {
        chartData.set(dateKey, new Map());
      }

      const shiftMap = chartData.get(dateKey);
      if (shiftMap) {
        // Calculate loss time in minutes (UPDT)
        // Calculate UPDT from downtimes
        const updtSec = plan.downtimes
          .filter((d) => d.kind === "UPDT")
          .reduce((sum, d) => sum + d.durationSec, 0);

        const lossTimeMin = Math.round(updtSec / 60);
        const currentTime = shiftMap.get(plan.shift.number) || 0;
        shiftMap.set(plan.shift.number, currentTime + lossTimeMin);
      }
    });

    // Convert map to array format for chart
    const chartDataArray = Array.from(chartData.entries()).map(
      ([date, shifts]) => {
        const entry: Record<string, string | number> = { date };
        shifts.forEach((time, shiftNum) => {
          entry[`shift${shiftNum}`] = time;
        });
        return entry;
      },
    );

    // Prepare table data
    const tableData = plans.map((plan) => {
      // Calculate time metrics dynamically

      // 1. Calculate Shift Duration (Total Loading Time)
      let shiftDurationSec = plan.shift.loadingTimeInSec;

      // Fallback if loadingTimeInSec is 0: calculate from workStart/workEnd
      if (shiftDurationSec === 0 && plan.shift.workStart && plan.shift.workEnd) {
        const start = new Date(plan.shift.workStart);
        const end = new Date(plan.shift.workEnd);
        let diff = (end.getTime() - start.getTime()) / 1000;
        if (diff < 0) diff += 24 * 3600; // Handle crossing midnight
        shiftDurationSec = diff;
      }

      // 2. Calculate PDT (Planned Downtime)
      // Sum of PlannedDowntimeEvents + DowntimeEvents(kind='PDT')
      const pdtEventsSec = plan.planneddowntimeevent.reduce((sum, e) => sum + e.durationSec, 0);
      const pdtDowntimesSec = plan.downtimes
        .filter((d) => d.kind === "PDT")
        .reduce((sum, d) => sum + d.durationSec, 0);
      const pdtSec = pdtEventsSec + pdtDowntimesSec;

      // 3. Calculate UPDT (Unplanned Downtime)
      // UPDT = DowntimeEvents(kind='UPDT') + PlannedDowntimeEvent(overPdtDurationSec)
      const updtEventsSec = plan.downtimes
        .filter((d) => d.kind === "UPDT")
        .reduce((sum, d) => sum + d.durationSec, 0);

      const overPdtSec = plan.planneddowntimeevent.reduce((sum, e) => sum + (e.overPdtDurationSec || 0), 0);

      const updtSec = updtEventsSec + overPdtSec;

      // 4. Calculate Small Stop Frequency (UPDT < 5 mins)
      const smallStopFreq = plan.downtimes
        .filter((d) => d.kind === "UPDT" && d.durationSec < 300).length;

      // 5. Calculate Plan Working Time
      // Plan Working = Shift Duration - PDT
      const planWorkingSec = Math.max(0, shiftDurationSec - pdtSec);

      // 6. Calculate Actual Working Time
      // Actual Working = Plan Working - UPDT
      const actualWorkingSec = Math.max(0, planWorkingSec - updtSec);

      const planWorkingMin = Math.round(planWorkingSec / 60);
      const actualWorkingMin = Math.round(actualWorkingSec / 60);
      const pdtMin = Math.round(pdtSec / 60);
      const updtMin = Math.round(updtSec / 60);
      const overPdtMin = Math.round(overPdtSec / 60);
      const lossTimeMin = updtMin; // Loss time = UPDT

      return {
        id: plan.id,
        date: plan.planDate,
        workOrderNo: plan.workOrderNo,
        plantName: plan.line.plant?.name || "N/A",
        lineName: plan.line.name,
        shiftNumber: plan.shift.number,
        partNo: plan.part.partNo,
        partName: plan.part.name,
        planWorkingMin,
        actualWorkingMin,
        pdtMin,
        updtMin,
        overPdtMin,
        smallStopFreq,
        lossTimeMin,
      };
    });

    return {
      success: true,
      chartData: chartDataArray,
      tableData,
    };
  } catch (error) {
    console.error("[getLossTimeReport] Error:", error);
    return {
      success: false,
      error: "Failed to fetch loss time report",
      chartData: [],
      tableData: [],
    };
  }
}
