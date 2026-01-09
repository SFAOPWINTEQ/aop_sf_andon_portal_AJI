import { PrismaClient } from "@prisma/client";

export async function seedProductionResults(
  prisma: PrismaClient,
): Promise<void> {
  // Get all production plans that have started
  const plans = await prisma.productionPlan.findMany({
    where: {
      status: { in: ["RUNNING", "CLOSED"] },
      startedAt: { not: null },
    },
    include: {
      line: true,
      shift: true,
      part: true,
    },
  });

  if (plans.length === 0) {
    console.log(
      "   ⚠️  No started production plans found. Skipping results seeding.",
    );
    return;
  }

  let productDetailsCount = 0;
  let lossTimeSummaryCount = 0;
  let downtimeEventCount = 0;
  let rejectionEventCount = 0;
  let oeeRecordCount = 0;

  for (const plan of plans) {
    try {
      // 1. Create ProductDetail records for actualQty
      if (plan.actualQty > 0) {
        const productDetails = [];
        const avgCycleTime = plan.cycleTimeSec;
        const variance = avgCycleTime * 0.1; // 10% variance

        for (let i = 1; i <= plan.actualQty; i++) {
          const cycleTimeSec = Math.floor(
            avgCycleTime - variance + Math.random() * variance * 2,
          );
          const isGood = i > plan.actualQty - plan.ngQty ? false : true; // Last ngQty are defects

          productDetails.push({
            planId: plan.id,
            sequenceNo: i,
            completedAt: new Date(
              plan.startedAt!.getTime() + i * avgCycleTime * 1000,
            ),
            cycleTimeSec,
            isGood,
          });
        }

        // Create product details in batches
        const pdResult = await prisma.productDetail.createMany({
          data: productDetails,
          skipDuplicates: true,
        });
        productDetailsCount += pdResult.count;
      }

      // 2. Create LossTimeSummary
      if (plan.status === "CLOSED" && plan.startedAt && plan.completedAt) {
        const totalSeconds =
          (plan.completedAt.getTime() - plan.startedAt.getTime()) / 1000;
        const plannedSeconds = plan.plannedQty * plan.cycleTimeSec;
        const actualWorkingSeconds = plan.actualQty * plan.cycleTimeSec;

        // Random downtime allocation
        const totalDowntime = Math.max(
          0,
          totalSeconds - actualWorkingSeconds - 3600,
        ); // Subtract 1 hour for breaks
        const pdtSec = Math.floor(totalDowntime * (0.2 + Math.random() * 0.3)); // 20-50% PDT
        const updtSec = Math.floor(totalDowntime - pdtSec); // Rest is UPDT

        await prisma.lossTimeSummary.upsert({
          where: { planId: plan.id },
          update: {
            planWorkingSec: plannedSeconds,
            actualWorkingSec: Math.floor(actualWorkingSeconds),
            pdtSec,
            updtSec,
          },
          create: {
            planId: plan.id,
            planWorkingSec: plannedSeconds,
            actualWorkingSec: Math.floor(actualWorkingSeconds),
            pdtSec,
            updtSec,
          },
        });
        lossTimeSummaryCount++;
      }

      // 3. Create DowntimeEvents (2-5 events per closed plan)
      if (plan.status === "CLOSED" && plan.startedAt && plan.completedAt) {
        const downtimeEvents = [];
        const numEvents = 2 + Math.floor(Math.random() * 4); // 2-5 events

        // Get categories
        const pdtCategories = await prisma.pdtCategory.findMany({
          where: { lineId: plan.lineId },
          take: 5,
        });
        const updtCategories = await prisma.updtCategory.findMany({
          where: { lineId: plan.lineId },
          take: 5,
        });
        const machines = await prisma.machine.findMany({
          where: { lineId: plan.lineId },
          take: 3,
        });

        let currentTime = new Date(plan.startedAt);
        const planDuration =
          plan.completedAt.getTime() - plan.startedAt.getTime();
        const eventInterval = planDuration / (numEvents + 1);

        for (let i = 0; i < numEvents; i++) {
          const isPdt = Math.random() < 0.4; // 40% PDT, 60% UPDT
          const startTime = new Date(
            currentTime.getTime() + eventInterval * (i + 1),
          );
          const durationSec = isPdt
            ? pdtCategories[i % pdtCategories.length]?.defaultDurationMin *
                60 || 1800
            : 600 + Math.floor(Math.random() * 3000); // 10-60 min for UPDT
          const endTime = new Date(startTime.getTime() + durationSec * 1000);

          downtimeEvents.push({
            planId: plan.id,
            kind: isPdt ? "PDT" : "UPDT",
            startTime,
            endTime,
            durationSec,
            pdtCategoryId: isPdt
              ? pdtCategories[i % pdtCategories.length]?.id
              : null,
            updtCategoryId: !isPdt
              ? updtCategories[i % updtCategories.length]?.id
              : null,
            machineId:
              machines.length > 0 && Math.random() < 0.5
                ? machines[i % machines.length]?.id
                : null,
            note: isPdt
              ? "Scheduled maintenance performed"
              : "Unplanned stoppage occurred",
          });
        }

        // Create all downtime events at once
        const dtResult = await prisma.downtimeEvent.createMany({
          data: downtimeEvents,
          skipDuplicates: true,
        });
        downtimeEventCount += dtResult.count;
      }

      // 4. Create RejectionEvents (1-3 events per plan with NG)
      if (plan.ngQty > 0) {
        const rejectionEvents = [];
        const numEvents = Math.min(3, 1 + Math.floor(Math.random() * 3)); // 1-3 events

        const rejectCriteria = await prisma.rejectCriteria.findMany({
          where: { lineId: plan.lineId },
          take: 5,
        });

        if (rejectCriteria.length > 0) {
          let remainingNg = plan.ngQty;

          for (let i = 0; i < numEvents && remainingNg > 0; i++) {
            const qty =
              i === numEvents - 1
                ? remainingNg
                : Math.ceil(
                    (remainingNg / (numEvents - i)) * (0.5 + Math.random()),
                  );
            remainingNg -= qty;

            const criteria =
              rejectCriteria[Math.floor(Math.random() * rejectCriteria.length)];
            const occurredAt = new Date(
              plan.startedAt!.getTime() +
                (plan.completedAt
                  ? (plan.completedAt.getTime() - plan.startedAt!.getTime()) *
                    Math.random()
                  : Date.now() - plan.startedAt!.getTime()) *
                  Math.random(),
            );

            rejectionEvents.push({
              planId: plan.id,
              occurredAt,
              qty,
              category: criteria.category,
              criteria: criteria.name,
              criteriaId: criteria.id,
              note: `Quality issue detected during production`,
            });
          }

          // Create all rejection events at once
          const reResult = await prisma.rejectionEvent.createMany({
            data: rejectionEvents,
            skipDuplicates: true,
          });
          rejectionEventCount += reResult.count;
        }
      }

      // 5. Create OEERecord for closed plans
      if (plan.status === "CLOSED") {
        // Calculate OEE metrics
        const plannedProduction = plan.plannedQty;
        const actualProduction = plan.actualQty;
        const goodProduction = plan.actualQty - plan.ngQty;

        // Get loss time summary
        const lossTime = await prisma.lossTimeSummary.findUnique({
          where: { planId: plan.id },
        });

        let availability = 85 + Math.random() * 10; // 85-95%
        let performance = 80 + Math.random() * 15; // 80-95%
        let quality =
          goodProduction > 0 ? (goodProduction / actualProduction) * 100 : 0;

        if (lossTime) {
          const totalTime =
            lossTime.planWorkingSec + lossTime.pdtSec + lossTime.updtSec;
          availability =
            totalTime > 0 ? (lossTime.actualWorkingSec / totalTime) * 100 : 0;
          performance =
            lossTime.actualWorkingSec > 0
              ? (lossTime.planWorkingSec / lossTime.actualWorkingSec) * 100
              : 0;
        }

        const oee = (availability * performance * quality) / 10000;

        await prisma.oEERecord.upsert({
          where: { planId: plan.id },
          update: {
            availability: Number(availability.toFixed(2)),
            performance: Number(performance.toFixed(2)),
            quality: Number(quality.toFixed(2)),
            oee: Number(oee.toFixed(2)),
          },
          create: {
            planId: plan.id,
            availability: Number(availability.toFixed(2)),
            performance: Number(performance.toFixed(2)),
            quality: Number(quality.toFixed(2)),
            oee: Number(oee.toFixed(2)),
          },
        });
        oeeRecordCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error processing plan ${plan.workOrderNo}: ${error}`);
    }
  }

  console.log(`   🔍 Processed production results:`);
  console.log(`      - Product Details: ${productDetailsCount}`);
  console.log(`      - Loss Time Summaries: ${lossTimeSummaryCount}`);
  console.log(`      - Downtime Events: ${downtimeEventCount}`);
  console.log(`      - Rejection Events: ${rejectionEventCount}`);
  console.log(`      - OEE Records: ${oeeRecordCount}`);
}
