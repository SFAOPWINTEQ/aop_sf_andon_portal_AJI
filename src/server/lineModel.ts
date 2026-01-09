import { z } from "zod";

// Create Line Schema
export const createLineSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  plantId: z.string().cuid("Invalid plant ID"),
  isActive: z.boolean(),
});

// Update Line Schema
export const updateLineSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  plantId: z.string().cuid("Invalid plant ID").optional(),
  isActive: z.boolean().optional(),
});

// Delete Line Schema
export const deleteLineSchema = z.object({
  id: z.string().cuid("Invalid line ID"),
});

// Types
export type CreateLineInput = z.infer<typeof createLineSchema>;
export type UpdateLineInput = z.infer<typeof updateLineSchema>;
export type DeleteLineInput = z.infer<typeof deleteLineSchema>;

// Response types
export type LineResponse = {
  success: boolean;
  message: string;
  line?: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

export type LinesResponse = {
  success: boolean;
  message?: string;
  lines: Array<{
    id: string;
    name: string;
    plantId: string;
    plant?: {
      name: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;
};
