import { PrismaClient } from "@prisma/client";

export async function seedShifts(prisma: PrismaClient): Promise<void> {
  // Get all lines first
  const lines = await prisma.line.findMany({
    where: { isActive: true },
  });

  if (lines.length === 0) {
    console.log("   ⚠️  No active lines found. Skipping shift seeding.");
    return;
  }

  // Create 3 shifts for each line
  const shifts = [];
  for (const line of lines) {
    shifts.push(
      {
        lineId: line.id,
        number: 1,
        workStart: new Date("1970-01-01T07:00:00Z"), // 07:00
        workEnd: new Date("1970-01-01T15:00:00Z"), // 15:00
        break1Start: new Date("1970-01-01T09:00:00Z"), // 09:00
        break1End: new Date("1970-01-01T09:15:00Z"), // 09:15
        break2Start: new Date("1970-01-01T12:00:00Z"), // 12:00
        break2End: new Date("1970-01-01T12:30:00Z"), // 12:30
      },
      {
        lineId: line.id,
        number: 2,
        workStart: new Date("1970-01-01T15:00:00Z"), // 15:00
        workEnd: new Date("1970-01-01T23:00:00Z"), // 23:00
        break1Start: new Date("1970-01-01T17:00:00Z"), // 17:00
        break1End: new Date("1970-01-01T17:15:00Z"), // 17:15
        break2Start: new Date("1970-01-01T20:00:00Z"), // 20:00
        break2End: new Date("1970-01-01T20:30:00Z"), // 20:30
      },
      {
        lineId: line.id,
        number: 3,
        workStart: new Date("1970-01-01T23:00:00Z"), // 23:00
        workEnd: new Date("1970-01-02T07:00:00Z"), // 07:00 (next day)
        break1Start: new Date("1970-01-02T01:00:00Z"), // 01:00
        break1End: new Date("1970-01-02T01:15:00Z"), // 01:15
        break2Start: new Date("1970-01-02T04:00:00Z"), // 04:00
        break2End: new Date("1970-01-02T04:30:00Z"), // 04:30
      },
    );
  }

  const result = await prisma.shift.createMany({
    data: shifts,
    skipDuplicates: true,
  });

  console.log(`   ⏰ Created ${result.count} shifts (skipped duplicates)`);

  const totalShifts = await prisma.shift.count();
  console.log(`   📊 Total shifts in database: ${totalShifts}`);
  console.log(`   📊 Total shifts in database: ${totalShifts}`);
}
