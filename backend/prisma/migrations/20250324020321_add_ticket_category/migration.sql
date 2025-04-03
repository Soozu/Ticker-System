/*
  Warnings:

  - You are about to drop the `tickets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `Comment_ticketId_fkey`;

-- DropForeignKey
ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_userId_fkey`;

-- DropIndex
DROP INDEX `Comment_ticketId_fkey` ON `comment`;

-- DropTable
DROP TABLE `tickets`;

-- CreateTable
CREATE TABLE `Ticket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `typeOfEquipment` VARCHAR(191) NULL,
    `modelOfEquipment` VARCHAR(191) NULL,
    `serialNo` VARCHAR(191) NULL,
    `specificProblem` VARCHAR(191) NULL,
    `diagnosis` VARCHAR(191) NULL,
    `actionTaken` VARCHAR(191) NULL,
    `recommendations` VARCHAR(191) NULL,
    `completedBy` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `accountType` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `documentTitle` VARCHAR(191) NULL,
    `documentType` VARCHAR(191) NULL,
    `documentDescription` VARCHAR(191) NULL,
    `files` VARCHAR(191) NULL,
    `userId` INTEGER NULL,

    INDEX `Ticket_category_idx`(`category`),
    INDEX `Ticket_status_idx`(`status`),
    INDEX `Ticket_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
