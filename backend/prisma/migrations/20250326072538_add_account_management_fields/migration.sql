-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `locationType` VARCHAR(191) NULL,
    ADD COLUMN `schoolLevel` VARCHAR(191) NULL,
    ADD COLUMN `schoolName` VARCHAR(191) NULL,
    MODIFY `message` TEXT NULL;
