import { z } from "zod";

/**
 * =========================
 * Zod Schemas for RejectCriteria
 * =========================
 */

export const rejectCriteriaCategories = ["NG Setting", "NG Regular"] as const;

export const createRejectCriteriaSchema = z.object({
  lineId: z.string().min(1, "Line is required"),
  category: z.enum(rejectCriteriaCategories),
  name: z
    .string()
    .min(1, "Reject criteria name is required")
    .max(100, "Reject criteria name must not exceed 100 characters"),
});

export const updateRejectCriteriaSchema = z.object({
  lineId: z.string().min(1, "Line is required").optional(),
  category: z.enum(rejectCriteriaCategories).optional(),
  name: z
    .string()
    .min(1, "Reject criteria name is required")
    .max(100, "Reject criteria name must not exceed 100 characters")
    .optional(),
});

export const deleteRejectCriteriaSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * =========================
 * TypeScript Types
 * =========================
 */

export type CreateRejectCriteriaInput = z.infer<
  typeof createRejectCriteriaSchema
>;
export type UpdateRejectCriteriaInput = z.infer<
  typeof updateRejectCriteriaSchema
>;
export type DeleteRejectCriteriaInput = z.infer<
  typeof deleteRejectCriteriaSchema
>;

export interface RejectCriteriaResponse {
  id: string;
  lineId: string;
  lineName?: string;
  category: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RejectCriteriasResponse {
  success: boolean;
  message?: string;
  rejectCriterias: RejectCriteriaResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RejectCriteriaDetailResponse {
  success: boolean;
  message?: string;
  rejectCriteria?: RejectCriteriaResponse;
}
