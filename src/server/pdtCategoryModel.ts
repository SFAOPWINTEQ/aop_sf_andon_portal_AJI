import { z } from "zod";

/**
 * =========================
 * Zod Schemas for PdtCategory
 * =========================
 */

export const createPdtCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must not exceed 100 characters"),
  defaultDurationMin: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 minute")
    .max(1440, "Duration must not exceed 1440 minutes (24 hours)"),
});

export const updatePdtCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must not exceed 100 characters")
    .optional(),
  defaultDurationMin: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 minute")
    .max(1440, "Duration must not exceed 1440 minutes (24 hours)")
    .optional(),
});

export const deletePdtCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * =========================
 * TypeScript Types
 * =========================
 */

export type CreatePdtCategoryInput = z.infer<typeof createPdtCategorySchema>;
export type UpdatePdtCategoryInput = z.infer<typeof updatePdtCategorySchema>;
export type DeletePdtCategoryInput = z.infer<typeof deletePdtCategorySchema>;

export interface PdtCategoryResponse {
  id: string;
  name: string;
  defaultDurationMin: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PdtCategoriesResponse {
  success: boolean;
  message?: string;
  pdtCategories: PdtCategoryResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PdtCategoryDetailResponse {
  success: boolean;
  message?: string;
  pdtCategory?: PdtCategoryResponse;
}
