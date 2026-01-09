import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    npk: string;
    role: string;
    isActive: boolean;
  }

  interface Session {
    user: {
      id: string;
      npk: string;
      role: string;
      isActive: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    npk: string;
    role: string;
    isActive: boolean;
  }
}
