import z from "zod";

export const loginSchema = z.union([
  z.object({
    uid: z.string().min(4),
    line: z.string().min(1),
  }),
  z.object({
    npk: z.string().min(6),
    password: z.string().min(5),
    line: z.string().min(1),
  })
]);

export const login2Schema = z.union([
  z.object({
    npk: z.string().min(6),
    password: z.string().min(5),
  })
]);


export type LoginInput = z.infer<typeof loginSchema>;
export type LoginInput2 = z.infer<typeof login2Schema>;

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
