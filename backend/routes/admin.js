import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getCategorySpecificDetails } from '../controllers/ticketController.js';
import { sendTestEmail, sendStatusUpdateEmail, sendResolvedTicketEmail } from '../utils/emailSender.js';
import { getAdminNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { createExcelWorkbook } from '../utils/excelFormatter.js';
import * as XLSX from 'xlsx';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Helper function to format category names
const formatCategoryName = (category) => {
  if (!category) return '';
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges'
    });
  }
};

// Get dashboard statistics
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { report_type = 'overall', start_date, end_date, time_period } = req.query;
    
    // Build date filter if dates are provided
    const dateFilter = {};
    
    if (time_period) {
      const today = new Date();
      let startDate = new Date();
      
      switch (time_period) {
        case 'weekly':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'annual':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          // If time_period is not recognized, use custom date range if provided
          if (start_date && end_date) {
            dateFilter.createdAt = {
              gte: new Date(start_date),
              lte: new Date(end_date)
            };
          }
          break;
      }
      
      // Set date filter for predefined time periods
      if (['weekly', 'monthly', 'annual'].includes(time_period)) {
        dateFilter.createdAt = {
          gte: startDate,
          lte: today
        };
      }
    } else if (start_date && end_date) {
      dateFilter.createdAt = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    } else if (start_date) {
      dateFilter.createdAt = {
        gte: new Date(start_date)
      };
    } else if (end_date) {
      dateFilter.createdAt = {
        lte: new Date(end_date)
      };
    }

    // Get counts for different ticket statuses
    const [
      totalTickets,
      pendingTickets,
      inProgressTickets,
      resolvedTickets,
      archivedTickets,
      recentlyArchivedTickets
    ] = await Promise.all([
      prisma.ticket.count({ where: dateFilter }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'PENDING', archived: false } }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'IN_PROGRESS', archived: false } }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'RESOLVED', archived: false } }),
      prisma.ticket.count({ where: { ...dateFilter, archived: true } }),
      prisma.ticket.count({
        where: {
          ...dateFilter,
          archived: true,
          archivedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    // Get average archive time (time between resolution and archiving)
    const archivedTicketsData = await prisma.ticket.findMany({
      where: {
        ...dateFilter,
        archived: true,
        archivedAt: { not: null }
      },
      select: {
        updatedAt: true,
        archivedAt: true
      }
    });

    let averageArchiveTime = 2; // Default value
    if (archivedTicketsData.length > 0) {
      const totalDays = archivedTicketsData.reduce((sum, ticket) => {
        const timeDiff = ticket.archivedAt.getTime() - ticket.updatedAt.getTime();
        return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
      }, 0);
      averageArchiveTime = Math.round(totalDays / archivedTicketsData.length);
    }

    // Get status distribution including archived
    const statusDistribution = await prisma.ticket.groupBy({
      by: ['status', 'archived'],
      _count: true,
      where: dateFilter
    });

    // Get category distribution
    const categoryDistribution = await prisma.ticket.groupBy({
      by: ['category'],
      _count: true,
      where: dateFilter
    });

    // Get priority distribution
    const priorityDistribution = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: true,
      where: dateFilter
    });
    
    // Get detailed category-status breakdown if needed
    let categoryStatusBreakdown = [];
    if (report_type === 'detailed' || report_type === 'category_status') {
      const categories = await prisma.ticket.groupBy({
        by: ['category'],
        where: dateFilter
      });
      
      categoryStatusBreakdown = await Promise.all(
        categories.map(async (cat) => {
          const [pending, inProgress, resolved, archived] = await Promise.all([
            prisma.ticket.count({ 
              where: { 
                ...dateFilter,
                category: cat.category,
                status: 'PENDING',
                archived: false
              } 
            }),
            prisma.ticket.count({ 
              where: { 
                ...dateFilter,
                category: cat.category,
                status: 'IN_PROGRESS',
                archived: false
              } 
            }),
            prisma.ticket.count({ 
              where: { 
                ...dateFilter,
                category: cat.category,
                status: 'RESOLVED',
                archived: false
              } 
            }),
            prisma.ticket.count({ 
              where: { 
                ...dateFilter,
                category: cat.category,
                archived: true
              } 
            })
          ]);
          
          return {
            category: cat.category,
            pending,
            inProgress,
            resolved,
            archived,
            total: pending + inProgress + resolved + archived
          };
        })
      );
    }

    // Format the response data
    const stats = {
      totalTickets,
      pendingTickets,
      inProgressTickets,
      resolvedTickets,
      archivedTickets,
      recentlyArchivedTickets,
      averageArchiveTime,
      autoArchivedPercentage: 100, // Since all archives are automatic for now
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        archived: item.archived,
        count: item._count
      })),
      categoryDistribution: categoryDistribution.map(item => ({
        category: item.category,
        count: item._count
      })),
      priorityDistribution: priorityDistribution.map(item => ({
        priority: item.priority,
        count: item._count
      }))
    };
    
    // Add additional data based on report type
    if (categoryStatusBreakdown.length > 0) {
      stats.categoryStatusBreakdown = categoryStatusBreakdown;
    }
    
    // Add date range information if provided
    if (start_date || end_date) {
      stats.dateRange = {
        startDate: start_date ? new Date(start_date).toISOString() : null,
        endDate: end_date ? new Date(end_date).toISOString() : null
      };
    }

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// Get all tickets with all statuses
router.get('/tickets/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    // Transform the data for better readability
    const formattedTickets = tickets.map(ticket => {
      // Get category specific details
      const categoryDetails = getCategorySpecificDetails(ticket);
      
      return {
        trackingId: ticket.trackingId || '',
        name: ticket.name || ticket.user?.name || '',
        email: ticket.email || ticket.user?.email || '',
        category: ticket.category ? ticket.category.replace(/_/g, ' ') : '',
        status: ticket.status ? ticket.status.replace(/_/g, ' ') : '',
        priority: ticket.priority || '',
        location: ticket.location === 'SDO_IMUS_CITY' ? 'SDO - Imus City' : 'School - Imus City',
        department: ticket.department || ticket.user?.department || '',
        schoolLevel: categoryDetails?.details?.schoolLevel || '',
        schoolName: categoryDetails?.details?.schoolName || '',
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '',
        typeOfEquipment: ticket.typeOfEquipment || '',
        modelOfEquipment: ticket.modelOfEquipment || '',
        serialNo: ticket.serialNo || '',
        specificProblem: ticket.specificProblem || '',
        assignedTo: ticket.ictAssignedTo || '',
        diagnosisDetails: ticket.ictDiagnosisDetails || '',
        fixDetails: ticket.ictFixDetails || '',
        dateFixed: ticket.ictDateFixed ? new Date(ticket.ictDateFixed).toLocaleString() : '',
        recommendations: ticket.ictRecommendations || ''
      };
    });

    // Create Excel workbook
    const wb = createExcelWorkbook(formattedTickets);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets_report.xlsx');
    
    // Send the Excel file
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all tickets',
      error: error.message
    });
  }
});

// Export tickets with time period support
router.get('/tickets/export', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { time_period, start_date, end_date } = req.query;
    
    // Build date filter based on time period or custom date range
    let dateFilter = {};
    
    if (time_period) {
      const today = new Date();
      let startDate = new Date();
      
      switch (time_period) {
        case 'weekly':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'annual':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          // If time_period is not recognized, use custom date range if provided
          if (start_date && end_date) {
            dateFilter.createdAt = {
              gte: new Date(start_date),
              lte: new Date(end_date)
            };
          }
          break;
      }
      
      // Set date filter for predefined time periods
      if (['weekly', 'monthly', 'annual'].includes(time_period)) {
        dateFilter.createdAt = {
          gte: startDate,
          lte: today
        };
      }
    } else if (start_date && end_date) {
      // Custom date range
      dateFilter.createdAt = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      };
    }
    
    // Fetch tickets with the date filter
    const tickets = await prisma.ticket.findMany({
      where: dateFilter,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    // Transform the data for better readability
    const formattedTickets = tickets.map(ticket => {
      // Get category specific details
      const categoryDetails = getCategorySpecificDetails(ticket);
      
      return {
        trackingId: ticket.trackingId || '',
        name: ticket.name || ticket.user?.name || '',
        email: ticket.email || ticket.user?.email || '',
        category: ticket.category ? ticket.category.replace(/_/g, ' ') : '',
        status: ticket.status ? ticket.status.replace(/_/g, ' ') : '',
        priority: ticket.priority || '',
        location: ticket.location === 'SDO_IMUS_CITY' ? 'SDO - Imus City' : 'School - Imus City',
        department: ticket.department || ticket.user?.department || '',
        schoolLevel: categoryDetails?.details?.schoolLevel || '',
        schoolName: categoryDetails?.details?.schoolName || '',
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '',
        typeOfEquipment: ticket.typeOfEquipment || '',
        modelOfEquipment: ticket.modelOfEquipment || '',
        serialNo: ticket.serialNo || '',
        specificProblem: ticket.specificProblem || '',
        assignedTo: ticket.ictAssignedTo || '',
        diagnosisDetails: ticket.ictDiagnosisDetails || '',
        fixDetails: ticket.ictFixDetails || '',
        dateFixed: ticket.ictDateFixed ? new Date(ticket.ictDateFixed).toLocaleString() : '',
        recommendations: ticket.ictRecommendations || ''
      };
    });

    // Create Excel workbook
    const wb = createExcelWorkbook(formattedTickets);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets_report.xlsx');
    
    // Send the Excel file
    res.send(Buffer.from(excelBuffer));
  } catch (error) {
    console.error('Error exporting tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting tickets',
      error: error.message
    });
  }
});

// Get all tickets with pagination and filtering
router.get('/tickets', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search, showArchived = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      archived: showArchived === 'true'
    };
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { trackingId: { contains: search } },
        { documentSubject: { contains: search } },
        { documentMessage: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
        { specificProblem: { contains: search } }
      ];
    }

    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.count({ where })
    ]);

    res.json({
      success: true,
      message: 'Tickets retrieved successfully',
      data: {
        tickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets'
    });
  }
});

// Get archived tickets count
router.get('/tickets/archived/count', authenticateToken, isAdmin, async (req, res) => {
  try {
    const count = await prisma.ticket.count({
      where: {
        archived: true
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error counting archived tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting archived tickets'
    });
  }
});

// Manually archive a ticket
router.post('/tickets/:id/archive', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        archived: true,
        archivedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Ticket archived successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error archiving ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving ticket'
    });
  }
});

// Restore an archived ticket
router.post('/tickets/:id/restore', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        archived: false,
        archivedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Ticket restored successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error restoring ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring ticket'
    });
  }
});

// Get ticket by ID
router.get('/tickets/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
    }

    // Fetch ticket with related data
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        updates: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Add category-specific details
    const ticketWithCategoryDetails = {
      ...ticket,
      categorySpecificDetails: getCategorySpecificDetails(ticket)
    };

    res.json({
      success: true,
      message: 'Ticket retrieved successfully',
      data: ticketWithCategoryDetails
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket details'
    });
  }
});

// Update ticket status
router.put('/tickets/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const adminId = req.user.id;

    // Validate ID
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: PENDING, IN_PROGRESS, RESOLVED, CLOSED'
      });
    }

    // Check if ticket exists and get user information for email notifications
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Use transaction to update ticket and create update history
    const result = await prisma.$transaction(async (prisma) => {
      // Update ticket status
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          status,
          updatedAt: new Date()
        },
        include: {
          user: true
        }
      });

      // Create update history record
      const update = await prisma.ticketUpdate.create({
        data: {
          ticketId: ticketId,
          adminId: adminId,
          previousStatus: existingTicket.status,
          newStatus: status,
          comment: comment || '',
        }
      });

      return { ticket: updatedTicket, update };
    });

    // Get email settings from global app settings or use defaults
    let emailSettings = null;
    if (global.appSettings && global.appSettings.email) {
      emailSettings = global.appSettings.email;
    }

    // Send email notification if the ticket has a user and email notifications are enabled
    if (result.ticket.user && 
        emailSettings && 
        emailSettings.enableNotifications === true && 
        emailSettings.smtpUser && 
        emailSettings.smtpPassword) {
      try {
        await sendStatusUpdateEmail(
          result.ticket, 
          result.ticket.user, 
          result.update,
          emailSettings
        );
      } catch (emailError) {
        // Don't fail the request if email sending fails
      }
    }

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating ticket status'
    });
  }
});

// Update ICT details for a ticket
router.put('/tickets/:id/ict-details', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const {
      assignedTo,
      diagnosisDetails,
      fixDetails,
      dateFixed,
      recommendations
    } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ictAssignedTo: assignedTo,
        ictDiagnosisDetails: diagnosisDetails,
        ictFixDetails: fixDetails,
        ictDateFixed: dateFixed ? new Date(dateFixed) : null,
        ictRecommendations: recommendations,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'ICT details updated successfully',
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ICT details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ICT details'
    });
  }
});

// Get system settings
router.get('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = {
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        senderName: 'IT Support',
        senderEmail: '',
        enableNotifications: true,
      },
      categories: {
        ticketCategories: [
          { id: 1, name: 'TROUBLESHOOTING', active: true },
          { id: 2, name: 'ACCOUNT_MANAGEMENT', active: true },
          { id: 3, name: 'DOCUMENT_UPLOAD', active: true },
          { id: 4, name: 'TECHNICAL_ASSISTANCE', active: true }
        ]
      },
      admin: {
        searchFilters: {
          showResolvedTickets: true,
          showArchivedTickets: false,
          defaultDateRange: 30,
        },
        notifications: {
          desktopNotifications: true,
          soundAlerts: true,
          newTicketAlert: true,
          urgentTicketAlert: true,
        },
        autoArchive: {
          enabled: true,
          daysAfterResolution: 30,
        },
        quickFilters: {
          showPriority: true,
          showCategory: true,
          showStatus: true,
          showDateRange: true,
        }
      }
    };

    // Apply stored settings if available
    if (global.appSettings) {
      if (global.appSettings.email) {
        settings.email = global.appSettings.email;
      }
      if (global.appSettings.categories) {
        settings.categories = global.appSettings.categories;
      }
      if (global.appSettings.admin) {
        settings.admin = global.appSettings.admin;
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings'
    });
  }
});

// Update general settings
router.post('/settings/general', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!global.appSettings) {
      global.appSettings = {};
    }
    
    global.appSettings.general = req.body.general;
    
    res.json({
      success: true,
      message: 'General settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update general settings'
    });
  }
});

// Update email settings
router.post('/settings/email', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!global.appSettings) {
      global.appSettings = {};
    }
    
    const { email } = req.body;
    global.appSettings.email = email;

    // Update .env file with new email settings
    const fs = require('fs').promises;
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');

    // Read current .env content
    let envContent = await fs.readFile(envPath, 'utf8');

    // Update email-related environment variables
    const envUpdates = {
      EMAIL_USER: email.smtpUser,
      EMAIL_PASSWORD: email.smtpPassword,
      EMAIL_SERVICE: 'gmail',
      SMTP_HOST: email.smtpHost,
      SMTP_PORT: email.smtpPort,
      EMAIL_SECURE: email.smtpPort === '465' ? 'true' : 'false',
      SENDER_NAME: email.senderName || 'SDO Imus City Support'
    };

    // Update each variable in the .env content
    Object.entries(envUpdates).forEach(([key, value]) => {
      const regex = new RegExp(`${key}=.*`, 'g');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    // Write updated content back to .env
    await fs.writeFile(envPath, envContent);
    
    res.json({
      success: true,
      message: 'Email settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email settings'
    });
  }
});

// Update category settings
router.post('/settings/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!global.appSettings) {
      global.appSettings = {};
    }
    
    global.appSettings.categories = req.body.categories;
    
    res.json({
      success: true,
      message: 'Category settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating category settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category settings'
    });
  }
});

router.post('/settings/test-email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const emailSettings = req.body;
    
    // Validate required email settings
    if (!emailSettings.smtpHost || !emailSettings.smtpPort || !emailSettings.smtpUser || 
        !emailSettings.smtpPassword || !emailSettings.senderEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required email settings (host, port, username, password, or sender email)'
      });
    }
    
    // Gmail-specific validation
    if (emailSettings.smtpHost.includes('gmail')) {
      // Gmail requires the smtpUser to be a valid email address
      if (!emailSettings.smtpUser.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'For Gmail SMTP, the username must be a complete email address'
        });
      }
    }
    
    // Send a test email to the admin's email
    const recipientEmail = req.user.email || emailSettings.senderEmail;
    await sendTestEmail(recipientEmail, emailSettings);
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`
    });
  } catch (error) {
    // Extract more useful error information
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check your username and password. If using Gmail with 2FA, use an App Password.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Connection failed. Check your SMTP host and port settings.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to mail server failed. Check your network connection and server settings.';
    } else if (error.message.includes('self signed certificate')) {
      errorMessage = 'SSL/TLS certificate error. Try using port 587 with TLS enabled.';
    }
    
    res.status(500).json({
      success: false,
      message: `Failed to send test email: ${errorMessage}`,
      errorCode: error.code
    });
  }
});

// Add a public endpoint to get active categories
router.get('/settings/categories', async (req, res) => {
  try {
    // In a real app, you would retrieve this from a database
    // For now, return hardcoded categories
    const categories = [
      { id: 1, name: 'TROUBLESHOOTING', active: true },
      { id: 2, name: 'ACCOUNT_MANAGEMENT', active: true },
      { id: 3, name: 'DOCUMENT_UPLOAD', active: true },
      { id: 4, name: 'TECHNICAL_ASSISTANCE', active: true }
    ];
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
});

// Send resolution email
router.post('/tickets/:id/send-resolution', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      name,
      trackingId,
      category,
      subject,
      ictFixDetails,
      ictRecommendations
    } = req.body;

    await sendResolvedTicketEmail({
      email,
      name,
      trackingId,
      category,
      subject,
      ictFixDetails,
      ictRecommendations
    });

    res.json({
      success: true,
      message: 'Resolution email sent successfully'
    });
  } catch (error) {
    console.error('Error sending resolution email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send resolution email'
    });
  }
});

// Get notifications
router.get('/notifications', authenticateToken, isAdmin, getAdminNotifications);

// Clear all notifications
router.post('/notifications/clear-all', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Delete all notifications for this admin
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipientId: req.user.id },
          { recipientId: null } // Include global admin notifications
        ]
      }
    });

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
      data: []
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, isAdmin, markNotificationAsRead);

// Update admin settings
router.post('/settings/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    if (!global.appSettings) {
      global.appSettings = {};
    }
    
    global.appSettings.admin = req.body.admin;
    
    // Store settings in database or file system if needed
    // For now, we'll just keep them in memory
    
    res.json({
      success: true,
      message: 'Admin settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin settings'
    });
  }
});

export default router; 