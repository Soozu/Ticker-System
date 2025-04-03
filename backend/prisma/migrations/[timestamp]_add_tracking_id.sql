-- Add trackingId column as nullable first
ALTER TABLE `Ticket` ADD COLUMN `trackingId` VARCHAR(191);

-- Update existing records with unique tracking IDs
UPDATE `Ticket` SET `trackingId` = CONCAT(
    SUBSTRING(HEX(RAND()), -8)
);

-- Make trackingId required and unique
ALTER TABLE `Ticket` MODIFY COLUMN `trackingId` VARCHAR(191) NOT NULL;
ALTER TABLE `Ticket` ADD UNIQUE INDEX `Ticket_trackingId_key`(`trackingId`); 