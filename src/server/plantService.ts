"use server";

import { revalidatePath } from "next/cache";
import * as plantRepository from "./plantRepository";
import {
  createPlantSchema,
  updatePlantSchema,
  deletePlantSchema,
  type CreatePlantInput,
  type UpdatePlantInput,
  type PlantResponse,
  type PlantsResponse,
} from "./plantModel";
import type { SearchFilter } from "./plantRepository";

/**
 * Get paginated Plants with search and sorting
 */
export async function getPlants(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PlantsResponse> {
  try {
    const result = await plantRepository.getAll(params);

    return {
      success: true,
      plants: result.plants.map((plant) => ({
        id: plant.id,
        name: plant.name,
        subplant: plant.subplant,
        isActive: plant.isActive,
        createdAt: plant.createdAt,
        updatedAt: plant.updatedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching plants:", error);
    return {
      success: false,
      message: "Failed to fetch plants",
      plants: [],
    };
  }
}

/**
 * Get all Plants for export (no pagination)
 */
export async function getAllPlantsForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PlantsResponse> {
  try {
    const result = await plantRepository.getAllForExport(params);

    return {
      success: true,
      plants: result.plants.map((plant) => ({
        id: plant.id,
        name: plant.name,
        subplant: plant.subplant,
        isActive: plant.isActive,
        createdAt: plant.createdAt,
        updatedAt: plant.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all plants for export:", error);
    return {
      success: false,
      message: "Failed to fetch plants for export",
      plants: [],
    };
  }
}

/**
 * Get Plant by ID
 */
export async function getPlantById(id: string): Promise<PlantResponse> {
  try {
    const plant = await plantRepository.getById(id);

    if (!plant) {
      return {
        success: false,
        message: "Plant not found",
      };
    }

    return {
      success: true,
      message: "Plant retrieved successfully",
      plant: {
        id: plant.id,
        name: plant.name,
        subplant: plant.subplant,
        isActive: plant.isActive,
        createdAt: plant.createdAt,
        updatedAt: plant.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching plant:", error);
    return {
      success: false,
      message: "Failed to fetch plant",
    };
  }
}

/**
 * Create a new Plant
 */
export async function createPlant(
  data: CreatePlantInput,
): Promise<PlantResponse> {
  try {
    // Validate input
    const validation = createPlantSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check for duplicate name
    const existingPlant = await plantRepository.getByName(validatedData.name);

    if (existingPlant) {
      return {
        success: false,
        message: "A plant with this name already exists",
      };
    }

    const plant = await plantRepository.create(validatedData);

    revalidatePath("/plants");

    return {
      success: true,
      message: "Plant created successfully",
      plant: {
        id: plant.id,
        name: plant.name,
        subplant: plant.subplant,
        isActive: plant.isActive,
        createdAt: plant.createdAt,
        updatedAt: plant.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error creating plant:", error);
    return {
      success: false,
      message: "Failed to create plant",
    };
  }
}

/**
 * Update an existing Plant
 */
export async function updatePlant(
  id: string,
  data: UpdatePlantInput,
): Promise<PlantResponse> {
  try {
    // Validate input
    const validation = updatePlantSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if plant exists
    const existingPlant = await plantRepository.getById(id);
    if (!existingPlant) {
      return {
        success: false,
        message: "Plant not found",
      };
    }

    // Check for duplicate name if being updated
    if (validatedData.name) {
      const duplicatePlant = await plantRepository.getByName(
        validatedData.name,
        id,
      );

      if (duplicatePlant) {
        return {
          success: false,
          message: "A plant with this name already exists",
        };
      }
    }

    const plant = await plantRepository.update(id, validatedData);

    revalidatePath("/plants");

    return {
      success: true,
      message: "Plant updated successfully",
      plant: {
        id: plant.id,
        name: plant.name,
        subplant: plant.subplant,
        isActive: plant.isActive,
        createdAt: plant.createdAt,
        updatedAt: plant.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error updating plant:", error);
    return {
      success: false,
      message: "Failed to update plant",
    };
  }
}

/**
 * Delete a Plant (soft delete)
 */
export async function deletePlant(id: string): Promise<PlantResponse> {
  try {
    // Validate input
    const validation = deletePlantSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if plant exists
    const plant = await plantRepository.getById(id);
    if (!plant) {
      return {
        success: false,
        message: "Plant not found",
      };
    }

    await plantRepository.remove(id);

    revalidatePath("/plants");

    return {
      success: true,
      message: "Plant deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting plant:", error);
    return {
      success: false,
      message: "Failed to delete plant",
    };
  }
}

/**
 * Get template data for Excel import
 */
export async function getPlantTemplateData() {
  try {
    return {
      success: true,
      templateData: [
        {
          name: "Plant 1",
          subplant: "Subplant A",
          isActive: "TRUE",
        },
      ],
      instructions: [
        "Plant Import Instructions",
        "Use this template to import multiple plants at once.",
        "",
        "name: Plant name (required, must be unique)",
        "subplant: Subplant identifier (required)",
        "isActive: Active status - TRUE or FALSE (required)",
        "",
        "Notes:",
        "- name must be unique",
        "- isActive must be either TRUE or FALSE",
        "- All fields are required",
      ],
    };
  } catch (error) {
    console.error("Error generating template:", error);
    return {
      success: false,
      message: "Failed to generate template",
    };
  }
}

/**
 * Import plants from Excel data
 */
export async function importPlants(
  data: Array<{
    name: string;
    subplant: string;
    isActive: string;
  }>,
) {
  const results = {
    successCount: 0,
    failureCount: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header row

    try {
      // Validate required fields
      if (!row.name || !row.subplant || !row.isActive) {
        results.failureCount++;
        results.errors.push({
          row: rowNumber,
          error: "Missing required fields (name, subplant, isActive)",
        });
        continue;
      }

      // Parse isActive
      const isActiveStr = String(row.isActive).trim().toUpperCase();
      const isActive =
        isActiveStr === "TRUE" || isActiveStr === "YES" || isActiveStr === "1";

      // Check for duplicate
      const existing = await plantRepository.getByName(row.name);
      if (existing) {
        results.failureCount++;
        results.errors.push({
          row: rowNumber,
          error: `Plant "${row.name}" already exists`,
        });
        continue;
      }

      // Create plant
      const result = await createPlant({
        name: row.name,
        subplant: row.subplant,
        isActive,
      });

      if (result.success) {
        results.successCount++;
      } else {
        results.failureCount++;
        results.errors.push({
          row: rowNumber,
          error: result.message || "Unknown error",
        });
      }
    } catch (error) {
      results.failureCount++;
      results.errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}
