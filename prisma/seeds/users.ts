import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  // Hash the password "admin" with bcrypt
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const hashedPassword2 = await bcrypt.hash("user123", 10);

  // Prepare admin user
  const adminUser = {
    name: "System Administrator",
    npk: "admin123",
    password: hashedPassword,
    role: "ADMIN",
    isActive: true,
  };

  const commonUser = {
    name: "Karyawan Telaten",
    npk: "user123",
    password: hashedPassword2,
    role: "USER",
    isActive: true,
  };

  // Generate 1000 users
  const regularUsers = Array.from({ length: 1000 }, (_, i) => {
    const userId = i + 1; // Generate unique user IDs (emp001, emp002, ...)
    return {
      npk: `emp${String(userId).padStart(3, "0")}`, // Format npk as emp001, emp002, etc.
      name: `User ${userId}`,
      password: hashedPassword, // Using "admin123" password
      role: "USER", // All regular users have USER role
      isActive: userId % 2 === 0, // Alternate between active and inactive
    };
  });

  // Combine admin and regular users
  const allUsers = [adminUser, commonUser, ...regularUsers];

  // Create all users at once using createMany with skipDuplicates
  const createdUsers = await prisma.user.createMany({
    data: allUsers,
    skipDuplicates: true,
  });

  console.log(`   👥 Created ${createdUsers.count} users (skipped duplicates)`);

  // Get total user count for reporting
  const totalUsers = await prisma.user.count();
  console.log(`   📊 Total users in database: ${totalUsers}`);
}
