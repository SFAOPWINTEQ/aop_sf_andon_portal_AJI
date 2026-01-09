import { z } from "zod";

// Helper to validate time string format (HH:mm)
const timeStringSchema = z
  .string()
  .regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    "Invalid time format (use HH:mm)",
  );

// Create Shift Schema
export const createShiftSchema = z.object({
  lineId: z.string().cuid("Invalid line ID"),
  number: z.number().int().min(1, "Shift number must be at least 1"),
  workStart: timeStringSchema,
  workEnd: timeStringSchema,
  break1Start: timeStringSchema.optional().nullable(),
  break1End: timeStringSchema.optional().nullable(),
  break2Start: timeStringSchema.optional().nullable(),
  break2End: timeStringSchema.optional().nullable(),
  break3Start: timeStringSchema.optional().nullable(),
  break3End: timeStringSchema.optional().nullable(),
});

// Update Shift Schema
export const updateShiftSchema = z.object({
  lineId: z.string().cuid("Invalid line ID").optional(),
  number: z.number().int().min(1, "Shift number must be at least 1").optional(),
  workStart: timeStringSchema.optional(),
  workEnd: timeStringSchema.optional(),
  break1Start: timeStringSchema.optional().nullable(),
  break1End: timeStringSchema.optional().nullable(),
  break2Start: timeStringSchema.optional().nullable(),
  break2End: timeStringSchema.optional().nullable(),
  break3Start: timeStringSchema.optional().nullable(),
  break3End: timeStringSchema.optional().nullable(),
});

// Delete Shift Schema
export const deleteShiftSchema = z.object({
  id: z.string().cuid("Invalid shift ID"),
});

// Types
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type DeleteShiftInput = z.infer<typeof deleteShiftSchema>;

// Response types
export type ShiftResponse = {
  success: boolean;
  message: string;
  shift?: {
    id: string;
    lineId: string;
    lineName?: string;
    number: number;
    workStart: string;
    workEnd: string;
    break1Start?: string | null;
    break1End?: string | null;
    break2Start?: string | null;
    break2End?: string | null;
    break3Start?: string | null;
    break3End?: string | null;
    loadingTimeInSec: number;
  };
};

export type ShiftsResponse = {
  success: boolean;
  message?: string;
  shifts: Array<{
    id: string;
    lineId: string;
    lineName?: string;
    number: number;
    workStart: string;
    workEnd: string;
    break1Start?: string | null;
    break1End?: string | null;
    break2Start?: string | null;
    break2End?: string | null;
    break3Start?: string | null;
    break3End?: string | null;
    loadingTimeInSec: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;
};
