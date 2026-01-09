"use server";

import { db } from "@/lib/db";

export async function getActiveLines() {
  try {
    const lines = await db.line.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      lines,
    };
  } catch (error) {
    console.error("[getActiveLines] Error:", error);
    return {
      success: false,
      error: "Failed to fetch lines",
      lines: [],
    };
  }
}

export async function getShiftsByLine(lineId: string) {
  try {
    const shifts = await db.shift.findMany({
      where: {
        lineId,
        deletedAt: null,
      },
      select: {
        id: true,
        number: true,
      },
      orderBy: {
        number: "asc",
      },
    });

    return {
      success: true,
      shifts,
    };
  } catch (error) {
    console.error("[getShiftsByLine] Error:", error);
    return {
      success: false,
      error: "Failed to fetch shifts",
      shifts: [],
    };
  }
}

// ============================================================================
// Re-export report functions from modular services for backward compatibility
// ============================================================================
import {
  getMonthlyAchievement as _getMonthlyAchievement,
  getTodayStatistics as _getTodayStatistics,
  getDailyAchievementByMonth as _getDailyAchievementByMonth,
  getHourlyAchievementByDate as _getHourlyAchievementByDate,
  getPerformanceByDateRange as _getPerformanceByDateRange,
  getOEEByDateRange as _getOEEByDateRange,
  getAchievementReport as _getAchievementReport,
  getLossTimeReport as _getLossTimeReport,
  getParetoLossTimeReport as _getParetoLossTimeReport,
  getParetoNGReport as _getParetoNGReport,
  getRejectionReport as _getRejectionReport,
  getOEEReport as _getOEEReport,
  getStatusLineReport as _getStatusLineReport,
  getTrackingReport as _getTrackingReport,
} from "./reports";

// Re-export as async functions for "use server" compatibility
export const getMonthlyAchievement = _getMonthlyAchievement;
export const getTodayStatistics = _getTodayStatistics;
export const getDailyAchievementByMonth = _getDailyAchievementByMonth;
export const getHourlyAchievementByDate = _getHourlyAchievementByDate;
export const getPerformanceByDateRange = _getPerformanceByDateRange;
export const getOEEByDateRange = _getOEEByDateRange;
export const getAchievementReport = _getAchievementReport;
export const getLossTimeReport = _getLossTimeReport;
export const getParetoLossTimeReport = _getParetoLossTimeReport;
export const getParetoNGReport = _getParetoNGReport;
export const getRejectionReport = _getRejectionReport;
export const getOEEReport = _getOEEReport;
export const getStatusLineReport = _getStatusLineReport;
export const getTrackingReport = _getTrackingReport;
