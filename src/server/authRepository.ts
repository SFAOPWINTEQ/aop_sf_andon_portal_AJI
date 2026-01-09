import { db } from "@/lib/db";

export const authRepository = {
  async updateLastLogin(id: string) {
    await db.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  },
};

export const getUserJwt = async (id: string) => {
  const res = await db.user.findUnique({
    where: {
      id,
    },
  });
  return res;
};
