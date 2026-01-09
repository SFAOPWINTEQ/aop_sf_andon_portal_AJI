import { z } from "zod";

// -----------------------------
// Create UserPerLine Schema
// -----------------------------
export const createUserPerLineSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  userUid: z.string().min(6, "RFID UID required at least 6 character"),
  lineId: z.string().cuid("Invalid line ID"),
  isActive: z.boolean(),
});

// -----------------------------
// Update UserPerLine Schema
// -----------------------------
export const updateUserPerLineSchema = z.object({
  userId: z.string().cuid("Invalid user ID").optional(),
  userUid: z.string().min(6, "RFID UID required at least 6 character"),
  lineId: z.string().cuid("Invalid line ID").optional(),
  isActive: z.boolean(),
});

// -----------------------------
// Delete UserPerLine Schema
// -----------------------------
export const deleteUserPerLineSchema = z.object({
  id: z.string().cuid("Invalid record ID"),
});

// -----------------------------
// Types
// -----------------------------
export type CreateUserPerLineInput = z.infer<typeof createUserPerLineSchema>;
export type UpdateUserPerLineInput = z.infer<typeof updateUserPerLineSchema>;
export type DeleteUserPerLineInput = z.infer<typeof deleteUserPerLineSchema>;

// -----------------------------
// Response types
// -----------------------------
export type UserPerLineResponse = {
  success: boolean;
  message: string;
  userPerLine?: {
    id: string;
    userUid: string;
    userId: string;
    userName: string;
    userNpk: string | null;
    userRole: string;
    lineId: string;
    lineName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  };
};

export type UserPerLinesResponse = {
  success: boolean;
  message?: string;
  usersPerLine: Array<{
    id: string;
    userUid: string;
    userId: string;
    userName: string;
    userNpk: string | null;
    userRole: string;
    lineId: string;
    lineName: string;
    isActive: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
    updatedAt: Date;
    deletedAt?: Date | null;
  }>;
};