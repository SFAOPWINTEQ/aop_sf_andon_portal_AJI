import type { PrismaClient } from "@prisma/client";

export async function seedLines(prisma: PrismaClient): Promise<void> {
  // Get plants for assignment
  const plants = await prisma.plant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (plants.length === 0) {
    throw new Error("No plants found. Please seed plants first.");
  }

  // Distribute lines across plants
  const plant1 = plants[0]; // Plant 1 - Main Production
  const plant2 = plants[1] || plants[0]; // Plant 2 - Assembly Wing (fallback to plant1)
  const plant3 = plants[2] || plants[0]; // Plant 3 - Quality Control (fallback to plant1)

  const lines = [
    { name: "Line A - Assembly", plantId: plant1.id, isActive: true },
    { name: "Line B - Welding", plantId: plant1.id, isActive: true },
    { name: "Line C - Painting", plantId: plant2.id, isActive: true },
    { name: "Line D - Stamping", plantId: plant2.id, isActive: true },
    { name: "Line E - Inspection", plantId: plant3.id, isActive: true },
    { name: "Line F - Packaging", plantId: plant3.id, isActive: false },
  ];

  const result = await prisma.line.createMany({
    data: lines,
    skipDuplicates: true,
  });

  console.log(`   🏭 Created ${result.count} lines (skipped duplicates)`);

  const totalLines = await prisma.line.count();
  console.log(`   📊 Total lines in database: ${totalLines}`);
}
