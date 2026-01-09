"use server";

import { revalidatePath } from "next/cache";
import * as productionPlanRepository from "./productionPlanRepository";
import { shiftRepository } from "./shiftRepository";
import {
  createProductionPlanSchema,
  updateProductionPlanSchema,
  deleteProductionPlanSchema,
  type CreateProductionPlanInput,
  type UpdateProductionPlanInput,
  type ProductionPlanResponse,
  type ProductionPlansResponse,
} from "./productionPlanModel";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import {
  notifyProductionPlanCreated,
  notifyProductionPlanStarted,
  notifyProductionPlanCompleted,
  notifyProductionPlanCanceled,
  notifyTargetAchieved,
  notifyTargetMissed,
  notifyHighRejectRate,
} from "@/lib/notifications";

/**
 * Get paginated Production Plans with search and sorting
 */
export async function getProductionPlans(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
  shiftId?: string;
  partId?: string;
  status?: string;
  planDate?: Date;
}): Promise<ProductionPlansResponse> {
  try {
    const result = await productionPlanRepository.getAll(params);

    return {
      success: true,
      productionPlans: result.productionPlans.map((plan) => ({
        id: plan.id,
        workOrderNo: plan.workOrderNo,
        planDate: plan.planDate,
        lineId: plan.lineId,
        lineName: plan.line.name,
        plantName: plan.line.plant?.name,
        shiftId: plan.shiftId,
        shiftNumber: plan.shift.number,
        partId: plan.partId,
        partNo: plan.part.partNo,
        partName: plan.part.name,
        cycleTimeSec: plan.cycleTimeSec,
        plannedQty: plan.plannedQty,
        actualQty: plan.actualQty,
        ngQty: plan.ngQty,
        sequence: plan.sequence,
        status: plan.status,
        startedAt: plan.startedAt,
        completedAt: plan.completedAt,
        createdById: plan.createdById,
        createdByName: plan.createdBy?.name,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching production plans:", error);
    return {
      success: false,
      message: "Failed to fetch production plans",
      productionPlans: [],
    };
  }
}

/**
 * Get all Production Plans for export (no pagination)
 */
export async function getAllProductionPlansForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
  shiftId?: string;
  partId?: string;
  status?: string;
  planDate?: Date;
}): Promise<ProductionPlansResponse> {
  try {
    const result = await productionPlanRepository.getAllForExport(params);

    return {
      success: true,
      productionPlans: result.productionPlans.map((plan) => ({
        id: plan.id,
        workOrderNo: plan.workOrderNo,
        planDate: plan.planDate,
        lineId: plan.lineId,
        lineName: plan.line.name,
        plantName: plan.line.plant?.name,
        shiftId: plan.shiftId,
        shiftNumber: plan.shift.number,
        partId: plan.partId,
        partNo: plan.part.partNo,
        partName: plan.part.name,
        cycleTimeSec: plan.cycleTimeSec,
        plannedQty: plan.plannedQty,
        actualQty: plan.actualQty,
        ngQty: plan.ngQty,
        sequence: plan.sequence,
        status: plan.status,
        startedAt: plan.startedAt,
        completedAt: plan.completedAt,
        createdById: plan.createdById,
        createdByName: plan.createdBy?.name,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all production plans for export:", error);
    return {
      success: false,
      message: "Failed to fetch production plans for export",
      productionPlans: [],
    };
  }
}

/**
 * Get Production Plan by ID
 */
export async function getProductionPlanById(
  id: string,
): Promise<ProductionPlanResponse> {
  try {
    const plan = await productionPlanRepository.getById(id);

    if (!plan) {
      return {
        success: false,
        message: "Production plan not found",
      };
    }

    return {
      success: true,
      message: "Production plan retrieved successfully",
      productionPlan: {
        id: plan.id,
        workOrderNo: plan.workOrderNo,
        planDate: plan.planDate,
        lineId: plan.lineId,
        lineName: plan.line.name,
        shiftId: plan.shiftId,
        shiftNumber: plan.shift.number,
        partId: plan.partId,
        partNo: plan.part.partNo,
        partName: plan.part.name,
        cycleTimeSec: plan.cycleTimeSec,
        plannedQty: plan.plannedQty,
        actualQty: plan.actualQty,
        ngQty: plan.ngQty,
        sequence: plan.sequence,
        status: plan.status,
        startedAt: plan.startedAt,
        completedAt: plan.completedAt,
        createdById: plan.createdById,
        createdByName: plan.createdBy?.name,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        productDetails: plan.productDetails?.map((detail) => ({
          id: detail.id,
          sequenceNo: detail.sequenceNo,
          completedAt: detail.completedAt,
          cycleTimeSec: detail.cycleTimeSec,
          isGood: detail.isGood,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching production plan:", error);
    return {
      success: false,
      message: "Failed to fetch production plan",
    };
  }
}

/**
 * Create a new Production Plan
 */
export async function createProductionPlan(
  data: CreateProductionPlanInput,
): Promise<ProductionPlanResponse> {
  try {
    // Validate input
    const validation = createProductionPlanSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check for duplicate work order number on the same date, line, and shift
    const workOrderAlreadyExists =
      await productionPlanRepository.workOrderExists(
        validatedData.workOrderNo,
        validatedData.planDate,
        validatedData.lineId,
        validatedData.shiftId,
      );

    if (workOrderAlreadyExists) {
      return {
        success: false,
        message:
          "A production plan with this work order number already exists for the selected date, line, and shift",
      };
    }

    // Check for duplicate sequence on the same date, line, and shift
    const sequenceAlreadyExists = await productionPlanRepository.sequenceExists(
      validatedData.planDate,
      validatedData.lineId,
      validatedData.shiftId,
      validatedData.sequence,
    );

    if (sequenceAlreadyExists) {
      return {
        success: false,
        message:
          "A production plan with this sequence number already exists for the selected date, line, and shift",
      };
    }

    const plan = await productionPlanRepository.create(validatedData);

    // Automatically notify about new production plan
    await notifyProductionPlanCreated(
      plan.workOrderNo,
      plan.part.name,
      plan.createdById || undefined,
    );

    revalidatePath("/schedule");

    return {
      success: true,
      message: "Production plan created successfully",
      productionPlan: {
        id: plan.id,
        workOrderNo: plan.workOrderNo,
        planDate: plan.planDate,
        lineId: plan.lineId,
        lineName: plan.line.name,
        shiftId: plan.shiftId,
        shiftNumber: plan.shift.number,
        partId: plan.partId,
        partNo: plan.part.partNo,
        partName: plan.part.name,
        cycleTimeSec: plan.cycleTimeSec,
        plannedQty: plan.plannedQty,
        actualQty: plan.actualQty,
        ngQty: plan.ngQty,
        sequence: plan.sequence,
        status: plan.status,
        startedAt: plan.startedAt,
        completedAt: plan.completedAt,
        createdById: plan.createdById,
        createdByName: plan.createdBy?.name,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error creating production plan:", error);
    return {
      success: false,
      message: "Failed to create production plan",
    };
  }
}

/**
 * Update an existing Production Plan
 */
export async function updateProductionPlan(
  id: string,
  data: UpdateProductionPlanInput,
): Promise<ProductionPlanResponse> {
  try {
    // Validate input
    const validation = updateProductionPlanSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if production plan exists
    const existingPlan = await productionPlanRepository.getById(id);
    if (!existingPlan) {
      return {
        success: false,
        message: "Production plan not found",
      };
    }

    // Check for duplicate work order if being updated
    if (
      validatedData.workOrderNo ||
      validatedData.planDate ||
      validatedData.lineId ||
      validatedData.shiftId
    ) {
      const workOrderAlreadyExists =
        await productionPlanRepository.workOrderExists(
          validatedData.workOrderNo || existingPlan.workOrderNo,
          validatedData.planDate || existingPlan.planDate,
          validatedData.lineId || existingPlan.lineId,
          validatedData.shiftId || existingPlan.shiftId,
          id, // Exclude current record
        );

      if (workOrderAlreadyExists) {
        return {
          success: false,
          message:
            "A production plan with this work order number already exists for the selected date, line, and shift",
        };
      }
    }

    // Check for duplicate sequence if being updated
    if (
      validatedData.sequence ||
      validatedData.planDate ||
      validatedData.lineId ||
      validatedData.shiftId
    ) {
      const sequenceAlreadyExists =
        await productionPlanRepository.sequenceExists(
          validatedData.planDate || existingPlan.planDate,
          validatedData.lineId || existingPlan.lineId,
          validatedData.shiftId || existingPlan.shiftId,
          validatedData.sequence || existingPlan.sequence,
          id, // Exclude current record
        );

      if (sequenceAlreadyExists) {
        return {
          success: false,
          message:
            "A production plan with this sequence number already exists for the selected date, line, and shift",
        };
      }
    }

    // Track status changes for notifications
    const isStatusChanging =
      validatedData.status && validatedData.status !== existingPlan.status;
    const oldStatus = existingPlan.status;
    const newStatus = validatedData.status;

    const plan = await productionPlanRepository.update(id, validatedData);

    // Send notifications based on status changes
    if (isStatusChanging) {
      // Production started
      if (oldStatus === "OPEN" && newStatus === "RUNNING") {
        await notifyProductionPlanStarted(
          plan.workOrderNo,
          plan.line.name,
          plan.part.name,
        );
      }

      // Production completed
      if (newStatus === "CLOSED") {
        await notifyProductionPlanCompleted(
          plan.workOrderNo,
          plan.line.name,
          plan.actualQty,
          plan.plannedQty,
        );

        // Check achievement
        const achievement = (plan.actualQty / plan.plannedQty) * 100;
        if (achievement >= 100) {
          await notifyTargetAchieved(
            plan.line.name,
            plan.workOrderNo,
            achievement,
          );
        } else if (achievement < 95) {
          await notifyTargetMissed(
            plan.line.name,
            plan.workOrderNo,
            achievement,
            100,
          );
        }

        // Check reject rate
        if (plan.ngQty > 0) {
          const totalProduced = plan.actualQty + plan.ngQty;
          const rejectRate = (plan.ngQty / totalProduced) * 100;
          const REJECT_THRESHOLD = 5; // 5%

          if (rejectRate > REJECT_THRESHOLD) {
            await notifyHighRejectRate(
              plan.line.name,
              plan.workOrderNo,
              rejectRate,
              REJECT_THRESHOLD,
            );
          }
        }
      }

      // Production canceled
      if (newStatus === "CANCELED") {
        await notifyProductionPlanCanceled(plan.workOrderNo);
      }
    }

    revalidatePath("/schedule");

    return {
      success: true,
      message: "Production plan updated successfully",
      productionPlan: {
        id: plan.id,
        workOrderNo: plan.workOrderNo,
        planDate: plan.planDate,
        lineId: plan.lineId,
        lineName: plan.line.name,
        shiftId: plan.shiftId,
        shiftNumber: plan.shift.number,
        partId: plan.partId,
        partNo: plan.part.partNo,
        partName: plan.part.name,
        cycleTimeSec: plan.cycleTimeSec,
        plannedQty: plan.plannedQty,
        actualQty: plan.actualQty,
        ngQty: plan.ngQty,
        sequence: plan.sequence,
        status: plan.status,
        startedAt: plan.startedAt,
        completedAt: plan.completedAt,
        createdById: plan.createdById,
        createdByName: plan.createdBy?.name,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error updating production plan:", error);
    return {
      success: false,
      message: "Failed to update production plan",
    };
  }
}

/**
 * Delete a Production Plan
 */
export async function deleteProductionPlan(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate input
    const validation = deleteProductionPlanSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const existingPlan = await productionPlanRepository.getById(id);
    if (!existingPlan) {
      return {
        success: false,
        message: "Production plan not found",
      };
    }

    // Don't allow deletion of running or completed plans
    if (existingPlan.status === "RUNNING" || existingPlan.status === "CLOSED") {
      return {
        success: false,
        message: `Cannot delete a ${existingPlan.status.toLowerCase()} production plan`,
      };
    }

    await productionPlanRepository.remove(id);

    revalidatePath("/schedule");

    return {
      success: true,
      message: "Production plan deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting production plan:", error);
    return {
      success: false,
      message: "Failed to delete production plan",
    };
  }
}

/**
 * Get template data for Excel import
 */
export async function getProductionPlanTemplateData() {
  try {
    return {
      success: true,
      templateData: [
        {
          workOrderNo: "P000001",
          planDate: "2025-01-15",
          lineName: "Line 1",
          shiftNumber: 1,
          partNo: "PART-001",
          cycleTimeSec: 60,
          plannedQty: 100,
          sequence: 1,
          status: "OPEN",
        },
      ],
      instructions: {
        title: "Production Plan Import Instructions",
        description:
          "Use this template to import multiple production plans at once.",
        fields: [
          {
            field: "workOrderNo",
            description:
              "Work order number (must be unique per date/line/shift)",
            required: true,
          },
          {
            field: "planDate",
            description: "Plan date in YYYY-MM-DD format",
            required: true,
          },
          {
            field: "lineName",
            description: "Production line name (must exist in system)",
            required: true,
          },
          {
            field: "shiftNumber",
            description: "Shift number (must exist for the line)",
            required: true,
          },
          {
            field: "partNo",
            description: "Part number (must exist in system)",
            required: true,
          },
          {
            field: "cycleTimeSec",
            description: "Cycle time in seconds",
            required: true,
          },
          {
            field: "plannedQty",
            description: "Planned quantity",
            required: true,
          },
          {
            field: "sequence",
            description:
              "Production sequence (must be unique per date/line/shift)",
            required: true,
          },
          {
            field: "status",
            description: "Status: OPEN, RUNNING, CLOSED, or CANCELED",
            required: false,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating template data:", error);
    return {
      success: false,
      message: "Failed to generate template data",
    };
  }
}

/**
 * Import production plans from Excel data
 */
export async function importProductionPlans(
  data: Array<{
    workOrderNo: string;
    planDate: string;
    lineName: string;
    shiftNumber: string | number;
    partNo: string;
    cycleTimeSec: string | number;
    plannedQty: string | number;
    sequence: string | number;
    status?: string;
  }>,
  lineNameToIdMap: Record<string, string>,
  shiftMap: Record<string, Record<number, string>>, // lineId -> shiftNumber -> shiftId
  partNoToIdMap: Record<string, string>,
) {
  const results = {
    successCount: 0,
    failureCount: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 for 1-based index and header row

    try {
      // Validate required fields
      if (!row.workOrderNo?.trim()) {
        throw new Error("Work order number is required");
      }
      if (!row.planDate?.trim()) {
        throw new Error("Plan date is required");
      }
      if (!row.lineName?.trim()) {
        throw new Error("Line name is required");
      }
      if (!row.shiftNumber) {
        throw new Error("Shift number is required");
      }
      if (!row.partNo?.trim()) {
        throw new Error("Part number is required");
      }
      if (!row.cycleTimeSec) {
        throw new Error("Cycle time is required");
      }
      if (!row.plannedQty) {
        throw new Error("Planned quantity is required");
      }
      if (!row.sequence) {
        throw new Error("Sequence is required");
      }

      // Get line ID
      const lineId = lineNameToIdMap[row.lineName.trim()];
      if (!lineId) {
        throw new Error(`Line "${row.lineName}" not found`);
      }

      // Get shift ID
      const shiftNumber = Number(row.shiftNumber);
      const shiftId = shiftMap[lineId]?.[shiftNumber];
      if (!shiftId) {
        throw new Error(
          `Shift ${shiftNumber} not found for line "${row.lineName}"`,
        );
      }

      // Get part ID
      const partId = partNoToIdMap[row.partNo.trim()];
      if (!partId) {
        throw new Error(`Part "${row.partNo}" not found`);
      }

      // Parse date
      const planDate = new Date(row.planDate);
      if (Number.isNaN(planDate.getTime())) {
        throw new Error("Invalid plan date format (use YYYY-MM-DD)");
      }

      // Parse numeric values
      const cycleTimeSec = Number(row.cycleTimeSec);
      if (Number.isNaN(cycleTimeSec) || cycleTimeSec < 1) {
        throw new Error("Cycle time must be a positive number");
      }

      const plannedQty = Number(row.plannedQty);
      if (Number.isNaN(plannedQty) || plannedQty < 1) {
        throw new Error("Planned quantity must be a positive number");
      }

      const sequence = Number(row.sequence);
      if (Number.isNaN(sequence) || sequence < 1) {
        throw new Error("Sequence must be a positive number");
      }

      // Validate status
      const statusStr = row.status?.trim().toUpperCase() || "OPEN";
      if (!["OPEN", "RUNNING", "CLOSED", "CANCELED"].includes(statusStr)) {
        throw new Error("Status must be OPEN, RUNNING, CLOSED, or CANCELED");
      }
      const status = statusStr as "OPEN" | "RUNNING" | "CLOSED" | "CANCELED";

      // Create production plan
      const result = await createProductionPlan({
        workOrderNo: row.workOrderNo.trim(),
        planDate,
        lineId,
        shiftId,
        partId,
        cycleTimeSec,
        plannedQty,
        sequence,
        status,
      });

      if (result.success) {
        results.successCount++;
      } else {
        throw new Error(result.message || "Failed to create production plan");
      }
    } catch (error) {
      results.failureCount++;
      results.errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Get the next sequence number for a given date
 */
export async function getNextSequenceForDate(
  planDate: Date,
): Promise<{ success: boolean; sequence?: number; message?: string }> {
  try {
    // Get the start and end of the day in UTC
    const startOfDay = new Date(planDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(planDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the maximum sequence for this date
    const maxSequencePlan =
      await productionPlanRepository.getMaxSequenceForDate(
        startOfDay,
        endOfDay,
      );

    const nextSequence = maxSequencePlan ? maxSequencePlan.sequence + 1 : 1;

    return {
      success: true,
      sequence: nextSequence,
    };
  } catch (error) {
    console.error("Error getting next sequence:", error);
    return {
      success: false,
      message: "Failed to get next sequence number",
    };
  }
}

export async function getNextSequenceForLineShift(
  planDate: Date,
  lineId: string,
  shiftId: string,
): Promise<{ success: boolean; sequence?: number; message?: string }> {
  try {
    // Get the start and end of the day in UTC
    const startOfDay = new Date(planDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(planDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the maximum sequence for this date, line, and shift
    const maxSequencePlan =
      await productionPlanRepository.getMaxSequenceForLineShift(
        startOfDay,
        endOfDay,
        lineId,
        shiftId,
      );

    const nextSequence = maxSequencePlan ? maxSequencePlan.sequence + 1 : 1;

    return {
      success: true,
      sequence: nextSequence,
    };
  } catch (error) {
    console.error("Error getting next sequence:", error);
    return {
      success: false,
      message: "Failed to get next sequence number",
    };
  }
}

export async function getNextWorkOrderNo(
  planDate: Date,
): Promise<{ success: boolean; workOrderNo?: string; message?: string }> {
  try {
    // Format: WO-YYMMDDXXXX
    const year = planDate.getFullYear().toString().slice(-2);
    const month = (planDate.getMonth() + 1).toString().padStart(2, "0");
    const day = planDate.getDate().toString().padStart(2, "0");
    const datePrefix = `WO-${year}${month}${day}`;

    // Get the start and end of the day in UTC
    const startOfDay = new Date(planDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(planDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find work orders for this date to get the next sequence number
    const workOrdersForDate =
      await productionPlanRepository.getWorkOrdersForDate(startOfDay, endOfDay);

    // Find the highest sequence number for this date
    let maxSequence = 0;
    const pattern = new RegExp(`^${datePrefix}(\\d{4})$`);

    for (const plan of workOrdersForDate) {
      const match = plan.workOrderNo.match(pattern);
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }

    const nextSequence = (maxSequence + 1).toString().padStart(4, "0");
    const workOrderNo = `${datePrefix}${nextSequence}`;

    return {
      success: true,
      workOrderNo,
    };
  } catch (error) {
    console.error("Error generating work order number:", error);
    return {
      success: false,
      message: "Failed to generate work order number",
    };
  }
}

/**
 * Calculate available time and maximum planned quantity for a specific sequence
 */
export async function getAvailableTimeForSequence(
  planDate: Date,
  lineId: string,
  shiftId: string,
  sequence: number,
  cycleTimeSec: number,
  currentPlanId?: string, // For edit mode, exclude current plan from calculation
): Promise<{
  success: boolean;
  totalLoadingTimeSec?: number;
  usedTimeSec?: number;
  availableTimeSec?: number;
  maxPlannedQty?: number;
  message?: string;
  details?: {
    sequenceNumber: number;
    usedTimeForSequence: number;
    plans: Array<{
      workOrderNo: string;
      sequence: number;
      plannedQty: number;
      cycleTimeSec: number;
      totalTimeSec: number;
    }>;
  };
}> {
  try {
    // Get shift details to retrieve loading time
    const shift = await shiftRepository.getById(shiftId);
    if (!shift) {
      return {
        success: false,
        message: "Shift not found",
      };
    }

    const totalLoadingTimeSec = shift.loadingTimeInSec;

    // Get the start and end of the day in UTC
    const startOfDay = new Date(planDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(planDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all production plans for this date, line, and shift
    const allPlans = await productionPlanRepository.getAll({
      lineId,
      shiftId,
      planDate,
      sortBy: "sequence",
      sortOrder: "asc",
    });

    // Calculate used time for sequences before the current sequence
    let usedTimeSec = 0;
    const planDetails: Array<{
      workOrderNo: string;
      sequence: number;
      plannedQty: number;
      cycleTimeSec: number;
      totalTimeSec: number;
    }> = [];

    for (const plan of allPlans.productionPlans) {
      // Skip if this is the current plan being edited
      if (currentPlanId && plan.id === currentPlanId) {
        continue;
      }

      // Only count plans with sequence less than current sequence
      if (plan.sequence < sequence) {
        const planTimeSec = plan.plannedQty * plan.cycleTimeSec;
        usedTimeSec += planTimeSec;
        planDetails.push({
          workOrderNo: plan.workOrderNo,
          sequence: plan.sequence,
          plannedQty: plan.plannedQty,
          cycleTimeSec: plan.cycleTimeSec,
          totalTimeSec: planTimeSec,
        });
      }
    }

    // Calculate available time for this sequence
    const availableTimeSec = Math.max(0, totalLoadingTimeSec - usedTimeSec);

    // Calculate maximum planned quantity
    const maxPlannedQty =
      cycleTimeSec > 0 ? Math.floor(availableTimeSec / cycleTimeSec) : 0;

    return {
      success: true,
      totalLoadingTimeSec,
      usedTimeSec,
      availableTimeSec,
      maxPlannedQty,
      details: {
        sequenceNumber: sequence,
        usedTimeForSequence: usedTimeSec,
        plans: planDetails,
      },
    };
  } catch (error) {
    console.error("Error calculating available time:", error);
    return {
      success: false,
      message: "Failed to calculate available time",
    };
  }
}
