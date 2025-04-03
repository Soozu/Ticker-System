import prisma from '../lib/prisma.js';

// Get notifications for admin
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: req.user.id },
          { recipientId: null } // For broadcast notifications
        ]
      },
      include: {
        ticket: {
          select: {
            category: true,
            trackingId: true,
            priority: true,
            status: true,
            subject: true,
            documentSubject: true,
            documentType: true,
            locationType: true,
            schoolLevel: true,
            schoolName: true,
            taType: true,
            accountType: true,
            actionType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id: parseInt(id)
      },
      data: {
        read: true
      }
    });

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Create notification for new ticket
export const createTicketNotification = async (ticket) => {
  try {
    let title = `New ${ticket.priority} Priority Ticket`;
    let message = '';

    // Create category-specific notification message
    switch (ticket.category) {
      case 'TROUBLESHOOTING':
        message = `New troubleshooting ticket for ${ticket.typeOfEquipment || 'equipment'} at ${ticket.location || 'location not specified'}`;
        break;
      case 'ACCOUNT_MANAGEMENT':
        message = `${ticket.actionType || 'Action'} request for ${ticket.accountType || 'account'} at ${ticket.schoolName || 'school not specified'}`;
        break;
      case 'DOCUMENT_UPLOAD':
        message = `New document upload: ${ticket.documentType || 'Document'} from ${ticket.schoolName || 'school not specified'}`;
        break;
      case 'TECHNICAL_ASSISTANCE':
        message = `New ${ticket.taType || 'technical assistance'} request from ${ticket.schoolName || 'school not specified'}`;
        break;
      default:
        message = `A new ticket has been created: ${ticket.subject || ticket.documentSubject || 'No subject'}`;
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: 'NEW_TICKET',
        priority: ticket.priority,
        ticketId: ticket.id,
        read: false
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating ticket notification:', error);
    throw error;
  }
};

// Create notification for ticket status update
export const createStatusUpdateNotification = async (ticket, previousStatus) => {
  try {
    let title = `Ticket Status Updated`;
    let message = '';

    // Create category-specific status update message
    switch (ticket.category) {
      case 'TROUBLESHOOTING':
        message = `Troubleshooting ticket for ${ticket.typeOfEquipment || 'equipment'} at ${ticket.location || 'location not specified'} status changed from ${previousStatus} to ${ticket.status}`;
        break;
      case 'ACCOUNT_MANAGEMENT':
        message = `${ticket.actionType || 'Action'} request for ${ticket.accountType || 'account'} at ${ticket.schoolName || 'school not specified'} status changed from ${previousStatus} to ${ticket.status}`;
        break;
      case 'DOCUMENT_UPLOAD':
        message = `Document upload (${ticket.documentType || 'Document'}) from ${ticket.schoolName || 'school not specified'} status changed from ${previousStatus} to ${ticket.status}`;
        break;
      case 'TECHNICAL_ASSISTANCE':
        message = `${ticket.taType || 'Technical assistance'} request from ${ticket.schoolName || 'school not specified'} status changed from ${previousStatus} to ${ticket.status}`;
        break;
      default:
        message = `Ticket #${ticket.id} status changed from ${previousStatus} to ${ticket.status}`;
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: 'STATUS_UPDATE',
        priority: ticket.priority,
        ticketId: ticket.id,
        read: false
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating status update notification:', error);
    throw error;
  }
}; 