import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./seeds/users";
import { seedNotifications } from "./seeds/notifications";
import { seedPlants } from "./seeds/plants";
import { seedLines } from "./seeds/lines";
import { seedShifts } from "./seeds/shifts";
import { seedMachines } from "./seeds/machines";
import { seedParts } from "./seeds/parts";
import { seedPdtCategories } from "./seeds/pdtCategories";
import { seedUpdtCategories } from "./seeds/updtCategories";
import { seedRejectCriteria } from "./seeds/rejectCriteria";
import { seedProductionPlans } from "./seeds/productionPlans";
import { seedProductionResults } from "./seeds/productionResults";

const prisma = new PrismaClient();

interface SeedModule {
  name: string;
  fn: (prisma: PrismaClient) => Promise<void>;
}

const seedModules: SeedModule[] = [
  { name: "Users", fn: seedUsers },
  { name: "Notifications", fn: seedNotifications },
  { name: "Plants", fn: seedPlants },
  { name: "Lines", fn: seedLines },
  { name: "Shifts", fn: seedShifts },
  { name: "Machines", fn: seedMachines },
  { name: "Parts", fn: seedParts },
  { name: "PDT Categories", fn: seedPdtCategories },
  { name: "UPDT Categories", fn: seedUpdtCategories },
  { name: "Reject Criteria", fn: seedRejectCriteria },
  { name: "Production Plans", fn: seedProductionPlans },
  { name: "Production Results", fn: seedProductionResults },
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  let completed = 0;
  const total = seedModules.length;

  for (const module of seedModules) {
    try {
      console.log(`📦 Seeding ${module.name}...`);

      const startTime = Date.now();
      await module.fn(prisma);
      const endTime = Date.now();

      completed++;
      console.log(
        `✅ ${module.name} seeded successfully (${endTime - startTime}ms)`,
      );
      console.log(`📊 Progress: ${completed}/${total}\n`);
    } catch (error) {
      console.error(`❌ Failed to seed ${module.name}:`, error);
      console.log(`💔 Stopping seed process due to error in ${module.name}\n`);
      throw error;
    }
  }

  console.log("🎉 Database seed completed successfully!");
  console.log(`📈 Total modules seeded: ${completed}/${total}\n`);

  // Get final counts
  console.log("📊 Final Record Counts:");
  console.log("═══════════════════════════════════════");

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.plant.count(),
    prisma.line.count(),
    prisma.shift.count(),
    prisma.machine.count(),
    prisma.part.count(),
    prisma.pdtCategory.count(),
    prisma.updtCategory.count(),
    prisma.rejectCriteria.count(),
    prisma.productionPlan.count(),
    prisma.productDetail.count(),
    prisma.lossTimeSummary.count(),
    prisma.downtimeEvent.count(),
    prisma.rejectionEvent.count(),
    prisma.oEERecord.count(),
  ]);

  const [
    users,
    plants,
    lines,
    shifts,
    machines,
    parts,
    pdtCats,
    updtCats,
    rejectCrits,
    plans,
    productDetails,
    lossSummaries,
    downtimes,
    rejections,
    oeeRecords,
  ] = counts;

  const masterDataTotal =
    users +
    plants +
    lines +
    shifts +
    machines +
    parts +
    pdtCats +
    updtCats +
    rejectCrits;
  const productionTotal =
    plans +
    productDetails +
    lossSummaries +
    downtimes +
    rejections +
    oeeRecords;
  const grandTotal = masterDataTotal + productionTotal;

  console.log(
    `\n🏭 Master Data (${masterDataTotal.toLocaleString()} records):`,
  );
  console.log(`   👥 Users: ${users.toLocaleString()}`);
  console.log(`   � Plants: ${plants.toLocaleString()}`);
  console.log(`   �🏭 Lines: ${lines.toLocaleString()}`);
  console.log(`   ⏰ Shifts: ${shifts.toLocaleString()}`);
  console.log(`   🤖 Machines: ${machines.toLocaleString()}`);
  console.log(`   🔧 Parts: ${parts.toLocaleString()}`);
  console.log(`   📅 PDT Categories: ${pdtCats.toLocaleString()}`);
  console.log(`   ⚡ UPDT Categories: ${updtCats.toLocaleString()}`);
  console.log(`   ❌ Reject Criteria: ${rejectCrits.toLocaleString()}`);

  console.log(
    `\n📋 Production Data (${productionTotal.toLocaleString()} records):`,
  );
  console.log(`   📋 Production Plans: ${plans.toLocaleString()}`);
  console.log(`   🔍 Product Details: ${productDetails.toLocaleString()}`);
  console.log(`   📊 Loss Time Summaries: ${lossSummaries.toLocaleString()}`);
  console.log(`   ⏸️  Downtime Events: ${downtimes.toLocaleString()}`);
  console.log(`   ❌ Rejection Events: ${rejections.toLocaleString()}`);
  console.log(`   📈 OEE Records: ${oeeRecords.toLocaleString()}`);

  console.log(`\n🎯 Grand Total: ${grandTotal.toLocaleString()} records`);
  console.log("═══════════════════════════════════════\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("🚨 Seed failed:", e);
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
    process.exit(1);
  });
