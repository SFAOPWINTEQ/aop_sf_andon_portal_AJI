import { z } from "zod";

// Create Plant Schema
export const createPlantSchema = z.object({
  name: z.string().min(1, "Plant name is required"),
  subplant: z.string().min(1, "Subplant is required"),
  isActive: z.boolean(),
});

// Update Plant Schema
export const updatePlantSchema = z.object({
  name: z.string().min(1, "Plant name is required").optional(),
  subplant: z.string().min(1, "Subplant is required").optional(),
  isActive: z.boolean().optional(),
});

// Delete Plant Schema
export const deletePlantSchema = z.object({
  id: z.string().cuid("Invalid plant ID"),
});

// Types
export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;
export type DeletePlantInput = z.infer<typeof deletePlantSchema>;

// Response types
export type PlantResponse = {
  success: boolean;
  message?: string;
  plant?: {
    id: string;
    name: string;
    subplant: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type PlantsResponse = {
  success: boolean;
  message?: string;
  plants: Array<{
    id: string;
    name: string;
    subplant: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
