-- DropForeignKey
ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_userId_fkey`;

-- DropIndex
DROP INDEX `tickets_userId_fkey` ON `tickets`;

-- AlterTable
ALTER TABLE `tickets` MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
