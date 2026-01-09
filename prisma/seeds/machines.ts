import { PrismaClient } from "@prisma/client";

export async function seedMachines(prisma: PrismaClient): Promise<void> {
  // Get all lines first
  const lines = await prisma.line.findMany({
    where: { isActive: true },
  });

  if (lines.length === 0) {
    console.log("   ⚠️  No active lines found. Skipping machine seeding.");
    return;
  }

  // Create 3-5 machines per line
  const machineTemplates = [
    "Press Machine",
    "Welding Robot",
    "CNC Lathe",
    "Assembly Station",
    "Quality Check Station",
  ];

  const machines = [];
  for (const line of lines) {
    const machineCount = 3 + Math.floor(Math.random() * 3); // 3-5 machines per line
    for (let i = 0; i < machineCount; i++) {
      machines.push({
        lineId: line.id,
        name: `${line.name} - ${machineTemplates[i % machineTemplates.length]} ${i + 1}`,
      });
    }
  }

  // Create all machines
  const createdMachines = await prisma.machine.createMany({
    data: machines,
    skipDuplicates: true,
  });

  console.log(
    `   🤖 Created ${createdMachines.count} machines (skipped duplicates)`,
  );

  const totalMachines = await prisma.machine.count();
  console.log(`   📊 Total machines in database: ${totalMachines}`);
}
