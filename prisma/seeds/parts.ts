import { PrismaClient } from "@prisma/client";

export async function seedParts(prisma: PrismaClient): Promise<void> {
  // Get lines for assignment
  const lines = await prisma.line.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  if (lines.length === 0) {
    throw new Error("No lines found. Please seed lines first.");
  }

  // Distribute parts across lines (cycle through available lines)
  const getLineId = (index: number) => lines[index % lines.length].id;

  const parts = [
    {
      sku: "SKU-001",
      partNo: "P-BODY-001",
      name: "Body Panel Front",
      lineId: getLineId(0),
      qtyPerLot: 100,
      cycleTimeSec: 45,
    },
    {
      sku: "SKU-002",
      partNo: "P-BODY-002",
      name: "Body Panel Rear",
      lineId: getLineId(1),
      qtyPerLot: 100,
      cycleTimeSec: 45,
    },
    {
      sku: "SKU-003",
      partNo: "P-BODY-003",
      name: "Body Panel Side Left",
      lineId: getLineId(2),
      qtyPerLot: 100,
      cycleTimeSec: 40,
    },
    {
      sku: "SKU-004",
      partNo: "P-BODY-004",
      name: "Body Panel Side Right",
      lineId: getLineId(3),
      qtyPerLot: 100,
      cycleTimeSec: 40,
    },
    {
      sku: "SKU-005",
      partNo: "P-DOOR-001",
      name: "Door Assembly Front Left",
      lineId: getLineId(4),
      qtyPerLot: 50,
      cycleTimeSec: 60,
    },
    {
      sku: "SKU-006",
      partNo: "P-DOOR-002",
      name: "Door Assembly Front Right",
      lineId: getLineId(5),
      qtyPerLot: 50,
      cycleTimeSec: 60,
    },
    {
      sku: "SKU-007",
      partNo: "P-DOOR-003",
      name: "Door Assembly Rear Left",
      lineId: getLineId(6),
      qtyPerLot: 50,
      cycleTimeSec: 60,
    },
    {
      sku: "SKU-008",
      partNo: "P-DOOR-004",
      name: "Door Assembly Rear Right",
      lineId: getLineId(7),
      qtyPerLot: 50,
      cycleTimeSec: 60,
    },
    {
      sku: "SKU-009",
      partNo: "P-HOOD-001",
      name: "Hood Assembly",
      lineId: getLineId(8),
      qtyPerLot: 50,
      cycleTimeSec: 55,
    },
    {
      sku: "SKU-010",
      partNo: "P-TRUNK-001",
      name: "Trunk Assembly",
      lineId: getLineId(9),
      qtyPerLot: 50,
      cycleTimeSec: 55,
    },
    {
      sku: "SKU-011",
      partNo: "P-BUMPER-001",
      name: "Front Bumper",
      lineId: getLineId(10),
      qtyPerLot: 75,
      cycleTimeSec: 50,
    },
    {
      sku: "SKU-012",
      partNo: "P-BUMPER-002",
      name: "Rear Bumper",
      lineId: getLineId(11),
      qtyPerLot: 75,
      cycleTimeSec: 50,
    },
    {
      sku: "SKU-013",
      partNo: "P-FENDER-001",
      name: "Fender Left",
      lineId: getLineId(12),
      qtyPerLot: 100,
      cycleTimeSec: 35,
    },
    {
      sku: "SKU-014",
      partNo: "P-FENDER-002",
      name: "Fender Right",
      lineId: getLineId(13),
      qtyPerLot: 100,
      cycleTimeSec: 35,
    },
    {
      sku: "SKU-015",
      partNo: "P-ROOF-001",
      name: "Roof Panel",
      lineId: getLineId(14),
      qtyPerLot: 50,
      cycleTimeSec: 70,
    },
    {
      sku: "SKU-016",
      partNo: "P-WHEEL-001",
      name: "Wheel Rim 16 inch",
      lineId: getLineId(15),
      qtyPerLot: 200,
      cycleTimeSec: 30,
    },
    {
      sku: "SKU-017",
      partNo: "P-WHEEL-002",
      name: "Wheel Rim 17 inch",
      lineId: getLineId(16),
      qtyPerLot: 200,
      cycleTimeSec: 30,
    },
    {
      sku: "SKU-018",
      partNo: "P-BRAKE-001",
      name: "Brake Disc Front",
      lineId: getLineId(17),
      qtyPerLot: 200,
      cycleTimeSec: 25,
    },
    {
      sku: "SKU-019",
      partNo: "P-BRAKE-002",
      name: "Brake Disc Rear",
      lineId: getLineId(18),
      qtyPerLot: 200,
      cycleTimeSec: 25,
    },
    {
      sku: "SKU-020",
      partNo: "P-SUSP-001",
      name: "Suspension Arm Front",
      lineId: getLineId(19),
      qtyPerLot: 150,
      cycleTimeSec: 40,
    },
  ];

  const result = await prisma.part.createMany({
    data: parts,
    skipDuplicates: true,
  });

  console.log(`   🔧 Created ${result.count} parts (skipped duplicates)`);

  const totalParts = await prisma.part.count();
  console.log(`   � Total parts in database: ${totalParts}`);
}
