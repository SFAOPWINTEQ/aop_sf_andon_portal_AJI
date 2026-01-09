import { z } from "zod";

// Create Machine
export const createMachineSchema = z.object({
  lineId: z.string().cuid("Invalid line ID"),
  name: z.string().min(1, "Required machine name"),
  machineTypeId: z.string().cuid("Invalid machine type ID"),
});

// Update Machine
export const updateMachineSchema = z.object({
  lineId: z.string().cuid("Invalid line ID").optional(),
  name: z.string().min(1, "Required machine name").optional(),
  machineTypeId: z.string().cuid("Invalid machine type ID").optional(),
});

// Delete Machine
export const deleteMachineSchema = z.object({
  id: z.string().cuid("Invalid machine ID"),
});

// Types
export type CreateMachineInput = z.infer<typeof createMachineSchema>;
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>;

// Response types
export type MachineResponse = {
  success: boolean;
  message: string;
  machine?: {
    id: string;
    name: string;
    lineId: string;
    machineTypeId: string;
    sequence: number;
  };
};

export type MachinesResponse = {
  success: boolean;
  message?: string;
  machines: Array<{
    id: string;
    lineId: string;
    name: string;
    machineTypeId: string;
    sequence: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;
};