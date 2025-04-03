/*
  Warnings:

  - You are about to drop the column `actionTaken` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `completedBy` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `documentDescription` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `documentTitle` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `files` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `ticket` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `actionTaken`,
    DROP COLUMN `completedBy`,
    DROP COLUMN `department`,
    DROP COLUMN `diagnosis`,
    DROP COLUMN `documentDescription`,
    DROP COLUMN `documentTitle`,
    DROP COLUMN `documentType`,
    DROP COLUMN `employeeId`,
    DROP COLUMN `files`,
    DROP COLUMN `position`,
    DROP COLUMN `reason`,
    DROP COLUMN `recommendations`,
    DROP COLUMN `type`,
    ADD COLUMN `actionType` VARCHAR(191) NULL,
    ADD COLUMN `categorySpecificDetails` JSON NULL,
    ADD COLUMN `dateOfRequest` DATETIME(3) NULL,
    ADD COLUMN `documentMessage` VARCHAR(191) NULL,
    ADD COLUMN `documentSubject` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `message` VARCHAR(191) NULL,
    ADD COLUMN `subject` VARCHAR(191) NULL,
    MODIFY `category` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NULL DEFAULT 'PENDING',
    MODIFY `priority` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NULL;
