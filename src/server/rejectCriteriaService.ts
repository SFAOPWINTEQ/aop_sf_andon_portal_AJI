"use server";

import { revalidatePath } from "next/cache";
import * as rejectCriteriaRepository from "./rejectCriteriaRepository";
import {
  createRejectCriteriaSchema,
  updateRejectCriteriaSchema,
  deleteRejectCriteriaSchema,
  type CreateRejectCriteriaInput,
  type UpdateRejectCriteriaInput,
  type RejectCriteriasResponse,
  type RejectCriteriaDetailResponse,
} from "./rejectCriteriaModel";
import type { SearchFilter } from "@/components/ui/multi-column-search";

/**
 * Get paginated RejectCriterias with search and sorting
 */
export async function getRejectCriterias(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  category?: string;
  plantId?: string;
}): Promise<RejectCriteriasResponse> {
  try {
    const result = await rejectCriteriaRepository.getRejectCriterias(params);

    return {
      success: true,
      rejectCriterias: result.rejectCriterias.map((rejectCriteria) => ({
        id: rejectCriteria.id,
        lineId: rejectCriteria.lineId,
        lineName: rejectCriteria.line.name,
        category: rejectCriteria.category,
        name: rejectCriteria.name,
        createdAt: rejectCriteria.createdAt,
        updatedAt: rejectCriteria.updatedAt,
        deletedAt: rejectCriteria.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching reject criterias:", error);
    return {
      success: false,
      message: "Failed to fetch reject criterias",
      rejectCriterias: [],
    };
  }
}

/**
 * Get all RejectCriterias for export (no pagination)
 */
export async function getAllRejectCriteriasForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  category?: string;
  plantId?: string;
}): Promise<RejectCriteriasResponse> {
  try {
    const rejectCriterias =
      await rejectCriteriaRepository.getAllForExport(params);

    return {
      success: true,
      rejectCriterias: rejectCriterias.map((rejectCriteria) => ({
        id: rejectCriteria.id,
        lineId: rejectCriteria.lineId,
        lineName: rejectCriteria.line.name,
        category: rejectCriteria.category,
        name: rejectCriteria.name,
        createdAt: rejectCriteria.createdAt,
        updatedAt: rejectCriteria.updatedAt,
        deletedAt: rejectCriteria.deletedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all reject criterias for export:", error);
    return {
      success: false,
      message: "Failed to fetch reject criterias for export",
      rejectCriterias: [],
    };
  }
}

/**
 * Get RejectCriteria by ID
 */
export async function getRejectCriteriaById(
  id: string,
): Promise<RejectCriteriaDetailResponse> {
  try {
    const rejectCriteria =
      await rejectCriteriaRepository.getRejectCriteriaById(id);

    if (!rejectCriteria) {
      return {
        success: false,
        message: "Reject criteria not found",
      };
    }

    return {
      success: true,
      message: "Reject criteria retrieved successfully",
      rejectCriteria: {
        id: rejectCriteria.id,
        lineId: rejectCriteria.lineId,
        lineName: rejectCriteria.line.name,
        category: rejectCriteria.category,
        name: rejectCriteria.name,
        createdAt: rejectCriteria.createdAt,
        updatedAt: rejectCriteria.updatedAt,
        deletedAt: rejectCriteria.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching reject criteria:", error);
    return {
      success: false,
      message: "Failed to fetch reject criteria",
    };
  }
}

/**
 * Create a new RejectCriteria
 */
export async function createRejectCriteria(
  data: CreateRejectCriteriaInput,
): Promise<RejectCriteriaDetailResponse> {
  try {
    // Validate input
    const validation = createRejectCriteriaSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if reject criteria already exists with same lineId, category, and name
    const alreadyExists =
      await rejectCriteriaRepository.rejectCriteriaExistsInLineAndCategory(
        validatedData.lineId,
        validatedData.category,
        validatedData.name,
      );

    if (alreadyExists) {
      return {
        success: false,
        message:
          "A reject criteria with this name already exists in this line and category",
      };
    }

    // Create reject criteria
    const rejectCriteria =
      await rejectCriteriaRepository.createRejectCriteria(validatedData);

    revalidatePath("/reject-criteria");

    return {
      success: true,
      message: "Reject criteria created successfully",
      rejectCriteria: {
        id: rejectCriteria.id,
        lineId: rejectCriteria.lineId,
        lineName: rejectCriteria.line.name,
        category: rejectCriteria.category,
        name: rejectCriteria.name,
        createdAt: rejectCriteria.createdAt,
        updatedAt: rejectCriteria.updatedAt,
        deletedAt: rejectCriteria.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error creating reject criteria:", error);
    return {
      success: false,
      message: "Failed to create reject criteria",
    };
  }
}

/**
 * Update a RejectCriteria
 */
export async function updateRejectCriteria(
  id: string,
  data: UpdateRejectCriteriaInput,
): Promise<RejectCriteriaDetailResponse> {
  try {
    // Validate input
    const validation = updateRejectCriteriaSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if reject criteria exists
    const existingRejectCriteria =
      await rejectCriteriaRepository.getRejectCriteriaById(id);

    if (!existingRejectCriteria) {
      return {
        success: false,
        message: "Reject criteria not found",
      };
    }

    // If updating lineId, category, or name, check for uniqueness
    if (validatedData.lineId || validatedData.category || validatedData.name) {
      const newLineId = validatedData.lineId || existingRejectCriteria.lineId;
      const newCategory =
        validatedData.category || existingRejectCriteria.category;
      const newName = validatedData.name || existingRejectCriteria.name;

      const alreadyExists =
        await rejectCriteriaRepository.rejectCriteriaExistsInLineAndCategory(
          newLineId,
          newCategory,
          newName,
          id,
        );

      if (alreadyExists) {
        return {
          success: false,
          message:
            "A reject criteria with this name already exists in this line and category",
        };
      }
    }

    // Update reject criteria
    const rejectCriteria = await rejectCriteriaRepository.updateRejectCriteria(
      id,
      validatedData,
    );

    revalidatePath("/reject-criteria");

    return {
      success: true,
      message: "Reject criteria updated successfully",
      rejectCriteria: {
        id: rejectCriteria.id,
        lineId: rejectCriteria.lineId,
        lineName: rejectCriteria.line.name,
        category: rejectCriteria.category,
        name: rejectCriteria.name,
        createdAt: rejectCriteria.createdAt,
        updatedAt: rejectCriteria.updatedAt,
        deletedAt: rejectCriteria.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error updating reject criteria:", error);
    return {
      success: false,
      message: "Failed to update reject criteria",
    };
  }
}

/**
 * Delete a RejectCriteria (soft delete)
 */
export async function deleteRejectCriteria(
  id: string,
): Promise<RejectCriteriaDetailResponse> {
  try {
    // Validate input
    const validation = deleteRejectCriteriaSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if reject criteria exists
    const existingRejectCriteria =
      await rejectCriteriaRepository.getRejectCriteriaById(id);

    if (!existingRejectCriteria) {
      return {
        success: false,
        message: "Reject criteria not found",
      };
    }

    // Soft delete
    await rejectCriteriaRepository.deleteRejectCriteria(id);

    revalidatePath("/reject-criteria");

    return {
      success: true,
      message: "Reject criteria deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting reject criteria:", error);
    return {
      success: false,
      message: "Failed to delete reject criteria",
    };
  }
}

/**
 * Get template data for importing reject criterias
 */
export async function getRejectCriteriaTemplateData(): Promise<{
  success: boolean;
  templateData?: Array<Record<string, unknown>>;
  instructions?: string[];
  message?: string;
}> {
  try {
    // Sample template data
    const templateData = [
      {
        lineName: "Line A",
        category: "NG Setting",
        name: "Dent",
      },
      {
        lineName: "Line A",
        category: "NG Regular",
        name: "Scratch",
      },
      {
        lineName: "Line B",
        category: "NG Process",
        name: "Crack",
      },
    ];

    // Instructions
    const instructions = [
      "This template is for importing Reject Criterias into the system.",
      "Fill in the data in the 'Data' sheet following the format provided.",
      "REQUIRED FIELDS: lineName, category, name",
      "lineName: The name of the production line (must exist in the system)",
      "category: The rejection category (e.g., 'NG Setting', 'NG Regular', 'NG Process')",
      "name: The name of the reject criteria (e.g., 'Dent', 'Scratch', 'Crack', 'Discoloration')",
      "Each combination of [lineName + category + name] must be unique",
      "Empty rows will be skipped during import",
      "After filling the data, save the file and use the Import function",
      "The system will validate each row and report any errors",
    ];

    return {
      success: true,
      templateData,
      instructions,
    };
  } catch (error) {
    console.error("Error getting template data:", error);
    return {
      success: false,
      message: "Failed to get template data",
    };
  }
}

/**
 * Import RejectCriterias from Excel data
 */
export async function importRejectCriterias(
  data: Array<{
    lineName: string;
    category: string;
    name: string;
  }>,
  lineNameToIdMap: Record<string, string>,
): Promise<{
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; error: string }>;
}> {
  const errors: Array<{ row: number; error: string }> = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

      try {
        // Validate required fields
        if (!row.lineName || !row.category || !row.name) {
          errors.push({
            row: rowNumber,
            error: "Missing required fields (lineName, category, or name)",
          });
          failureCount++;
          continue;
        }

        // Get lineId from line name
        const lineId = lineNameToIdMap[row.lineName.trim()];
        if (!lineId) {
          errors.push({
            row: rowNumber,
            error: `Line "${row.lineName}" not found`,
          });
          failureCount++;
          continue;
        }

        // Validate with schema
        const validation = createRejectCriteriaSchema.safeParse({
          lineId,
          category: row.category.trim(),
          name: row.name.trim(),
        });

        if (!validation.success) {
          errors.push({
            row: rowNumber,
            error: validation.error.issues[0].message,
          });
          failureCount++;
          continue;
        }

        const validatedData = validation.data;

        // Check if already exists
        const alreadyExists =
          await rejectCriteriaRepository.rejectCriteriaExistsInLineAndCategory(
            validatedData.lineId,
            validatedData.category,
            validatedData.name,
          );

        if (alreadyExists) {
          errors.push({
            row: rowNumber,
            error: `Reject criteria "${row.name}" already exists in line "${row.lineName}" and category "${row.category}"`,
          });
          failureCount++;
          continue;
        }

        // Create reject criteria
        await rejectCriteriaRepository.createRejectCriteria(validatedData);
        successCount++;
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        failureCount++;
      }
    }

    revalidatePath("/reject-criteria");

    return {
      success: successCount > 0,
      message:
        successCount > 0
          ? `Import completed: ${successCount} succeeded, ${failureCount} failed`
          : "Import failed: No records were created",
      successCount,
      failureCount,
      errors,
    };
  } catch (error) {
    console.error("Error importing reject criterias:", error);
    return {
      success: false,
      message: "Failed to import reject criterias",
      successCount: 0,
      failureCount: data.length,
      errors: [
        {
          row: 0,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      ],
    };
  }
}
