import { z } from "zod";

// Create User Schema
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  npk: z.string().min(6, "NPK must be at least 6 characters"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  role: z.enum(["ADMIN", "MANAGER", "USER", "OPERATOR", "FOREMAN", "DIRECTOR"]),
  isActive: z.boolean(),
});

// Update User Schema
export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  npk: z.string().min(6, "NPK must be at least 6 characters").optional(),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters")
    .optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER", "OPERATOR", "FOREMAN", "DIRECTOR"]).optional(),
  isActive: z.boolean().optional(),
});

// Delete User Schema
export const deleteUserSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
});

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

// Response types
export type UserResponse = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    npk: string | null;
    role: string;
    isActive: boolean;
  };
};

export type UsersResponse = {
  success: boolean;
  message?: string;
  users: Array<{
    id: string;
    name: string;
    npk: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }>;
};
