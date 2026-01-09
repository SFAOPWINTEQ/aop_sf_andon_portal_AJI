import { z } from "zod";

// Create
export const createMachineTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase and without spaces"),
});

// Update
export const updateMachineTypeSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
});

// Delete
export const deleteMachineTypeSchema = z.object({
  id: z.string().uuid("Invalid machine type ID"),
});

// Types
export type CreateMachineTypeInput = z.infer<
  typeof createMachineTypeSchema
>;
export type UpdateMachineTypeInput = z.infer<
  typeof updateMachineTypeSchema
>;

// Response
export type MachineTypeResponse = {
  success: boolean;
  message: string;
  machineType?: {
    id: string;
    name: string;
    code: string;
  };
};

export type MachineTypesResponse = {
  success: boolean;
  message?: string;
  machineTypes: Array<{
    id: string;
    name: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;
};