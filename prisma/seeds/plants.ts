import type { PrismaClient } from "@prisma/client";

export async function seedPlants(prisma: PrismaClient): Promise<void> {
  const plants = [
    { name: "Plant 1", subplant: "Main Production", isActive: true },
    { name: "Plant 2", subplant: "Assembly Wing", isActive: true },
    { name: "Plant 3", subplant: "Quality Control", isActive: true },
    { name: "Plant 4", subplant: "Warehouse", isActive: false },
  ];

  const result = await prisma.plant.createMany({
    data: plants,
    skipDuplicates: true,
  });

  console.log(`   🏢 Created ${result.count} plants (skipped duplicates)`);

  const totalPlants = await prisma.plant.count();
  console.log(`   📊 Total plants in database: ${totalPlants}`);
}
