import { PrismaClient } from "@prisma/client";

export async function seedUpdtCategories(prisma: PrismaClient): Promise<void> {
  // Get all active lines first
  const lines = await prisma.line.findMany({
    where: { isActive: true },
  });

  if (lines.length === 0) {
    console.log("   ⚠️  No active lines found. Skipping UPDT category seeding.");
    return;
  }

  // UPDT (Unplanned Downtime) categories by department
  const updtTemplates = [
    { department: "Mechanical", name: "Machine Breakdown" },
    { department: "Mechanical", name: "Equipment Failure" },
    { department: "Mechanical", name: "Tool Breakage" },
    { department: "Mechanical", name: "Conveyor Jam" },
    { department: "Electrical", name: "Power Outage" },
    { department: "Electrical", name: "Control System Failure" },
    { department: "Electrical", name: "Sensor Malfunction" },
    { department: "Electrical", name: "Wiring Issue" },
    { department: "Quality", name: "Quality Hold" },
    { department: "Quality", name: "Inspection Delay" },
    { department: "Quality", name: "Rework Required" },
    { department: "Material", name: "Material Shortage" },
    { department: "Material", name: "Wrong Material" },
    { department: "Material", name: "Material Defect" },
    { department: "Production", name: "Operator Absent" },
    { department: "Production", name: "Waiting for Instruction" },
    { department: "Production", name: "Training" },
    { department: "Safety", name: "Safety Incident" },
    { department: "Safety", name: "Emergency Stop" },
  ];

  const updtCategories = [];
  for (const line of lines) {
    for (const template of updtTemplates) {
      updtCategories.push({
        lineId: line.id,
        department: template.department,
        name: template.name,
      });
    }
  }

  const result = await prisma.updtCategory.createMany({
    data: updtCategories,
    skipDuplicates: true,
  });

  console.log(
    `   ⚡ Created ${result.count} UPDT categories (skipped duplicates)`,
  );

  const totalUpdtCategories = await prisma.updtCategory.count();
  console.log(
    `   📊 Total UPDT categories in database: ${totalUpdtCategories}`,
  );
}
