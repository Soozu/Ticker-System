-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `assignedTo` VARCHAR(191) NULL,
    ADD COLUMN `dateFixed` DATETIME(3) NULL,
    ADD COLUMN `diagnosisDetails` TEXT NULL,
    ADD COLUMN `documentPath` VARCHAR(191) NULL,
    ADD COLUMN `fixDetails` TEXT NULL,
    ADD COLUMN `recommendations` TEXT NULL;
