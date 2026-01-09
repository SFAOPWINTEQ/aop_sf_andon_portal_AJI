/*
  Warnings:

  - Added the required column `lineId` to the `Part` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Part` ADD COLUMN `lineId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Part_lineId_idx` ON `Part`(`lineId`);

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_lineId_fkey` FOREIGN KEY (`lineId`) REFERENCES `Line`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
