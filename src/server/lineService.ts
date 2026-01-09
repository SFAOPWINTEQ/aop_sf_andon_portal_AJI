"use server";

import { db } from "@/lib/db";
import { lineRepository, type SearchFilter } from "@/server/lineRepository";
import {
  createLineSchema,
  updateLineSchema,
  deleteLineSchema,
  type CreateLineInput,
  type UpdateLineInput,
  type LineResponse,
  type LinesResponse,
} from "@/server/lineModel";
import { revalidatePath } from "next/cache";

/**
 * Get all lines with pagination, search, and sorting
 */
export async function getLines(params?: {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
}): Promise<
  LinesResponse & {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
> {
  try {
    const result = await lineRepository.getAll(params);
    return {
      success: true,
      lines: result.lines.map((line) => ({
        id: line.id,
        name: line.name,
        plantId: line.plantId,
        plant: line.plant,
        isActive: line.isActive,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
        deletedAt: line.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching lines:", error);
    return {
      success: false,
      message: "Failed to fetch lines",
      lines: [],
    };
  }
}

/**
 * Get all lines for export (no pagination)
 */
export async function getAllLinesForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
}): Promise<LinesResponse> {
  try {
    const result = await lineRepository.getAllForExport(params);

    return {
      success: true,
      lines: result.lines.map((line) => ({
        id: line.id,
        name: line.name,
        plantId: line.plantId,
        plant: line.plant,
        isActive: line.isActive,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
        deletedAt: line.deletedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all lines for export:", error);
    return {
      success: false,
      message: "Failed to fetch lines for export",
      lines: [],
    };
  }
}

/**
 * Get line by ID
 */
export async function getLineById(id: string): Promise<LineResponse> {
  try {
    const line = await lineRepository.getById(id);

    if (!line) {
      return {
        success: false,
        message: "Line not found",
      };
    }

    return {
      success: true,
      message: "Line retrieved successfully",
      line: {
        id: line.id,
        name: line.name,
        isActive: line.isActive,
      },
    };
  } catch (error) {
    console.error("Error fetching line:", error);
    return {
      success: false,
      message: "Failed to fetch line",
    };
  }
}

/**
 * Create a new line
 */
export async function createLine(data: CreateLineInput): Promise<LineResponse> {
  try {
    // Validate input
    const validation = createLineSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const { name, plantId, isActive } = validation.data;

    // Check if line name already exists
    const nameExists = await lineRepository.nameExists(name);
    if (nameExists) {
      return {
        success: false,
        message: "Line name already exists",
      };
    }

    // Create line
    const line = await lineRepository.create({
      name,
      isActive,
      plant: {
        connect: { id: plantId },
      },
    });

    revalidatePath("/lines");

    return {
      success: true,
      message: "Line created successfully",
      line: {
        id: line.id,
        name: line.name,
        isActive: line.isActive,
      },
    };
  } catch (error) {
    console.error("Error creating line:", error);
    return {
      success: false,
      message: "Failed to create line",
    };
  }
}

/**
 * Update a line
 */
export async function updateLine(
  id: string,
  data: UpdateLineInput,
): Promise<LineResponse> {
  try {
    // Validate input
    const validation = updateLineSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if line exists
    const existingLine = await lineRepository.getById(id);
    if (!existingLine) {
      return {
        success: false,
        message: "Line not found",
      };
    }

    // Check if line name is being changed and if it already exists
    if (validatedData.name) {
      const nameExists = await lineRepository.nameExists(
        validatedData.name,
        id,
      );
      if (nameExists) {
        return {
          success: false,
          message: "Line name already exists",
        };
      }
    }

    // Update line
    const line = await lineRepository.update(id, validatedData);

    revalidatePath("/lines");

    return {
      success: true,
      message: "Line updated successfully",
      line: {
        id: line.id,
        name: line.name,
        isActive: line.isActive,
      },
    };
  } catch (error) {
    console.error("Error updating line:", error);
    return {
      success: false,
      message: "Failed to update line",
    };
  }
}

/**
 * Delete a line (soft delete)
 */
export async function deleteLine(id: string): Promise<LineResponse> {
  try {
    // Validate input
    const validation = deleteLineSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if line exists
    const existingLine = await lineRepository.getById(id);
    if (!existingLine) {
      return {
        success: false,
        message: "Line not found",
      };
    }

    // Soft delete line
    await lineRepository.delete(id);

    revalidatePath("/lines");

    return {
      success: true,
      message: "Line deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting line:", error);
    return {
      success: false,
      message: "Failed to delete line",
    };
  }
}

/**
 * Toggle line active status
 */
export async function toggleLineActive(id: string): Promise<LineResponse> {
  try {
    const line = await lineRepository.toggleActive(id);

    revalidatePath("/lines");

    return {
      success: true,
      message: `Line ${line.isActive ? "activated" : "deactivated"} successfully`,
      line: {
        id: line.id,
        name: line.name,
        isActive: line.isActive,
      },
    };
  } catch (error) {
    console.error("Error toggling line status:", error);
    return {
      success: false,
      message: "Failed to toggle line status",
    };
  }
}

/**
 * Get template data for Line import
 */
export async function getLineTemplateData(): Promise<{
  success: boolean;
  templateData?: Array<{ name: string; plantName: string; isActive: string }>;
  instructions?: string[];
  message?: string;
}> {
  try {
    const templateData = [
      { name: "Line 1", plantName: "Plant 1", isActive: "TRUE" },
      { name: "Line 2", plantName: "Plant 1", isActive: "FALSE" },
    ];

    const instructions = [
      "Fill in the Line data in the 'Data' sheet",
      "Column 'name': Enter the line name (required, must be unique)",
      "Column 'plantName': Enter the plant name (required, must match existing plant name exactly)",
      "Column 'isActive': Enter TRUE or FALSE to set active status (required)",
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
 * Import Lines from Excel data
 */
export async function importLines(
  data: Array<{
    name: string;
    plantName: string;
    isActive: string;
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
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header row

      try {
        // Validate required fields
        if (!row.name || row.name.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Line name is required",
          });
          failureCount++;
          continue;
        }

        if (!row.plantName || row.plantName.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Plant name is required",
          });
          failureCount++;
          continue;
        }

        if (!row.isActive || row.isActive.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "isActive is required",
          });
          failureCount++;
          continue;
        }

        // Parse isActive
        const isActiveUpper = row.isActive.trim().toUpperCase();
        if (isActiveUpper !== "TRUE" && isActiveUpper !== "FALSE") {
          errors.push({
            row: rowNumber,
            error: "isActive must be TRUE or FALSE",
          });
          failureCount++;
          continue;
        }

        // Check if plant exists
        const plant = await db.plant.findUnique({
          where: { name: row.plantName.trim() },
        });

        if (!plant) {
          errors.push({
            row: rowNumber,
            error: `Plant '${row.plantName.trim()}' not found`,
          });
          failureCount++;
          continue;
        }

        // Check if line already exists
        const existingLine = await lineRepository.getByName(row.name.trim());
        if (existingLine) {
          errors.push({
            row: rowNumber,
            error: `Line '${row.name.trim()}' already exists`,
          });
          failureCount++;
          continue;
        }

        // Validate with Zod schema
        const validationResult = createLineSchema.safeParse({
          name: row.name.trim(),
          plantId: plant.id,
          isActive: isActiveUpper === "TRUE",
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

        // Create line
        await lineRepository.create({
          name: validationResult.data.name,
          isActive: validationResult.data.isActive,
          plant: {
            connect: { id: plant.id },
          },
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

    revalidatePath("/lines");

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      errors,
      message:
        successCount > 0
          ? `Successfully imported ${successCount} line(s)`
          : "No lines were imported",
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
