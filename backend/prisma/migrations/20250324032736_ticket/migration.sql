/*
  Warnings:

  - A unique constraint covering the columns `[trackingId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `trackingId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Ticket_trackingId_key` ON `Ticket`(`trackingId`);

-- CreateIndex
CREATE INDEX `Ticket_trackingId_idx` ON `Ticket`(`trackingId`);
