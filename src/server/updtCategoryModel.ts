import { z } from "zod";

/**
 * =========================
 * Zod Schemas for UpdtCategory
 * =========================
 */

export const createUpdtCategorySchema = z.object({
  department: z
    .string()
    .min(1, "Department is required")
    .max(100, "Department must not exceed 100 characters"),
  lineId: z.string().min(1, "Line is required"),
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must not exceed 100 characters"),
});

export const updateUpdtCategorySchema = z.object({
  department: z
    .string()
    .min(1, "Department is required")
    .max(100, "Department must not exceed 100 characters")
    .optional(),
  lineId: z.string().min(1, "Line is required").optional(),
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must not exceed 100 characters")
    .optional(),
});

export const deleteUpdtCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
});

/**
 * =========================
 * TypeScript Types
 * =========================
 */

export type CreateUpdtCategoryInput = z.infer<typeof createUpdtCategorySchema>;
export type UpdateUpdtCategoryInput = z.infer<typeof updateUpdtCategorySchema>;
export type DeleteUpdtCategoryInput = z.infer<typeof deleteUpdtCategorySchema>;

export interface UpdtCategoryResponse {
  id: string;
  department: string;
  lineId: string;
  lineName?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UpdtCategoriesResponse {
  success: boolean;
  message?: string;
  updtCategories: UpdtCategoryResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdtCategoryDetailResponse {
  success: boolean;
  message?: string;
  updtCategory?: UpdtCategoryResponse;
}
