"use server";

import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Status Line Report Service
 * Handles data fetching for the Status Line report page
 */

/**
 * Get Status Line report data
 * Returns production plan with line status, actual qty, loss time, and ng qty for a specific date
 */
export async function getStatusLineReport(params?: {
  date?: Date;
  plantId?: string;
}) {
  try {
    const date = params?.date ?? new Date();
    const plantId = params?.plantId;
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const plans = await db.productionPlan.findMany({
      where: {
        planDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(plantId ? { line: { plantId } } : {}),
      },
      include: {
        line: {
          select: {
            id: true,
            name: true,
            plant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        shift: {
          select: {
            number: true,
          },
        },
        part: {
          select: {
            partNo: true,
            name: true,
          },
        },
      },
      orderBy: [{ line: { name: "asc" } }, { sequence: "asc" }],
    });

    // Calculate loss time for each plan
    const plansWithLossTime = await Promise.all(
      plans.map(async (plan) => {
        // Get total downtime duration (in seconds)
        const downtimeResult = await db.downtimeEvent.aggregate({
          where: {
            planId: plan.id,
          },
          _sum: {
            durationSec: true,
          },
        });

        const lossTimeSec = downtimeResult._sum?.durationSec || 0;
        const lossTimeMin = Math.round(lossTimeSec / 60); // Convert to minutes

        return {
          id: plan.id,
          lineName: plan.line.name,
          plantName: plan.line.plant?.name || "N/A",
          status: plan.status,
          workOrderNo: plan.workOrderNo,
          partNo: plan.part.partNo,
          partName: plan.part.name,
          shiftNumber: plan.shift.number,
          plannedQty: plan.plannedQty,
          actualQty: plan.actualQty,
          lossTimeMin: lossTimeMin,
          ngQty: plan.ngQty,
          sequence: plan.sequence,
        };
      }),
    );

    return {
      success: true,
      data: plansWithLossTime,
    };
  } catch (error) {
    console.error("[getStatusLineReport] Error:", error);
    return {
      success: false,
      error: "Failed to fetch status line report",
      data: [],
    };
  }
}
