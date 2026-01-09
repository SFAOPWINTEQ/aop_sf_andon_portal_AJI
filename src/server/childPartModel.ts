import { z } from "zod";

/**
 * =========================
 * Zod Schemas for Child Child Part
 * =========================
 */

export const createChildPartSchema = z.object({
  childPartNo: z
    .string()
    .min(1, "Child part number is required")
    .max(100, "Child part number must not exceed 100 characters"),
  childPartname: z
    .string()
    .min(1, "Child part name is required")
    .max(200, "Child part name must not exceed 200 characters"),
  partId: z.string().min(1),
  qtyLotSupply: z
    .number()
    .int("Quantity lot supply must be an integer")
    .positive("Quantity lot supply must be positive")
    .optional()
    .nullable(),
});

export const updateChildPartSchema = z.object({
  childPartNo: z
    .string()
    .min(1, "Child part number is required")
    .max(100, "Child part number must not exceed 100 characters"),
  childPartname: z
    .string()
    .min(1, "Child part name is required")
    .max(200, "Child part name must not exceed 200 characters"),
  partId: z.string().min(1, "Parent part is required"),
  qtyLotSupply: z
    .number()
    .int("Quantity lot supply must be an integer")
    .positive("Quantity lot supply must be positive")
    .optional()
    .nullable(),
});

export const deleteChildPartSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * =========================
 * TypeScript Types
 * =========================
 */

export type CreateChildPartInput = z.infer<typeof createChildPartSchema>;
export type UpdateChildPartInput = z.infer<typeof updateChildPartSchema>;
export type DeleteChildPartInput = z.infer<typeof deleteChildPartSchema>;

export interface ChildPartResponse {
  id: string;
  childPartNo: string;
  childPartname: string;
  qtyLotSupply: number | null;

  partId: string;
  lineId: string;
  plantId: string;

  // display-only
  partNo?: string;
  partSku?: string;
  partName?: string;
  lineName?: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ChildPartsResponse {
  success: boolean;
  message?: string;
  childParts: ChildPartResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChildPartDetailResponse {
  success: boolean;
  message?: string;
  childPart?: ChildPartResponse;
}
