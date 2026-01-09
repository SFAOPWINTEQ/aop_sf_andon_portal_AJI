import z from "zod";

export const loginSchema = z.object({
  npk: z
    .string()
    .min(6, "Npk must be at least 6 characters")
    .max(100, "NPK is too long"),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters")
    .max(100, "Password is too long"),
  uid: z
    .string()
    .min(4, "UID must be at least 5 characters")
    .optional()
});

export type LoginInput = z.infer<typeof loginSchema>;

// Credentials schema for NextAuth
export const credentialsSchema = z.object({
  id: z.string(),
  npk: z.string(),
  role: z.string(),
  isActive: z.preprocess((val) => val === "true" || val === true, z.boolean()),
});

export type Credentials = z.infer<typeof credentialsSchema>;

// Response type
export type LoginResponse = {
  success: boolean;
  message: string;
  user?: {
    id: string;
    role: string;
    name: string;
  };
};
