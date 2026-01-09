import { PrismaClient } from "@prisma/client";

export async function seedRejectCriteria(prisma: PrismaClient): Promise<void> {
  // Get all active lines first
  const lines = await prisma.line.findMany({
    where: { isActive: true },
  });

  if (lines.length === 0) {
    console.log(
      "   ⚠️  No active lines found. Skipping reject criteria seeding.",
    );
    return;
  }

  // Reject criteria by category
  const rejectTemplates = [
    { category: "NG Setting", name: "Initial Setup Error" },
    { category: "NG Setting", name: "Wrong Parameter" },
    { category: "NG Setting", name: "Tool Misalignment" },
    { category: "NG Setting", name: "Calibration Error" },
    { category: "NG Regular", name: "Dent" },
    { category: "NG Regular", name: "Scratch" },
    { category: "NG Regular", name: "Crack" },
    { category: "NG Regular", name: "Deformation" },
    { category: "NG Regular", name: "Burr" },
    { category: "NG Regular", name: "Incomplete Weld" },
    { category: "NG Process", name: "Wrong Dimension" },
    { category: "NG Process", name: "Surface Defect" },
    { category: "NG Process", name: "Material Defect" },
    { category: "NG Process", name: "Assembly Error" },
    { category: "NG Process", name: "Missing Component" },
    { category: "NG Appearance", name: "Color Mismatch" },
    { category: "NG Appearance", name: "Paint Defect" },
    { category: "NG Appearance", name: "Stain" },
    { category: "NG Appearance", name: "Discoloration" },
  ];

  const rejectCriteria = [];
  for (const line of lines) {
    for (const template of rejectTemplates) {
      rejectCriteria.push({
        lineId: line.id,
        category: template.category,
        name: template.name,
      });
    }
  }

  const result = await prisma.rejectCriteria.createMany({
    data: rejectCriteria,
    skipDuplicates: true,
  });

  console.log(
    `   ❌ Created ${result.count} reject criteria (skipped duplicates)`,
  );

  const totalRejectCriteria = await prisma.rejectCriteria.count();
  console.log(
    `   📊 Total reject criteria in database: ${totalRejectCriteria}`,
  );
}
