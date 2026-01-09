/*
  Warnings:

  - You are about to alter the column `cycleTimeSec` on the `Part` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `cycleTimeSec` on the `ProductDetail` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `cycleTimeSec` on the `ProductionPlan` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `Part` MODIFY `cycleTimeSec` DOUBLE NULL;

-- AlterTable
ALTER TABLE `ProductDetail` MODIFY `cycleTimeSec` DOUBLE NULL;

-- AlterTable
ALTER TABLE `ProductionPlan` MODIFY `cycleTimeSec` DOUBLE NOT NULL;
