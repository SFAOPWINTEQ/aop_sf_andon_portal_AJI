"use server";

import { revalidatePath } from "next/cache";
import * as updtCategoryRepository from "./updtCategoryRepository";
import {
  createUpdtCategorySchema,
  updateUpdtCategorySchema,
  deleteUpdtCategorySchema,
  type CreateUpdtCategoryInput,
  type UpdateUpdtCategoryInput,
  type UpdtCategoriesResponse,
  type UpdtCategoryDetailResponse,
} from "./updtCategoryModel";
import type { SearchFilter } from "@/components/ui/multi-column-search";

/**
 * Get paginated UpdtCategories with search and sorting
 */
export async function getUpdtCategories(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  department?: string;
  plantId?: string;
}): Promise<UpdtCategoriesResponse> {
  try {
    const result = await updtCategoryRepository.getUpdtCategories(params);

    return {
      success: true,
      updtCategories: result.updtCategories.map((updtCategory) => ({
        id: updtCategory.id,
        department: updtCategory.department,
        lineId: updtCategory.lineId,
        lineName: updtCategory.line.name,
        name: updtCategory.name,
        createdAt: updtCategory.createdAt,
        updatedAt: updtCategory.updatedAt,
        deletedAt: updtCategory.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching UPDT categories:", error);
    return {
      success: false,
      message: "Failed to fetch UPDT categories",
      updtCategories: [],
    };
  }
}

/**
 * Get all UpdtCategories for export (no pagination)
 */
export async function getAllUpdtCategoriesForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  department?: string;
  plantId?: string;
}): Promise<UpdtCategoriesResponse> {
  try {
    const result = await updtCategoryRepository.getAllForExport(params);

    return {
      success: true,
      updtCategories: result.updtCategories.map((updtCategory) => ({
        id: updtCategory.id,
        department: updtCategory.department,
        lineId: updtCategory.lineId,
        lineName: updtCategory.line.name,
        name: updtCategory.name,
        createdAt: updtCategory.createdAt,
        updatedAt: updtCategory.updatedAt,
        deletedAt: updtCategory.deletedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all UPDT categories for export:", error);
    return {
      success: false,
      message: "Failed to fetch UPDT categories for export",
      updtCategories: [],
    };
  }
}

/**
 * Get UpdtCategory by ID
 */
export async function getUpdtCategoryById(
  id: string,
): Promise<UpdtCategoryDetailResponse> {
  try {
    const updtCategory = await updtCategoryRepository.getById(id);

    if (!updtCategory) {
      return {
        success: false,
        message: "UPDT category not found",
      };
    }

    return {
      success: true,
      message: "UPDT category retrieved successfully",
      updtCategory: {
        id: updtCategory.id,
        department: updtCategory.department,
        lineId: updtCategory.lineId,
        lineName: updtCategory.line.name,
        name: updtCategory.name,
        createdAt: updtCategory.createdAt,
        updatedAt: updtCategory.updatedAt,
        deletedAt: updtCategory.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching UPDT category:", error);
    return {
      success: false,
      message: "Failed to fetch UPDT category",
    };
  }
}

/**
 * Create a new UpdtCategory
 */
export async function createUpdtCategory(
  data: CreateUpdtCategoryInput,
): Promise<UpdtCategoryDetailResponse> {
  try {
    // Validate input
    const validation = createUpdtCategorySchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if category already exists with same lineId, department, and name
    const categoryAlreadyExists = await updtCategoryRepository.categoryExists(
      validatedData.lineId,
      validatedData.department,
      validatedData.name,
    );

    if (categoryAlreadyExists) {
      return {
        success: false,
        message: `Category "${validatedData.name}" already exists in department "${validatedData.department}" for this line`,
      };
    }

    // Create UPDT category
    const updtCategory = await updtCategoryRepository.create({
      department: validatedData.department,
      lineId: validatedData.lineId,
      name: validatedData.name,
    });

    revalidatePath("/updt-categories");

    return {
      success: true,
      message: "UPDT category created successfully",
      updtCategory: {
        id: updtCategory.id,
        department: updtCategory.department,
        lineId: updtCategory.lineId,
        lineName: updtCategory.line.name,
        name: updtCategory.name,
        createdAt: updtCategory.createdAt,
        updatedAt: updtCategory.updatedAt,
        deletedAt: updtCategory.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error creating UPDT category:", error);
    return {
      success: false,
      message: "Failed to create UPDT category",
    };
  }
}

/**
 * Update an UpdtCategory
 */
export async function updateUpdtCategory(
  id: string,
  data: UpdateUpdtCategoryInput,
): Promise<UpdtCategoryDetailResponse> {
  try {
    // Validate input
    const validation = updateUpdtCategorySchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if UPDT category exists
    const existingUpdtCategory = await updtCategoryRepository.getById(id);
    if (!existingUpdtCategory) {
      return {
        success: false,
        message: "UPDT category not found",
      };
    }

    // Check if new combination conflicts with existing category
    if (
      validatedData.lineId ||
      validatedData.department ||
      validatedData.name
    ) {
      const lineId = validatedData.lineId || existingUpdtCategory.lineId;
      const department =
        validatedData.department || existingUpdtCategory.department;
      const name = validatedData.name || existingUpdtCategory.name;

      const categoryAlreadyExists = await updtCategoryRepository.categoryExists(
        lineId,
        department,
        name,
        id,
      );

      if (categoryAlreadyExists) {
        return {
          success: false,
          message: `Category "${name}" already exists in department "${department}" for this line`,
        };
      }
    }

    // Update UPDT category
    const updtCategory = await updtCategoryRepository.update(id, validatedData);

    revalidatePath("/updt-categories");

    return {
      success: true,
      message: "UPDT category updated successfully",
      updtCategory: {
        id: updtCategory.id,
        department: updtCategory.department,
        lineId: updtCategory.lineId,
        lineName: updtCategory.line.name,
        name: updtCategory.name,
        createdAt: updtCategory.createdAt,
        updatedAt: updtCategory.updatedAt,
        deletedAt: updtCategory.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error updating UPDT category:", error);
    return {
      success: false,
      message: "Failed to update UPDT category",
    };
  }
}

/**
 * Delete an UpdtCategory (soft delete)
 */
export async function deleteUpdtCategory(
  id: string,
): Promise<UpdtCategoryDetailResponse> {
  try {
    // Validate input
    const validation = deleteUpdtCategorySchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if UPDT category exists
    const existingUpdtCategory = await updtCategoryRepository.getById(id);
    if (!existingUpdtCategory) {
      return {
        success: false,
        message: "UPDT category not found",
      };
    }

    // Soft delete UPDT category
    await updtCategoryRepository.deleteUpdtCategory(id);

    revalidatePath("/updt-categories");

    return {
      success: true,
      message: "UPDT category deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting UPDT category:", error);
    return {
      success: false,
      message: "Failed to delete UPDT category",
    };
  }
}

/**
 * Get template data for UPDT Category import
 */
export async function getUpdtCategoryTemplateData(): Promise<{
  success: boolean;
  templateData?: Array<{
    lineName: string;
    department: string;
    name: string;
  }>;
  instructions?: string[];
  message?: string;
}> {
  try {
    const templateData = [
      {
        lineName: "Line 1",
        department: "Production",
        name: "Machine Breakdown",
      },
      { lineName: "Line 1", department: "Quality", name: "Material Defect" },
    ];

    const instructions = [
      "Fill in the UPDT Category data in the 'Data' sheet",
      "Column 'lineName': Enter the line name (required, must exist in Lines master)",
      "Column 'department': Enter the department name (required)",
      "Column 'name': Enter the category name (required)",
      "Note: Combination of line, department, and name must be unique",
      "Do not modify the column headers",
      "Delete the sample rows and add your own data",
      "Save the file and upload it using the Import button",
    ];

    return {
      success: true,
      templateData,
      instructions,
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
 * Import UPDT Categories from Excel data
 */
export async function importUpdtCategories(
  data: Array<{
    lineName: string;
    department: string;
    name: string;
  }>,
  lineNameToIdMap: Record<string, string>,
): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; error: string }>;
  message?: string;
}> {
  const errors: Array<{ row: number; error: string }> = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.lineName || row.lineName.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Line name is required",
          });
          failureCount++;
          continue;
        }

        if (!row.department || row.department.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Department is required",
          });
          failureCount++;
          continue;
        }

        if (!row.name || row.name.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Category name is required",
          });
          failureCount++;
          continue;
        }

        // Get line ID from mapping
        const lineId = lineNameToIdMap[row.lineName.trim()];
        if (!lineId) {
          errors.push({
            row: rowNumber,
            error: `Line '${row.lineName.trim()}' not found`,
          });
          failureCount++;
          continue;
        }

        // Check if combination already exists
        const exists = await updtCategoryRepository.categoryExists(
          lineId,
          row.department.trim(),
          row.name.trim(),
        );
        if (exists) {
          errors.push({
            row: rowNumber,
            error: `UPDT Category '${row.name.trim()}' already exists in line '${row.lineName.trim()}' and department '${row.department.trim()}'`,
          });
          failureCount++;
          continue;
        }

        // Validate with Zod schema
        const validationResult = createUpdtCategorySchema.safeParse({
          lineId,
          department: row.department.trim(),
          name: row.name.trim(),
        });

        if (!validationResult.success) {
          const errorMessages = validationResult.error.issues
            .map((e: { message: string }) => e.message)
            .join(", ");
          errors.push({
            row: rowNumber,
            error: errorMessages,
          });
          failureCount++;
          continue;
        }

        // Create UPDT category
        await updtCategoryRepository.create({
          lineId,
          department: validationResult.data.department,
          name: validationResult.data.name,
        });

        successCount++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        failureCount++;
      }
    }

    revalidatePath("/updt-categories");

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      errors,
      message:
        successCount > 0
          ? `Successfully imported ${successCount} UPDT categor${successCount === 1 ? "y" : "ies"}`
          : "No UPDT categories were imported",
    };
  } catch (error) {
    console.error("Error during import:", error);
    return {
      success: false,
      successCount,
      failureCount,
      errors,
      message: "An error occurred during import",
    };
  }
}
