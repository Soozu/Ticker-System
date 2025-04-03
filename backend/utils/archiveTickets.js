import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Archives tickets that have been resolved for more than 2 days
 */
export const archiveOldTickets = async () => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find tickets that should be archived
    const ticketsToArchive = await prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        updatedAt: {
          lte: twoDaysAgo
        },
        archived: false
      }
    });

    // Archive each ticket
    const archivedTickets = await Promise.all(
      ticketsToArchive.map(ticket =>
        prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            archived: true,
            archivedAt: new Date()
          }
        })
      )
    );

    console.log(`Archived ${archivedTickets.length} tickets`);
    return archivedTickets;
  } catch (error) {
    console.error('Error archiving tickets:', error);
    throw error;
  }
};

/**
 * Deletes tickets that have been archived for more than 7 days
 */
export const deleteOldArchivedTickets = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find and delete tickets that were archived more than 7 days ago
    const result = await prisma.ticket.deleteMany({
      where: {
        archived: true,
        archivedAt: {
          lte: sevenDaysAgo
        }
      }
    });

    console.log(`Deleted ${result.count} old archived tickets`);
    return result;
  } catch (error) {
    console.error('Error deleting old archived tickets:', error);
    throw error;
  }
};

/**
 * Schedule the archiving and deletion tasks to run daily
 */
export const scheduleArchiving = () => {
  // Run both tasks once at startup
  archiveOldTickets();
  deleteOldArchivedTickets();

  // Then schedule to run daily at midnight
  setInterval(() => {
    archiveOldTickets();
    deleteOldArchivedTickets();
  }, 24 * 60 * 60 * 1000);
}; 