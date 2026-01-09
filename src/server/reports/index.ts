/**
 * Reports Service Index
 * Central export point for all report services
 */

// Dashboard Report Services
export {
  getMonthlyAchievement,
  getTodayStatistics,
  getDailyAchievementByMonth,
  getHourlyAchievementByDate,
  getPerformanceByDateRange,
  getOEEByDateRange,
} from "./dashboardReportService";

// Achievement Report Services
export { getAchievementReport } from "./achievementReportService";

// Loss Time Report Services
export { getLossTimeReport } from "./lossTimeReportService";

// Pareto Loss Time Report Services
export { getParetoLossTimeReport } from "./paretoLossTimeReportService";

// Pareto NG Report Services
export { getParetoNGReport } from "./paretoNGReportService";

// Rejection Report Services
export { getRejectionReport } from "./rejectionReportService";

// OEE Report Services
export { getOEEReport } from "./oeeReportService";

// Status Line Report Services
export { getStatusLineReport } from "./statusLineReportService";

// Status Tracking Report Services
export { getTrackingReport } from "./trackingReportService";

// Legacy exports for backward compatibility
export {
  getActiveLines,
  getShiftsByLine,
} from "../reportService";
