"use server";

import { revalidatePath } from "next/cache";
import * as pdtCategoryRepository from "./pdtCategoryRepository";
import {
  createPdtCategorySchema,
  updatePdtCategorySchema,
  deletePdtCategorySchema,
  type CreatePdtCategoryInput,
  type UpdatePdtCategoryInput,
  type PdtCategoriesResponse,
  type PdtCategoryDetailResponse,
} from "./pdtCategoryModel";
import type { SearchFilter } from "@/components/ui/multi-column-search";

/**
 * Get paginated PdtCategories with search and sorting
 */
export async function getPdtCategories(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PdtCategoriesResponse> {
  try {
    const result = await pdtCategoryRepository.getPdtCategories(params);

    return {
      success: true,
      pdtCategories: result.pdtCategories.map((pdtCategory) => ({
        id: pdtCategory.id,
        name: pdtCategory.name,
        defaultDurationMin: pdtCategory.defaultDurationMin,
        createdAt: pdtCategory.createdAt,
        updatedAt: pdtCategory.updatedAt,
        deletedAt: pdtCategory.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching PDT categories:", error);
    return {
      success: false,
      message: "Failed to fetch PDT categories",
      pdtCategories: [],
    };
  }
}

/**
 * Get all PdtCategories for export (no pagination)
 */
export async function getAllPdtCategoriesForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PdtCategoriesResponse> {
  try {
    const result = await pdtCategoryRepository.getAllForExport(params);

    return {
      success: true,
      pdtCategories: result.pdtCategories.map((pdtCategory) => ({
        id: pdtCategory.id,
        name: pdtCategory.name,
        defaultDurationMin: pdtCategory.defaultDurationMin,
        createdAt: pdtCategory.createdAt,
        updatedAt: pdtCategory.updatedAt,
        deletedAt: pdtCategory.deletedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all PDT categories for export:", error);
    return {
      success: false,
      message: "Failed to fetch PDT categories for export",
      pdtCategories: [],
    };
  }
}

/**
 * Get PdtCategory by ID
 */
export async function getPdtCategoryById(
  id: string,
): Promise<PdtCategoryDetailResponse> {
  try {
    const pdtCategory = await pdtCategoryRepository.getById(id);

    if (!pdtCategory) {
      return {
        success: false,
        message: "PDT category not found",
      };
    }

    return {
      success: true,
      message: "PDT category retrieved successfully",
      pdtCategory: {
        id: pdtCategory.id,
        name: pdtCategory.name,
        defaultDurationMin: pdtCategory.defaultDurationMin,
        createdAt: pdtCategory.createdAt,
        updatedAt: pdtCategory.updatedAt,
        deletedAt: pdtCategory.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching PDT category:", error);
    return {
      success: false,
      message: "Failed to fetch PDT category",
    };
  }
}

/**
 * Create a new PdtCategory
 */
export async function createPdtCategory(
  data: CreatePdtCategoryInput,
): Promise<PdtCategoryDetailResponse> {
  try {
    // Validate input
    const validation = createPdtCategorySchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if category name already exists
    const nameAlreadyExists = await pdtCategoryRepository.nameExists(
      validatedData.name,
    );

    if (nameAlreadyExists) {
      return {
        success: false,
        message: `Category name "${validatedData.name}" already exists`,
      };
    }

    // Create PDT category
    const pdtCategory = await pdtCategoryRepository.create({
      name: validatedData.name,
      defaultDurationMin: validatedData.defaultDurationMin,
    });

    revalidatePath("/pdt-categories");

    return {
      success: true,
      message: "PDT category created successfully",
      pdtCategory: {
        id: pdtCategory.id,
        name: pdtCategory.name,
        defaultDurationMin: pdtCategory.defaultDurationMin,
        createdAt: pdtCategory.createdAt,
        updatedAt: pdtCategory.updatedAt,
        deletedAt: pdtCategory.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error creating PDT category:", error);
    return {
      success: false,
      message: "Failed to create PDT category",
    };
  }
}

/**
 * Update a PdtCategory
 */
export async function updatePdtCategory(
  id: string,
  data: UpdatePdtCategoryInput,
): Promise<PdtCategoryDetailResponse> {
  try {
    // Validate input
    const validation = updatePdtCategorySchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if PDT category exists
    const existingPdtCategory = await pdtCategoryRepository.getById(id);
    if (!existingPdtCategory) {
      return {
        success: false,
        message: "PDT category not found",
      };
    }

    // Check if new name conflicts with existing category
    if (validatedData.name) {
      const nameAlreadyExists = await pdtCategoryRepository.nameExists(
        validatedData.name,
        id,
      );

      if (nameAlreadyExists) {
        return {
          success: false,
          message: `Category name "${validatedData.name}" already exists`,
        };
      }
    }

    // Update PDT category
    const pdtCategory = await pdtCategoryRepository.update(id, validatedData);

    revalidatePath("/pdt-categories");

    return {
      success: true,
      message: "PDT category updated successfully",
      pdtCategory: {
        id: pdtCategory.id,
        name: pdtCategory.name,
        defaultDurationMin: pdtCategory.defaultDurationMin,
        createdAt: pdtCategory.createdAt,
        updatedAt: pdtCategory.updatedAt,
        deletedAt: pdtCategory.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error updating PDT category:", error);
    return {
      success: false,
      message: "Failed to update PDT category",
    };
  }
}

/**
 * Delete a PdtCategory (soft delete)
 */
export async function deletePdtCategory(
  id: string,
): Promise<PdtCategoryDetailResponse> {
  try {
    // Validate input
    const validation = deletePdtCategorySchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if PDT category exists
    const existingPdtCategory = await pdtCategoryRepository.getById(id);
    if (!existingPdtCategory) {
      return {
        success: false,
        message: "PDT category not found",
      };
    }

    // Soft delete PDT category
    await pdtCategoryRepository.deletePdtCategory(id);

    revalidatePath("/pdt-categories");

    return {
      success: true,
      message: "PDT category deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting PDT category:", error);
    return {
      success: false,
      message: "Failed to delete PDT category",
    };
  }
}

/**
 * Get template data for PDT Category import
 */
export async function getPdtCategoryTemplateData(): Promise<{
  success: boolean;
  templateData?: Array<{
    name: string;
    defaultDurationMin: string;
  }>;
  instructions?: string[];
  message?: string;
}> {
  try {
    const templateData = [
      { name: "Setup", defaultDurationMin: "15" },
      { name: "Changeover", defaultDurationMin: "30" },
      { name: "Maintenance", defaultDurationMin: "60" },
    ];

    const instructions = [
      "Fill in the PDT Category data in the 'Data' sheet",
      "Column 'name': Enter the category name (required, must be unique)",
      "Column 'defaultDurationMin': Enter the default duration in minutes (required, must be a positive integer between 1-1440)",
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
 * Import PDT Categories from Excel data
 */
export async function importPdtCategories(
  data: Array<{
    name: string;
    defaultDurationMin: string;
  }>,
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
        if (!row.name || row.name.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Category name is required",
          });
          failureCount++;
          continue;
        }

        if (!row.defaultDurationMin || row.defaultDurationMin.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Default duration is required",
          });
          failureCount++;
          continue;
        }

        // Parse defaultDurationMin
        const defaultDurationMin = parseInt(row.defaultDurationMin.trim(), 10);
        if (Number.isNaN(defaultDurationMin) || defaultDurationMin <= 0) {
          errors.push({
            row: rowNumber,
            error: "Default duration must be a positive number",
          });
          failureCount++;
          continue;
        }

        // Check if name already exists
        const nameExists = await pdtCategoryRepository.nameExists(
          row.name.trim(),
        );
        if (nameExists) {
          errors.push({
            row: rowNumber,
            error: `PDT Category '${row.name.trim()}' already exists`,
          });
          failureCount++;
          continue;
        }

        // Validate with Zod schema
        const validationResult = createPdtCategorySchema.safeParse({
          name: row.name.trim(),
          defaultDurationMin,
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

        // Create PDT category
        await pdtCategoryRepository.create({
          name: validationResult.data.name,
          defaultDurationMin: validationResult.data.defaultDurationMin,
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

    revalidatePath("/pdt-categories");

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      errors,
      message:
        successCount > 0
          ? `Successfully imported ${successCount} PDT categor${successCount === 1 ? "y" : "ies"}`
          : "No PDT categories were imported",
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
