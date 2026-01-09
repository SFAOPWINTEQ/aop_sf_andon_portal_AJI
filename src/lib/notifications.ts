import { db } from "@/lib/db";

/**
 * Notification Helper - Automatically create notifications based on system events
 */

type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";
type NotificationCategory = "USER" | "SYSTEM" | "SECURITY" | "REPORTS";

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  userId?: string | null; // null for broadcast
}

/**
 * Core function to create notification
 */
async function createNotification(data: NotificationData) {
  try {
    return await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category || null,
        userId: data.userId || undefined,
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Production Plan Events
 */
export const notifyProductionPlanCreated = async (
  workOrderNo: string,
  partName: string,
  createdByUserId?: string,
) => {
  await createNotification({
    title: "Production Plan Created",
    message: `Work Order ${workOrderNo} for part "${partName}" has been created and scheduled.`,
    type: "SUCCESS",
    category: "SYSTEM",
    userId: createdByUserId || null,
  });
};

export const notifyProductionPlanStarted = async (
  workOrderNo: string,
  lineName: string,
  partName: string,
  userId?: string,
) => {
  await createNotification({
    title: "Production Started",
    message: `Production for Work Order ${workOrderNo} (${partName}) has started on line ${lineName}.`,
    type: "INFO",
    category: "SYSTEM",
    userId: userId || null, // null = broadcast to all
  });
};

export const notifyProductionPlanCompleted = async (
  workOrderNo: string,
  lineName: string,
  actualQty: number,
  plannedQty: number,
  userId?: string,
) => {
  const achievement = ((actualQty / plannedQty) * 100).toFixed(1);
  await createNotification({
    title: "Production Completed",
    message: `Work Order ${workOrderNo} on ${lineName} completed. Produced: ${actualQty}/${plannedQty} units (${achievement}%).`,
    type: "SUCCESS",
    category: "SYSTEM",
    userId: userId || null,
  });
};

export const notifyProductionPlanCanceled = async (
  workOrderNo: string,
  reason?: string,
  userId?: string,
) => {
  await createNotification({
    title: "Production Canceled",
    message: `Work Order ${workOrderNo} has been canceled. ${reason || ""}`,
    type: "WARNING",
    category: "SYSTEM",
    userId: userId || null,
  });
};

/**
 * Downtime Events
 */
export const notifyDowntimeStarted = async (
  lineName: string,
  machineNumber: string,
  downtimeType: string,
  category?: string,
) => {
  await createNotification({
    title: "Downtime Alert",
    message: `${downtimeType} downtime started on ${lineName} - Machine ${machineNumber}. ${category ? `Reason: ${category}` : ""}`,
    type: "WARNING",
    category: "SYSTEM",
    userId: null, // Broadcast to all
  });
};

export const notifyLongDowntime = async (
  lineName: string,
  machineNumber: string,
  durationMinutes: number,
) => {
  await createNotification({
    title: "Extended Downtime Alert",
    message: `Machine ${machineNumber} on ${lineName} has been down for ${durationMinutes} minutes. Immediate attention required.`,
    type: "ERROR",
    category: "SYSTEM",
    userId: null, // Broadcast to all
  });
};

/**
 * Quality/Rejection Events
 */
export const notifyHighRejectRate = async (
  lineName: string,
  workOrderNo: string,
  rejectRate: number,
  threshold: number,
) => {
  await createNotification({
    title: "High Reject Rate Alert",
    message: `Reject rate for ${workOrderNo} on ${lineName} is ${rejectRate.toFixed(1)}% (threshold: ${threshold}%). Quality check required.`,
    type: "ERROR",
    category: "SYSTEM",
    userId: null, // Broadcast to all
  });
};

export const notifyRejectCriteriaExceeded = async (
  lineName: string,
  rejectType: string,
  count: number,
) => {
  await createNotification({
    title: "Reject Threshold Exceeded",
    message: `${rejectType} defects on ${lineName} reached ${count} units. Investigation needed.`,
    type: "WARNING",
    category: "SYSTEM",
    userId: null,
  });
};

/**
 * OEE Performance Events
 */
export const notifyLowOEE = async (
  lineName: string,
  oeeValue: number,
  threshold: number,
) => {
  await createNotification({
    title: "Low OEE Alert",
    message: `OEE for ${lineName} dropped to ${oeeValue.toFixed(1)}% (threshold: ${threshold}%). Performance review needed.`,
    type: "WARNING",
    category: "REPORTS",
    userId: null,
  });
};

export const notifyOEEImprovement = async (
  lineName: string,
  previousOEE: number,
  currentOEE: number,
) => {
  const improvement = currentOEE - previousOEE;
  await createNotification({
    title: "OEE Improvement",
    message: `${lineName} OEE improved from ${previousOEE.toFixed(1)}% to ${currentOEE.toFixed(1)}% (+${improvement.toFixed(1)}%).`,
    type: "SUCCESS",
    category: "REPORTS",
    userId: null,
  });
};

/**
 * Target/Achievement Events
 */
export const notifyTargetAchieved = async (
  lineName: string,
  workOrderNo: string,
  achievement: number,
) => {
  await createNotification({
    title: "Target Achieved! 🎯",
    message: `${lineName} achieved ${achievement.toFixed(1)}% for ${workOrderNo}. Great work!`,
    type: "SUCCESS",
    category: "SYSTEM",
    userId: null,
  });
};

export const notifyTargetMissed = async (
  lineName: string,
  workOrderNo: string,
  achievement: number,
  target: number,
) => {
  await createNotification({
    title: "Target Not Met",
    message: `${lineName} achieved ${achievement.toFixed(1)}% for ${workOrderNo} (target: ${target}%). Review required.`,
    type: "WARNING",
    category: "SYSTEM",
    userId: null,
  });
};

/**
 * Shift Events
 */
export const notifyShiftStart = async (
  lineName: string,
  shiftNumber: number,
) => {
  await createNotification({
    title: "Shift Started",
    message: `Shift ${shiftNumber} production started on ${lineName}.`,
    type: "INFO",
    category: "SYSTEM",
    userId: null,
  });
};

export const notifyShiftEnd = async (
  lineName: string,
  shiftNumber: number,
  totalProduced: number,
  totalPlanned: number,
) => {
  const achievement = ((totalProduced / totalPlanned) * 100).toFixed(1);
  await createNotification({
    title: "Shift Completed",
    message: `Shift ${shiftNumber} on ${lineName} completed. Produced: ${totalProduced}/${totalPlanned} (${achievement}%).`,
    type: "INFO",
    category: "SYSTEM",
    userId: null,
  });
};

/**
 * User/Security Events
 */
export const notifyUserCreated = async (
  newUserName: string,
  newUserNPK: string,
  adminUserId?: string,
) => {
  await createNotification({
    title: "New User Created",
    message: `User "${newUserName}" (${newUserNPK}) has been added to the system.`,
    type: "INFO",
    category: "SECURITY",
    userId: adminUserId || null,
  });
};

export const notifyUserStatusChanged = async (
  userName: string,
  isActive: boolean,
  changedByUserId?: string,
) => {
  await createNotification({
    title: "User Status Changed",
    message: `User "${userName}" has been ${isActive ? "activated" : "deactivated"}.`,
    type: "INFO",
    category: "SECURITY",
    userId: changedByUserId || null,
  });
};

export const notifyPasswordChanged = async (userId: string) => {
  await createNotification({
    title: "Password Changed",
    message:
      "Your password has been successfully changed. If you didn't make this change, please contact administrator immediately.",
    type: "SUCCESS",
    category: "SECURITY",
    userId: userId,
  });
};

export const notifyUnauthorizedAccess = async (
  userName: string,
  resource: string,
) => {
  await createNotification({
    title: "Unauthorized Access Attempt",
    message: `User "${userName}" attempted to access restricted resource: ${resource}.`,
    type: "ERROR",
    category: "SECURITY",
    userId: null, // Notify admins
  });
};

/**
 * Data Import/Export Events
 */
export const notifyDataImported = async (
  entityType: string,
  recordCount: number,
  userId: string,
) => {
  await createNotification({
    title: "Data Import Completed",
    message: `Successfully imported ${recordCount} ${entityType} records.`,
    type: "SUCCESS",
    category: "SYSTEM",
    userId: userId,
  });
};

export const notifyDataImportFailed = async (
  entityType: string,
  errorMessage: string,
  userId: string,
) => {
  await createNotification({
    title: "Data Import Failed",
    message: `Failed to import ${entityType} data. Error: ${errorMessage}`,
    type: "ERROR",
    category: "SYSTEM",
    userId: userId,
  });
};

/**
 * Report Generation Events
 */
export const notifyReportGenerated = async (
  reportType: string,
  dateRange: string,
  userId?: string,
) => {
  await createNotification({
    title: "Report Ready",
    message: `Your ${reportType} report for ${dateRange} is ready to download.`,
    type: "SUCCESS",
    category: "REPORTS",
    userId: userId,
  });
};

/**
 * System Maintenance Events
 */
export const notifySystemMaintenance = async (
  maintenanceTime: string,
  durationMinutes: number,
) => {
  await createNotification({
    title: "Scheduled Maintenance",
    message: `System maintenance scheduled for ${maintenanceTime}. Expected duration: ${durationMinutes} minutes.`,
    type: "WARNING",
    category: "SYSTEM",
    userId: null, // Broadcast
  });
};

export const notifySystemError = async (
  errorType: string,
  errorMessage: string,
) => {
  await createNotification({
    title: "System Error",
    message: `${errorType}: ${errorMessage}. IT team has been notified.`,
    type: "ERROR",
    category: "SYSTEM",
    userId: null, // Broadcast
  });
};
