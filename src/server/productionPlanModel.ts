import { z } from "zod";

// Create Production Plan Schema
export const createProductionPlanSchema = z.object({
  workOrderNo: z.string().min(1, "Work order number is required"),
  planDate: z.coerce.date({
    message: "Plan date is required",
  }),
  lineId: z.string().cuid("Invalid line ID"),
  shiftId: z.string().cuid("Invalid shift ID"),
  partId: z.string().cuid("Invalid part ID"),
  cycleTimeSec: z.number().min(0.01, "Cycle time must be at least 0.01 second"),
  plannedQty: z.number().int().min(1, "Planned quantity must be at least 1"),
  sequence: z.number().int().min(1, "Sequence must be at least 1").default(1),
  status: z.enum(["OPEN", "RUNNING", "CLOSED", "CANCELED"]).default("OPEN"),
  createdById: z.string().cuid("Invalid user ID").optional().nullable(),
});

// Update Production Plan Schema
export const updateProductionPlanSchema = z.object({
  workOrderNo: z.string().min(1, "Work order number is required").optional(),
  planDate: z.date().optional(),
  lineId: z.string().cuid("Invalid line ID").optional(),
  shiftId: z.string().cuid("Invalid shift ID").optional(),
  partId: z.string().cuid("Invalid part ID").optional(),
  cycleTimeSec: z
    .number()
    .min(0.01, "Cycle time must be at least 0.01 second")
    .optional(),
  plannedQty: z
    .number()
    .int()
    .min(1, "Planned quantity must be at least 1")
    .optional(),
  actualQty: z
    .number()
    .int()
    .min(0, "Actual quantity cannot be negative")
    .optional(),
  ngQty: z.number().int().min(0, "NG quantity cannot be negative").optional(),
  sequence: z.number().int().min(1, "Sequence must be at least 1").optional(),
  status: z.enum(["OPEN", "RUNNING", "CLOSED", "CANCELED"]).optional(),
  startedAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  createdById: z.string().cuid("Invalid user ID").optional().nullable(),
});

// Delete Production Plan Schema
export const deleteProductionPlanSchema = z.object({
  id: z.string().cuid("Invalid production plan ID"),
});

// Types
export type CreateProductionPlanInput = z.infer<
  typeof createProductionPlanSchema
>;
export type UpdateProductionPlanInput = z.infer<
  typeof updateProductionPlanSchema
>;
export type DeleteProductionPlanInput = z.infer<
  typeof deleteProductionPlanSchema
>;

// Response types
export type ProductionPlanResponse = {
  success: boolean;
  message?: string;
  productionPlan?: {
    id: string;
    workOrderNo: string;
    planDate: Date;
    lineId: string;
    lineName?: string;
    shiftId: string;
    shiftNumber?: number;
    partId: string;
    partNo?: string;
    partName?: string;
    cycleTimeSec: number;
    plannedQty: number;
    actualQty: number;
    ngQty: number;
    sequence: number;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    createdById: string | null;
    createdByName?: string;
    createdAt: Date;
    updatedAt: Date;
    productDetails?: Array<{
      id: string;
      sequenceNo: number;
      completedAt: Date;
      cycleTimeSec: number | null;
      isGood: boolean;
    }>;
  };
};

export type ProductionPlansResponse = {
  success: boolean;
  message?: string;
  productionPlans: Array<{
    id: string;
    workOrderNo: string;
    planDate: Date;
    lineId: string;
    lineName?: string;
    shiftId: string;
    shiftNumber?: number;
    partId: string;
    partNo?: string;
    partName?: string;
    cycleTimeSec: number;
    plannedQty: number;
    actualQty: number;
    ngQty: number;
    sequence: number;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    createdById: string | null;
    createdByName?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
