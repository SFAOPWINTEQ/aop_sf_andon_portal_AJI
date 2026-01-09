"use server";

import { revalidatePath } from "next/cache";
import * as partRepository from "./partRepository";
import {
  createPartSchema,
  updatePartSchema,
  deletePartSchema,
  type CreatePartInput,
  type UpdatePartInput,
  type PartsResponse,
  type PartDetailResponse,
} from "./partModel";
import type { SearchFilter } from "@/components/ui/multi-column-search";

/**
 * Get paginated Parts with search and sorting
 */
export async function getParts(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}): Promise<PartsResponse> {
  try {
    const result = await partRepository.getParts(params);

    return {
      success: true,
      parts: result.parts.map((part) => ({
        id: part.id,
        sku: part.sku,
        partNo: part.partNo,
        name: part.name,
        lineId: part.lineId,
        lineName: part.line?.name,
        qtyPerLot: part.qtyPerLot,
        cycleTimeSec: part.cycleTimeSec,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
        deletedAt: part.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching parts:", error);
    return {
      success: false,
      message: "Failed to fetch parts",
      parts: [],
    };
  }
}

/**
 * Get all Parts for export (no pagination)
 */
export async function getAllPartsForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}): Promise<PartsResponse> {
  try {
    const result = await partRepository.getAllForExport(params);

    return {
      success: true,
      parts: result.parts.map((part) => ({
        id: part.id,
        sku: part.sku,
        partNo: part.partNo,
        name: part.name,
        lineId: part.lineId,
        lineName: part.line?.name,
        qtyPerLot: part.qtyPerLot,
        cycleTimeSec: part.cycleTimeSec,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
        deletedAt: part.deletedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all parts for export:", error);
    return {
      success: false,
      message: "Failed to fetch parts for export",
      parts: [],
    };
  }
}

/**
 * Get Part by ID
 */
export async function getPartById(id: string): Promise<PartDetailResponse> {
  try {
    const part = await partRepository.getById(id);

    if (!part) {
      return {
        success: false,
        message: "Part not found",
      };
    }

    return {
      success: true,
      message: "Part retrieved successfully",
      part: {
        id: part.id,
        sku: part.sku,
        partNo: part.partNo,
        name: part.name,
        lineId: part.lineId,
        lineName: part.line?.name,
        qtyPerLot: part.qtyPerLot,
        cycleTimeSec: part.cycleTimeSec,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
        deletedAt: part.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching part:", error);
    return {
      success: false,
      message: "Failed to fetch part",
    };
  }
}

/**
 * Create a new Part
 */
export async function createPart(
  data: CreatePartInput,
): Promise<PartDetailResponse> {
  try {
    // Validate input
    const validation = createPartSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if SKU already exists (if provided)
    if (validatedData.sku) {
      const skuAlreadyExists = await partRepository.skuExists(
        validatedData.sku,
      );

      if (skuAlreadyExists) {
        return {
          success: false,
          message: `SKU "${validatedData.sku}" already exists`,
        };
      }
    }

    // Check if part number already exists
    const partNoAlreadyExists = await partRepository.partNoExists(
      validatedData.partNo,
    );

    if (partNoAlreadyExists) {
      return {
        success: false,
        message: `Part number "${validatedData.partNo}" already exists`,
      };
    }

    // Create part
    const part = await partRepository.create({
      sku: validatedData.sku,
      partNo: validatedData.partNo,
      name: validatedData.name,
      lineId: validatedData.lineId,
      qtyPerLot: validatedData.qtyPerLot,
      cycleTimeSec: validatedData.cycleTimeSec,
    });

    revalidatePath("/parts");

    return {
      success: true,
      message: "Part created successfully",
      part: {
        id: part.id,
        sku: part.sku,
        partNo: part.partNo,
        name: part.name,
        lineId: part.lineId,
        lineName: part.line?.name,
        qtyPerLot: part.qtyPerLot,
        cycleTimeSec: part.cycleTimeSec,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
        deletedAt: part.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error creating part:", error);
    return {
      success: false,
      message: "Failed to create part",
    };
  }
}

/**
 * Update a Part
 */
export async function updatePart(
  id: string,
  data: UpdatePartInput,
): Promise<PartDetailResponse> {
  try {
    // Validate input
    const validation = updatePartSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if part exists
    const existingPart = await partRepository.getById(id);
    if (!existingPart) {
      return {
        success: false,
        message: "Part not found",
      };
    }

    // Check if new SKU conflicts with existing part
    if (validatedData.sku) {
      const skuAlreadyExists = await partRepository.skuExists(
        validatedData.sku,
        id,
      );

      if (skuAlreadyExists) {
        return {
          success: false,
          message: `SKU "${validatedData.sku}" already exists`,
        };
      }
    }

    // Check if new part number conflicts with existing part
    if (validatedData.partNo) {
      const partNoAlreadyExists = await partRepository.partNoExists(
        validatedData.partNo,
        id,
      );

      if (partNoAlreadyExists) {
        return {
          success: false,
          message: `Part number "${validatedData.partNo}" already exists`,
        };
      }
    }

    // Update part
    const part = await partRepository.update(id, validatedData);

    revalidatePath("/parts");

    return {
      success: true,
      message: "Part updated successfully",
      part: {
        id: part.id,
        sku: part.sku,
        partNo: part.partNo,
        name: part.name,
        lineId: part.lineId,
        lineName: part.line?.name,
        qtyPerLot: part.qtyPerLot,
        cycleTimeSec: part.cycleTimeSec,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
        deletedAt: part.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error updating part:", error);
    return {
      success: false,
      message: "Failed to update part",
    };
  }
}

/**
 * Delete a Part (soft delete)
 */
export async function deletePart(id: string): Promise<PartDetailResponse> {
  try {
    // Validate input
    const validation = deletePartSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if part exists
    const existingPart = await partRepository.getById(id);
    if (!existingPart) {
      return {
        success: false,
        message: "Part not found",
      };
    }

    // Soft delete part
    await partRepository.deletePart(id);

    revalidatePath("/parts");

    return {
      success: true,
      message: "Part deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting part:", error);
    return {
      success: false,
      message: "Failed to delete part",
    };
  }
}

/**
 * Get template data for Part import
 */
export async function getPartTemplateData(): Promise<{
  success: boolean;
  templateData?: Array<{
    sku: string;
    partNo: string;
    name: string;
    lineName: string;
    qtyPerLot: string;
    cycleTimeSec: string;
  }>;
  instructions?: string[];
  message?: string;
}> {
  try {
    const templateData = [
      {
        sku: "SKU001",
        partNo: "P001",
        name: "Part 1",
        lineName: "Line A",
        qtyPerLot: "100",
        cycleTimeSec: "45",
      },
      {
        sku: "SKU002",
        partNo: "P002",
        name: "Part 2",
        lineName: "Line B",
        qtyPerLot: "200",
        cycleTimeSec: "60",
      },
    ];

    const instructions = [
      "Fill in the Part data in the 'Data' sheet",
      "Column 'sku': Enter the SKU code (optional, must be unique if provided)",
      "Column 'partNo': Enter the part number (required, must be unique)",
      "Column 'name': Enter the part name (required)",
      "Column 'lineName': Enter the line name (required, must match existing line name exactly)",
      "Column 'qtyPerLot': Enter the quantity per lot (optional, must be a positive number)",
      "Column 'cycleTimeSec': Enter the cycle time in seconds (optional, must be a positive number)",
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
 * Import Parts from Excel data
 */
export async function importParts(
  data: Array<{
    sku: string;
    partNo: string;
    name: string;
    lineName: string;
    qtyPerLot: string;
    cycleTimeSec: string;
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
        // Validate line name
        if (!row.lineName || row.lineName.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Line name is required",
          });
          failureCount++;
          continue;
        }

        const lineId = lineNameToIdMap[row.lineName.trim()];
        if (!lineId) {
          errors.push({
            row: rowNumber,
            error: `Line "${row.lineName}" not found`,
          });
          failureCount++;
          continue;
        }

        // Validate required fields
        if (!row.partNo || row.partNo.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Part number is required",
          });
          failureCount++;
          continue;
        }

        if (!row.name || row.name.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Part name is required",
          });
          failureCount++;
          continue;
        }

        // Parse optional qtyPerLot
        let qtyPerLot: number | null = null;
        if (row.qtyPerLot && row.qtyPerLot.trim() !== "") {
          qtyPerLot = parseInt(row.qtyPerLot.trim(), 10);
          if (Number.isNaN(qtyPerLot) || qtyPerLot <= 0) {
            errors.push({
              row: rowNumber,
              error: "Quantity per lot must be a positive number",
            });
            failureCount++;
            continue;
          }
        }

        // Parse optional cycleTimeSec
        let cycleTimeSec: number | null = null;
        if (row.cycleTimeSec && row.cycleTimeSec.trim() !== "") {
          cycleTimeSec = parseFloat(row.cycleTimeSec.trim());
          if (Number.isNaN(cycleTimeSec) || cycleTimeSec <= 0) {
            errors.push({
              row: rowNumber,
              error: "Cycle time must be a positive number",
            });
            failureCount++;
            continue;
          }
        }

        // Check if partNo already exists
        const partNoExists = await partRepository.partNoExists(
          row.partNo.trim(),
        );
        if (partNoExists) {
          errors.push({
            row: rowNumber,
            error: `Part number '${row.partNo.trim()}' already exists`,
          });
          failureCount++;
          continue;
        }

        // Check if SKU already exists (if provided)
        if (row.sku && row.sku.trim() !== "") {
          const skuExists = await partRepository.skuExists(row.sku.trim());
          if (skuExists) {
            errors.push({
              row: rowNumber,
              error: `SKU '${row.sku.trim()}' already exists`,
            });
            failureCount++;
            continue;
          }
        }

        // Validate with Zod schema
        const validationResult = createPartSchema.safeParse({
          sku: row.sku && row.sku.trim() !== "" ? row.sku.trim() : undefined,
          partNo: row.partNo.trim(),
          name: row.name.trim(),
          lineId: lineId,
          qtyPerLot: qtyPerLot,
          cycleTimeSec: cycleTimeSec,
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

        // Create part
        await partRepository.create({
          sku: validationResult.data.sku || null,
          partNo: validationResult.data.partNo,
          name: validationResult.data.name,
          lineId: validationResult.data.lineId,
          qtyPerLot: validationResult.data.qtyPerLot || null,
          cycleTimeSec: validationResult.data.cycleTimeSec || null,
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

    revalidatePath("/parts");

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      errors,
      message:
        successCount > 0
          ? `Successfully imported ${successCount} part(s)`
          : "No parts were imported",
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
