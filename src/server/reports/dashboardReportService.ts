"use server";

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { formatDateLocal } from "@/lib/date";

/**
 * Dashboard Report Service
 * Handles data fetching for dashboard statistics and charts
 */

/**
 * Get monthly achievement statistics for current month
 * Returns total planned vs actual quantities
 */
export async function getMonthlyAchievement(params?: {
  date?: Date;
  plantId?: string;
}) {
  try {
    const date = params?.date ?? new Date();
    const plantId = params?.plantId;

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    /**
     * ======================
     * PLANNED (PLANNING)
     * ======================
     */
    const planned = await db.productionPlan.aggregate({
      where: {
        planDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        ...(plantId ? { line: { plantId } } : {}),
      },
      _sum: {
        plannedQty: true,
      },
    });

    /**
     * ======================
     * ACTUAL (ACHIEVEMENT)
     * DISTINCT workorderno
     * MAX(qtyacc)
     * ======================
     */
    const actualRows = await db.productionPlan.aggregate({
      where: {
        planDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        ...(plantId ? { line: { plantId } } : {}),
      },
      _sum: {
        actualQty: true,
      },
    });

    return {
      success: true,
      plannedQty: planned._sum.plannedQty || 0,
      actualQty: actualRows._sum.actualQty || 0,
    };
  } catch (error) {
    console.error("[getMonthlyAchievement] Error:", error);
    return {
      success: false,
      error: "Failed to fetch monthly achievement",
      plannedQty: 0,
      actualQty: 0,
    };
  }
}


/**
 * Get today's statistics
 * Returns achievement, loss time, and reject quantities for today
 */
// export async function getTodayStatistics(params?: {
//   date?: Date;
//   plantId?: string;
// }) {
//   try {
//     const date = params?.date ?? new Date();
//     const plantId = params?.plantId;
//     const dayStart = startOfDay(date);
//     const dayEnd = endOfDay(date);

//     // Get achievement
//     const achievement = await db.productionPlan.aggregate({
//       where: {
//         planDate: {
//           gte: dayStart,
//           lte: dayEnd,
//         },
//         ...(plantId ? { line: { plantId } } : {}),
//       },
//       _sum: {
//         plannedQty: true,
//         actualQty: true,
//       },
//     });

//     // Get loss time (total UPDT)
//     const lossTime = await db.downtimeEvent.aggregate({
//       where: {
//         kind: "UPDT",
//         startTime: {
//           gte: dayStart,
//           lte: dayEnd,
//         },
//         ...(plantId ? { plan: { line: { plantId } } } : {}),
//       },
//       _sum: {
//         durationSec: true,
//       },
//     });

//     // Get reject count
//     const rejects = await db.rejectionEvent.aggregate({
//       where: {
//         occurredAt: {
//           gte: dayStart,
//           lte: dayEnd,
//         },
//         ...(plantId ? { plan: { line: { plantId } } } : {}),
//       },
//       _sum: {
//         qty: true,
//       },
//     });

//     return {
//       success: true,
//       achievement: {
//         plannedQty: achievement._sum.plannedQty || 0,
//         actualQty: achievement._sum.actualQty || 0,
//       },
//       lossTimeSec: lossTime._sum.durationSec || 0,
//       rejectQty: rejects._sum.qty || 0,
//     };
//   } catch (error) {
//     console.error("[getTodayStatistics] Error:", error);
//     return {
//       success: false,
//       error: "Failed to fetch today's statistics",
//       achievement: { plannedQty: 0, actualQty: 0 },
//       lossTimeSec: 0,
//       rejectQty: 0,
//     };
//   }
// }

export async function getTodayStatistics(params?: {
  date?: Date;
  plantId?: string;
}) {
  try {
    const date = params?.date ?? new Date();
    const plantId = params?.plantId;

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    /**
     * ======================
     * PLANNED (PLANNING)
     * ======================
     */
    const planned = await db.productionPlan.aggregate({
      where: {
        planDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(plantId ? { line: { plantId } } : {}),
      },
      _sum: {
        plannedQty: true,
      },
    });

    /**
     * ======================
     * ACTUAL (ACHIEVEMENT)
     * DISTINCT workorderno
     * MAX(qtyacc)
     * ======================
     */
    const actuual = await db.productionPlan.aggregate({
      where: {
        planDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(plantId ? { line: { plantId } } : {}),
      },
      _sum: {
        actualQty: true,
      },
    });

    /**
     * ======================
     * LOSS TIME
     * ======================
     */
    const lossTime = await db.downtimeEvent.aggregate({
      where: {
        kind: "UPDT",
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(plantId ? { plan: { line: { plantId } } } : {}),
      },
      _sum: {
        durationSec: true,
      },
    });

    /**
     * ======================
     * REJECT
     * ======================
     */
    const rejects = await db.rejectionEvent.aggregate({
      where: {
        occurredAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(plantId ? { plan: { line: { plantId } } } : {}),
      },
      _sum: {
        qty: true,
      },
    });

    return {
      success: true,
      achievement: {
        plannedQty: planned._sum.plannedQty || 0,
        actualQty: actuual._sum.actualQty,
      },
      lossTimeSec: lossTime._sum.durationSec || 0,
      rejectQty: rejects._sum.qty || 0,
    };
  } catch (error) {
    console.error("[getTodayStatistics] Error:", error);
    return {
      success: false,
      error: "Failed to fetch today's statistics",
      achievement: { plannedQty: 0, actualQty: 0 },
      lossTimeSec: 0,
      rejectQty: 0,
    };
  }
}


/**
 * Get daily achievement data grouped by day for a specific month
 * Can be filtered by line
 */
export async function getDailyAchievementByMonth(params: {
  month: Date;
  lineId?: string;
  plantId?: string;
}) {
  try {
    const { month, lineId, plantId } = params;

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    /**
     * ======================
     * 1. GET PLANNED (PLANNING TABLE)
     * ======================
     */
    const plans = await db.productionPlan.findMany({
      where: {
        planDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
      },
      select: {
        planDate: true,
        plannedQty: true,
        actualQty: true
      },
    });

    /**
     * ======================
     * 2. GET ACTUAL (ACHIEVEMENT TABLE)
     * - DISTINCT workorderno
     * - ambil MAX(qtyacc)
     * ======================
     */
    const achievements = await db.achievement.groupBy({
      by: ["workorderno", "createdat"],
      where: {
        createdat: {
          gte: monthStart,
          lte: monthEnd,
        },
        ...(lineId ? { lineid: lineId } : plantId ? { plantid: plantId } : {}),
      },
      _max: {
        qtyacc: true,
      },
    });

    /**
     * ======================
     * 3. GROUP PER DATE
     * ======================
     */
    const grouped: Record<
      string,
      { date: string; plannedQty: number; actualQty: number }
    > = {};

    // Planned
    for (const plan of plans) {
      const dateKey = formatDateLocal(plan.planDate);
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          plannedQty: 0,
          actualQty: 0,
        };
      }
      grouped[dateKey].plannedQty += plan.plannedQty;
      grouped[dateKey].actualQty += plan.actualQty;
    }

    return {
      success: true,
      data: Object.values(grouped).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    };
  } catch (error) {
    console.error("[getDailyAchievementByMonth] Error:", error);
    return {
      success: false,
      error: "Failed to fetch daily achievement",
      data: [],
    };
  }
}


/**
 * Get hourly achievement data for a specific date
 * Can be filtered by line and shift
 */
// export async function getHourlyAchievementByDate(params: {
//   date: Date;
//   lineId?: string;
//   shiftId?: string;
//   plantId?: string;
// }) {
//   try {
//     const { date, lineId, shiftId, plantId } = params;
//     const dayStart = startOfDay(date);
//     const dayEnd = endOfDay(date);

//     // Get all product details for the date
//     const products = await db.productDetail.findMany({
//       where: {
//         completedAt: {
//           gte: dayStart,
//           lte: dayEnd,
//         },
//         plan: {
//           ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
//           ...(shiftId && { shiftId }),
//         },
//       },
//       select: {
//         completedAt: true,
//         isGood: true,
//         plan: {
//           select: {
//             cycleTimeSec: true,
//           },
//         },
//       },
//       orderBy: {
//         completedAt: "asc",
//       },
//     });

//     // Get planned data
//     const plans = await db.productionPlan.findMany({
//       where: {
//         planDate: {
//           gte: dayStart,
//           lte: dayEnd,
//         },
//         ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
//         ...(shiftId && { shiftId }),
//       },
//       select: {
//         plannedQty: true,
//         cycleTimeSec: true,
//         shift: {
//           select: {
//             workStart: true,
//             workEnd: true,
//           },
//         },
//       },
//     });

//     // Group products by hour
//     const hourlyActual = products.reduce(
//       (acc: any, product: any) => {
//         const hour = product.completedAt.getHours();
//         if (!acc[hour]) {
//           acc[hour] = 0;
//         }
//         acc[hour] += 1;
//         return acc;
//       },
//       {} as Record<number, number>,
//     );

//     // Calculate planned quantity per hour based on shift times
//     const hourlyPlanned = new Array(24).fill(0);

//     plans.forEach((plan: any) => {
//       if (!plan.shift?.workStart || !plan.shift?.workEnd) return;

//       const start = new Date(plan.shift.workStart);
//       const end = new Date(plan.shift.workEnd);
//       // Use UTC hours to get the raw time value from Prisma's Date object for Time fields
//       const startHour = start.getUTCHours();
//       const endHour = end.getUTCHours();

//       // Calculate duration in hours
//       let duration = endHour - startHour;
//       if (duration <= 0) duration += 24;

//       if (duration > 0) {
//         const qtyPerHour = Math.round(plan.plannedQty / duration);

//         // Distribute across hours
//         for (let i = 0; i < duration; i++) {
//           const hour = (startHour + i) % 24;

//           // Only include hours that fall within the current day (00:00 - 23:59)
//           if (startHour < endHour) {
//             hourlyPlanned[hour] += qtyPerHour;
//           } else {
//             // Crosses midnight: only include hours belonging to "today" (start to 23)
//             if (hour >= startHour) {
//               hourlyPlanned[hour] += qtyPerHour;
//             }
//           }
//         }
//       }
//     });

//     // Generate 24-hour data
//     const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
//       hour: `${hour.toString().padStart(2, "0")}:00`,
//       plannedQty: hourlyPlanned[hour],
//       actualQty: hourlyActual[hour] || 0,
//     }));

//     return {
//       success: true,
//       data: hourlyData,
//     };
//   } catch (error) {
//     console.error("[getHourlyAchievementByDate] Error:", error);
//     return {
//       success: false,
//       error: "Failed to fetch hourly achievement",
//       data: [],
//     };
//   }
// }

export async function getHourlyAchievementByDate(params: {
  date: Date;
  lineId?: string;
  shiftId?: string;
  plantId?: string;
}) {
  try {
    const { date, lineId, shiftId, plantId } = params;

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    /**
     * ======================
     * ACTUAL (ACHIEVEMENT)
     * DISTINCT workorderno
     * MAX(qtyacc)
     * GROUP PER JAM
     * ======================
     */
    const achievementRows = await db.achievement.groupBy({
      by: ["workorderno", "createdat"],
      where: {
        createdat: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(lineId ? { lineid: lineId } : plantId ? { plantid: plantId } : {}),
        ...(shiftId && { shiftid: shiftId }),
      },
      _max: {
        qtyacc: true,
      },
    });

    // Hourly actual accumulator
    const hourlyActual: Record<number, number> = {};

    for (const row of achievementRows) {
      if(!row.createdat) continue;

      const hour = row.createdat.getHours();
      hourlyActual[hour] =
        (hourlyActual[hour] || 0) + (row._max.qtyacc ?? 0);
    }

    /**
     * ======================
     * PLANNED (PLANNING)
     * ======================
     */
    const plans = await db.productionPlan.findMany({
      where: {
        planDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
        ...(shiftId && { shiftId }),
      },
      select: {
        plannedQty: true,
        shift: {
          select: {
            workStart: true,
            workEnd: true,
          },
        },
      },
    });

    /**
     * ======================
     * HITUNG PLANNED PER JAM
     * ======================
     */
    const hourlyPlanned = new Array(24).fill(0);

    plans.forEach((plan: any) => {
      if (!plan.shift?.workStart || !plan.shift?.workEnd) return;

      const start = new Date(plan.shift.workStart);
      const end = new Date(plan.shift.workEnd);

      const startHour = start.getUTCHours();
      const endHour = end.getUTCHours();

      let duration = endHour - startHour;
      if (duration <= 0) duration += 24;

      if (duration <= 0) return;

      const qtyPerHour = Math.round(plan.plannedQty / duration);

      for (let i = 0; i < duration; i++) {
        const hour = (startHour + i) % 24;

        // Shift tidak melewati tengah malam
        if (startHour < endHour) {
          hourlyPlanned[hour] += qtyPerHour;
        } else {
          // Shift melewati tengah malam → hanya jam hari ini
          if (hour >= startHour) {
            hourlyPlanned[hour] += qtyPerHour;
          }
        }
      }
    });

    /**
     * ======================
     * BUILD RESPONSE 24 JAM
     * ======================
     */
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      plannedQty: hourlyPlanned[hour],
      actualQty: hourlyActual[hour] || 0,
    }));

    return {
      success: true,
      data: hourlyData,
    };
  } catch (error) {
    console.error("[getHourlyAchievementByDate] Error:", error);
    return {
      success: false,
      error: "Failed to fetch hourly achievement",
      data: [],
    };
  }
}

/**
 * Get performance efficiency by date range
 * Performance = (Actual Output / Planned Output) * 100
 * Can be filtered by line
 */
export async function getPerformanceByDateRange(params: {
  startDate: Date;
  endDate: Date;
  lineId?: string;
  plantId?: string;
}) {
  try {
    const { startDate, endDate, lineId, plantId } = params;

    const plans = await db.productionPlan.findMany({
      where: {
        planDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
      },
      select: {
        planDate: true,
        plannedQty: true,
        actualQty: true,
      },
      orderBy: {
        planDate: "asc",
      },
    });

    // Group by date and calculate performance
    const grouped = plans.reduce(
      (acc: any, plan: any) => {
        const dateKey = formatDateLocal(plan.planDate);
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            plannedQty: 0,
            actualQty: 0,
            performance: 0,
          };
        }
        acc[dateKey].plannedQty += plan.plannedQty;
        acc[dateKey].actualQty += plan.actualQty;
        return acc;
      },
      {} as Record<
        string,
        {
          date: string;
          plannedQty: number;
          actualQty: number;
          performance: number;
        }
      >,
    );

    // Calculate performance percentage
    const performanceData = Object.values(grouped).map((item: any) => ({
      date: item.date,
      plannedQty: item.plannedQty,
      actualQty: item.actualQty,
      performance:
        item.plannedQty > 0
          ? Number(((item.actualQty / item.plannedQty) * 100).toFixed(2))
          : 0,
    }));

    return {
      success: true,
      data: performanceData,
    };
  } catch (error) {
    console.error("[getPerformanceByDateRange] Error:", error);
    return {
      success: false,
      error: "Failed to fetch performance data",
      data: [],
    };
  }
}

/**
 * Get OEE (Overall Equipment Effectiveness) by date range
 * Can be filtered by line
 */
export async function getOEEByDateRange(params: {
  startDate: Date;
  endDate: Date;
  lineId?: string;
  plantId?: string;
}) {
  try {
    const { startDate, endDate, lineId, plantId } = params;

    const oeeRecords = await db.oEERecord.findMany({
      where: {
        plan: {
          planDate: {
            gte: startDate,
            lte: endDate,
          },
          ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
        },
      },
      select: {
        oee: true,
        availability: true,
        performance: true,
        quality: true,
        plan: {
          select: {
            planDate: true,
          },
        },
      },
      orderBy: {
        plan: {
          planDate: "asc",
        },
      },
    });

    // Group by date and calculate average OEE
    const grouped = oeeRecords.reduce(
      (acc: any, record: any) => {
        const dateKey = formatDateLocal(record.plan.planDate);
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            oeeSum: 0,
            availabilitySum: 0,
            performanceSum: 0,
            qualitySum: 0,
            count: 0,
          };
        }
        acc[dateKey].oeeSum += Number(record.oee);
        acc[dateKey].availabilitySum += Number(record.availability);
        acc[dateKey].performanceSum += Number(record.performance);
        acc[dateKey].qualitySum += Number(record.quality);
        acc[dateKey].count += 1;
        return acc;
      },
      {} as Record<
        string,
        {
          date: string;
          oeeSum: number;
          availabilitySum: number;
          performanceSum: number;
          qualitySum: number;
          count: number;
        }
      >,
    );

    // Calculate averages
    const oeeData = Object.values(grouped).map((item: any) => ({
      date: item.date,
      oee: Number((item.oeeSum / item.count).toFixed(2)),
      availability: Number((item.availabilitySum / item.count).toFixed(2)),
      performance: Number((item.performanceSum / item.count).toFixed(2)),
      quality: Number((item.qualitySum / item.count).toFixed(2)),
    }));

    return {
      success: true,
      data: oeeData,
    };
  } catch (error) {
    console.error("[getOEEByDateRange] Error:", error);
    return {
      success: false,
      error: "Failed to fetch OEE data",
      data: [],
    };
  }
}
