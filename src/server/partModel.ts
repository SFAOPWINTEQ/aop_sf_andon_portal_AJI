import { z } from "zod";

/**
 * =========================
 * Zod Schemas for Part
 * =========================
 */

export const createPartSchema = z.object({
  sku: z
    .string()
    .max(100, "SKU must not exceed 100 characters")
    .optional()
    .nullable(),
  partNo: z
    .string()
    .min(1, "Part number is required")
    .max(100, "Part number must not exceed 100 characters"),
  name: z
    .string()
    .min(1, "Part name is required")
    .max(200, "Part name must not exceed 200 characters"),
  lineId: z.string().min(1, "Line is required"),
  qtyPerLot: z
    .number()
    .int("Quantity per lot must be an integer")
    .positive("Quantity per lot must be positive")
    .optional()
    .nullable(),
  cycleTimeSec: z
    .number()
    .positive("Cycle time must be positive")
    .optional()
    .nullable(),
});

export const updatePartSchema = z.object({
  sku: z
    .string()
    .max(100, "SKU must not exceed 100 characters")
    .optional()
    .nullable(),
  partNo: z
    .string()
    .min(1, "Part number is required")
    .max(100, "Part number must not exceed 100 characters")
    .optional(),
  name: z
    .string()
    .min(1, "Part name is required")
    .max(200, "Part name must not exceed 200 characters")
    .optional(),
  lineId: z.string().min(1, "Line is required").optional(),
  qtyPerLot: z
    .number()
    .int("Quantity per lot must be an integer")
    .positive("Quantity per lot must be positive")
    .optional()
    .nullable(),
  cycleTimeSec: z
    .number()
    .positive("Cycle time must be positive")
    .optional()
    .nullable(),
});

export const deletePartSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * =========================
 * TypeScript Types
 * =========================
 */

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type DeletePartInput = z.infer<typeof deletePartSchema>;

export interface PartResponse {
  id: string;
  sku: string | null;
  partNo: string;
  name: string;
  lineId: string;
  lineName?: string;
  qtyPerLot: number | null;
  cycleTimeSec: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PartsResponse {
  success: boolean;
  message?: string;
  parts: PartResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PartDetailResponse {
  success: boolean;
  message?: string;
  part?: PartResponse;
}
