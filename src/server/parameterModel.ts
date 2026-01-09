import { z } from "zod";

export const createParameterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  opcTagName: z.string().min(1, "OPC Tag is required"),
});

export const updateParameterSchema = createParameterSchema.partial();

export const deleteParameterSchema = z.object({
  id: z.string().uuid(),
});

export type CreateParameterInput = z.infer<
  typeof createParameterSchema
>;
export type UpdateParameterInput = z.infer<
  typeof updateParameterSchema
>;

export interface ParameterResponse {
  success: boolean;
  message?: string;
  parameter?: any;
}