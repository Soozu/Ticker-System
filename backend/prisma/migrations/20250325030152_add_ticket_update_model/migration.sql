/*
  Warnings:

  - You are about to drop the `accountmanagementdetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documentuploaddetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `troubleshootingdetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `accountmanagementdetails` DROP FOREIGN KEY `AccountManagementDetails_ticketId_fkey`;

-- DropForeignKey
ALTER TABLE `documentuploaddetails` DROP FOREIGN KEY `DocumentUploadDetails_ticketId_fkey`;

-- DropForeignKey
ALTER TABLE `troubleshootingdetails` DROP FOREIGN KEY `TroubleshootingDetails_ticketId_fkey`;

-- DropTable
DROP TABLE `accountmanagementdetails`;

-- DropTable
DROP TABLE `documentuploaddetails`;

-- DropTable
DROP TABLE `troubleshootingdetails`;

-- CreateTable
CREATE TABLE `TicketUpdate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `adminId` INTEGER NOT NULL,
    `previousStatus` VARCHAR(191) NOT NULL,
    `newStatus` VARCHAR(191) NOT NULL,
    `comment` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TicketUpdate_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TicketUpdate` ADD CONSTRAINT `TicketUpdate_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
