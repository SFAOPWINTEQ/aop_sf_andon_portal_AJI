import { PrismaClient } from "@prisma/client";

export async function seedPdtCategories(prisma: PrismaClient): Promise<void> {
  // Get all active lines first
  const lines = await prisma.line.findMany({
    where: { isActive: true },
  });

  if (lines.length === 0) {
    console.log("   ⚠️  No active lines found. Skipping PDT category seeding.");
    return;
  }

  // PDT (Planned Downtime) categories
  const pdtTemplates = [
    { name: "Scheduled Maintenance", defaultDurationMin: 60 },
    { name: "Tool Change", defaultDurationMin: 30 },
    { name: "Cleaning", defaultDurationMin: 20 },
    { name: "Preventive Maintenance", defaultDurationMin: 120 },
    { name: "Calibration", defaultDurationMin: 45 },
    { name: "Setup/Changeover", defaultDurationMin: 90 },
    { name: "Lunch Break", defaultDurationMin: 30 },
    { name: "Team Meeting", defaultDurationMin: 15 },
  ];

  const pdtCategories = [];
  for (const line of lines) {
    for (const template of pdtTemplates) {
      pdtCategories.push({
        name: `${line.name} - ${template.name}`,
        lineId: line.id,
        defaultDurationMin: template.defaultDurationMin,
      });
    }
  }

  const result = await prisma.pdtCategory.createMany({
    data: pdtCategories,
    skipDuplicates: true,
  });

  console.log(
    `   📅 Created ${result.count} PDT categories (skipped duplicates)`,
  );

  const totalPdtCategories = await prisma.pdtCategory.count();
  console.log(`   📊 Total PDT categories in database: ${totalPdtCategories}`);
}
