/*
  Warnings:

  - You are about to drop the column `lineId` on the `PdtCategory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `PdtCategory` DROP FOREIGN KEY `PdtCategory_lineId_fkey`;

-- DropIndex
DROP INDEX `PdtCategory_lineId_fkey` ON `PdtCategory`;

-- AlterTable
ALTER TABLE `PdtCategory` DROP COLUMN `lineId`;
