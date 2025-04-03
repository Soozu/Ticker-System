/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `dateFixed` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisDetails` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `fixDetails` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `assignedTo`,
    DROP COLUMN `dateFixed`,
    DROP COLUMN `diagnosisDetails`,
    DROP COLUMN `fixDetails`,
    DROP COLUMN `recommendations`,
    ADD COLUMN `ictAssignedTo` VARCHAR(191) NULL,
    ADD COLUMN `ictDateFixed` DATETIME(3) NULL,
    ADD COLUMN `ictDiagnosisDetails` TEXT NULL,
    ADD COLUMN `ictFixDetails` TEXT NULL,
    ADD COLUMN `ictRecommendations` TEXT NULL;
