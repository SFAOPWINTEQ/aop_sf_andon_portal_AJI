import { PrismaClient } from "@prisma/client";

export async function seedProductionPlans(prisma: PrismaClient): Promise<void> {
  // Get all required data first
  const lines = await prisma.line.findMany({ where: { isActive: true } });
  const parts = await prisma.part.findMany();
  const users = await prisma.user.findMany({ take: 10 });

  if (lines.length === 0 || parts.length === 0) {
    console.log(
      "   ⚠️  Missing required data. Skipping production plan seeding.",
    );
    return;
  }

  // Get shifts for each line
  const shifts = await prisma.shift.findMany({
    where: { lineId: { in: lines.map((l) => l.id) } },
  });

  if (shifts.length === 0) {
    console.log("   ⚠️  No shifts found. Skipping production plan seeding.");
    return;
  }

  const statuses = ["OPEN", "RUNNING", "CLOSED", "CANCELED"];
  const plans = [];

  // Create production plans for the last 30 days
  const today = new Date();
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const planDate = new Date(today);
    planDate.setDate(planDate.getDate() - dayOffset);
    planDate.setHours(0, 0, 0, 0);

    // Create 2-3 plans per line per day
    for (const line of lines) {
      const lineShifts = shifts.filter((s) => s.lineId === line.id);
      if (lineShifts.length === 0) continue;

      const plansPerDay = 2 + Math.floor(Math.random() * 2); // 2-3 plans

      for (let seq = 1; seq <= plansPerDay; seq++) {
        const shift = lineShifts[Math.floor(Math.random() * lineShifts.length)];
        const part = parts[Math.floor(Math.random() * parts.length)];
        const user = users[Math.floor(Math.random() * users.length)];

        // Determine status based on date
        let status: string;
        let startedAt: Date | null = null;
        let completedAt: Date | null = null;
        let actualQty = 0;
        let ngQty = 0;

        if (dayOffset > 2) {
          // Plans from more than 2 days ago are mostly CLOSED
          status = Math.random() < 0.85 ? "CLOSED" : "CANCELED";
          if (status === "CLOSED") {
            startedAt = new Date(planDate);
            startedAt.setHours(
              7 + shift.number * 8,
              Math.floor(Math.random() * 60),
            );
            completedAt = new Date(startedAt);
            completedAt.setHours(
              completedAt.getHours() + 6 + Math.floor(Math.random() * 3),
            );
          }
        } else if (dayOffset === 1) {
          // Yesterday's plans are mixed
          const rand = Math.random();
          if (rand < 0.7) {
            status = "CLOSED";
            startedAt = new Date(planDate);
            startedAt.setHours(
              7 + shift.number * 8,
              Math.floor(Math.random() * 60),
            );
            completedAt = new Date(startedAt);
            completedAt.setHours(
              completedAt.getHours() + 6 + Math.floor(Math.random() * 3),
            );
          } else if (rand < 0.85) {
            status = "RUNNING";
            startedAt = new Date(planDate);
            startedAt.setHours(
              7 + shift.number * 8,
              Math.floor(Math.random() * 60),
            );
          } else {
            status = "OPEN";
          }
        } else {
          // Today's plans are mostly OPEN or RUNNING
          const rand = Math.random();
          if (rand < 0.5) {
            status = "OPEN";
          } else if (rand < 0.8) {
            status = "RUNNING";
            startedAt = new Date();
            startedAt.setHours(
              startedAt.getHours() - Math.floor(Math.random() * 4),
            );
          } else {
            status = "CLOSED";
            startedAt = new Date();
            startedAt.setHours(startedAt.getHours() - 6);
            completedAt = new Date();
          }
        }

        const plannedQty = 100 + Math.floor(Math.random() * 400); // 100-500
        const cycleTimeSec = 30 + Math.floor(Math.random() * 90); // 30-120 seconds

        // Calculate actualQty and ngQty based on status
        if (status === "CLOSED") {
          actualQty = Math.floor(plannedQty * (0.85 + Math.random() * 0.15)); // 85-100%
          ngQty = Math.floor(actualQty * (0.01 + Math.random() * 0.04)); // 1-5% defect rate
        } else if (status === "RUNNING") {
          actualQty = Math.floor(plannedQty * (0.3 + Math.random() * 0.4)); // 30-70% completed
          ngQty = Math.floor(actualQty * (0.01 + Math.random() * 0.04));
        } else if (status === "CANCELED") {
          actualQty = Math.floor(plannedQty * Math.random() * 0.3); // 0-30%
          ngQty = Math.floor(actualQty * Math.random() * 0.1);
        }

        plans.push({
          workOrderNo: `WO${planDate.getFullYear()}${String(planDate.getMonth() + 1).padStart(2, "0")}${String(planDate.getDate()).padStart(2, "0")}-${line.name.substring(0, 1)}${seq}`,
          planDate,
          lineId: line.id,
          shiftId: shift.id,
          partId: part.id,
          cycleTimeSec,
          plannedQty,
          actualQty,
          ngQty,
          sequence: seq,
          status,
          startedAt,
          completedAt,
          createdById: user?.id,
        });
      }
    }
  }

  const result = await prisma.productionPlan.createMany({
    data: plans,
    skipDuplicates: true,
  });

  console.log(
    `   📋 Created ${result.count} production plans (skipped duplicates)`,
  );

  const totalPlans = await prisma.productionPlan.count();
  console.log(`   📊 Total production plans in database: ${totalPlans}`);
}
