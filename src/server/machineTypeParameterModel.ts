import { z } from "zod";

// Create Machine
export const createMachineTypeParameterSchema = z.object({
  parameterId: z.string().uuid("Invalid parameter ID"),
  machineTypeId: z.string().uuid("Invalid machine type ID"),
});

// Update Machine
export const updateMachineTypeParameterSchema = z.object({
  parameterId: z.string().uuid("Invalid parameter ID").optional(),
  machineTypeId: z.string().uuid("Invalid machine type ID").optional(),
});

// Delete Machine
export const deleteMachineTypeParameterSchema = z.object({
  id: z.string().uuid("Invalid machine type paramter ID"),
});

// Types
export type CreateMachineTypeParameterInput = z.infer<typeof createMachineTypeParameterSchema>;
export type UpdateMachineTypeParameterInput = z.infer<typeof updateMachineTypeParameterSchema>;

// Response types
export type MachineTypeParameterResponse = {
  success: boolean;
  message: string;
  machine?: {
    id: string;
    parameterId: string;
    machineTypeId: string;
  };
};

export type MachinesTypeParameterResponse = {
  success: boolean;
  message?: string;
  machines: Array<{
    id: string;
    parameterId: string;
    machineTypeId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;
};