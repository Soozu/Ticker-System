import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendTicketEmail } from '../utils/emailSender.js';
import { validateCaptcha } from '../utils/captchaUtils.js';
import { canSubmitTicket, recordSubmission } from '../utils/ticketRateLimit.js';

const prisma = new PrismaClient();

// Generate tracking ID
const generateTrackingId = (ticketId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}-${ticketId}`;
};

// Send ticket confirmation email using our utility
const sendTicketConfirmationEmail = async (ticket) => {
  try {
    if (!ticket.email || !ticket.trackingId) {
      console.log('Missing email or trackingId for confirmation email:', ticket);
      return;
    }
    await sendTicketEmail({
      email: ticket.email,
      name: ticket.name,
      trackingId: ticket.trackingId,
      category: ticket.category,
      subject: ticket.subject || ticket.documentSubject,
      message: ticket.message || ticket.documentMessage
    });
  } catch (error) {
    console.error('Error sending ticket confirmation email:', error);
    // Don't throw error to prevent blocking ticket creation
  }
};

// Validation schemas for different ticket categories
const troubleshootingSchema = z.object({
  category: z.literal('TROUBLESHOOTING'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  department: z.string().min(1, 'Department is required'),
  typeOfEquipment: z.string().min(1, 'Equipment type is required'),
  modelOfEquipment: z.string().min(1, 'Equipment model is required'),
  serialNo: z.string().min(1, 'Serial number is required'),
  specificProblem: z.string().min(1, 'Problem description is required'),
});

const accountManagementSchema = z.object({
  category: z.literal('ACCOUNT_MANAGEMENT'),
  type: z.enum(['Account Request', 'Password Reset']),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  department: z.string().min(1, 'Department is required'),
  reason: z.string().min(1, 'Reason is required'),
  // Conditional fields based on type
  position: z.string().optional(),
  employeeId: z.string().optional(),
  accountType: z.enum(['email', 'system', 'both']).optional(),
});

const documentUploadSchema = z.object({
  category: z.literal('DOCUMENT_UPLOAD'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  department: z.string().min(1, 'Department is required'),
  documentTitle: z.string().min(1, 'Document title is required'),
  documentType: z.enum(['official', 'report', 'form', 'other']),
  documentDescription: z.string().min(1, 'Document description is required'),
  files: z.string().optional(), // JSON string of file paths
});

// Helper function to format validation errors
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.path.join('.'),
    message: error.message
  }));
};

// Helper function to send response
const sendResponse = (res, status, success, message, data = null) => {
  return res.status(status).json({
    success,
    message,
    data,
  });
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/documents';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExt}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
}).single('file');

// Create document upload ticket
const createDocumentUploadTicket = async (req, res) => {
  try {
    const {
      name,
      email,
      priority,
      location,
      subject,
      message,
      captchaId,
      captchaCode
    } = req.body;

    const clientIp = req.ip || req.connection.remoteAddress;

    // Create ticket with attachment in a single transaction
    const ticket = await prisma.$transaction(async (prisma) => {
      // Create the ticket first
      const newTicket = await prisma.ticket.create({
        data: {
          name,
          email,
          priority,
          location,
          subject,
          message,
          category: 'DOCUMENT_UPLOAD',
          status: 'PENDING',
          categorySpecificDetails: {
            documentSubject: subject,
            documentMessage: message,
            department: 'Document Processing'
          }
        }
      });

      // Generate tracking ID
      const trackingId = generateTrackingId(newTicket.id);

      // Update ticket with tracking ID
      const updatedTicket = await prisma.ticket.update({
        where: { id: newTicket.id },
        data: { trackingId }
      });

      // If file was uploaded, create attachment
      if (req.file) {
        await prisma.attachment.create({
          data: {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            ticketId: updatedTicket.id
          }
        });
      }

      return updatedTicket;
    });

    // Send confirmation email
    await sendTicketConfirmationEmail(ticket);

    return res.status(201).json({
      success: true,
      message: 'Document upload ticket created successfully',
      trackingId: ticket.trackingId
    });
  } catch (error) {
    console.error('Error creating document upload ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create document upload ticket'
    });
  }
};

// Create ticket based on category
const createTicket = async (req, res) => {
  try {
    const { category, captchaId, captchaCode, ...ticketData } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Validate CAPTCHA
    if (!captchaId || !captchaCode) {
      return res.status(400).json({ 
        success: false,
        message: 'CAPTCHA verification required' 
      });
    }

    try {
      const isCaptchaValid = validateCaptcha(captchaId, captchaCode, clientIp);
      if (!isCaptchaValid) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid or expired CAPTCHA code' 
        });
      }
    } catch (error) {
      return res.status(429).json({ 
        success: false,
        message: error.message 
      });
    }

    // Check rate limiting
    try {
      canSubmitTicket(ticketData.email, clientIp);
    } catch (error) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }

    let validationSchema;

    switch (category) {
      case 'TROUBLESHOOTING':
        validationSchema = troubleshootingSchema;
        break;
      case 'ACCOUNT_MANAGEMENT':
        validationSchema = accountManagementSchema;
        break;
      case 'DOCUMENT_UPLOAD':
        validationSchema = documentUploadSchema;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket category'
        });
    }

    try {
      validationSchema.parse({ category, ...ticketData });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(error.errors)
      });
    }

    // Create ticket first to get the ID
    const ticket = await prisma.ticket.create({
      data: {
        ...ticketData,
        category,
        status: 'PENDING'
      }
    });

    // Generate tracking ID using the ticket ID
    const trackingId = generateTrackingId(ticket.id);

    // Update the ticket with the tracking ID
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { trackingId }
    });

    // Record successful submission for rate limiting
    recordSubmission(ticketData.email, clientIp);

    if (updatedTicket.email) {
      await sendTicketConfirmationEmail(updatedTicket);
    }

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticketId: updatedTicket.id,
      trackingId: updatedTicket.trackingId
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
};

// Get all tickets with filtering and pagination
const getTickets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category,
      department,
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specificProblem: { contains: search, mode: 'insensitive' } },
        { documentTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    // For non-admin users, only show their own tickets
    if (req.user && req.user.role !== 'ADMIN') {
      where.email = req.user.email;
    }

    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              name: true,
              email: true,
              department: true
            }
          }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return sendResponse(res, 200, true, 'Tickets retrieved successfully', {
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return sendResponse(res, 500, false, 'Failed to fetch tickets');
  }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true
          }
        },
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        updates: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ticket) {
      return sendResponse(res, 404, false, 'Ticket not found');
    }

    // Check if user has permission to view this ticket
    if (req.user && req.user.role !== 'ADMIN' && ticket.email !== req.user.email) {
      return sendResponse(res, 403, false, 'Access denied');
    }

    // Add category-specific details for better organization
    const ticketWithCategoryDetails = {
      ...ticket,
      categorySpecificDetails: getCategorySpecificDetails(ticket)
    };

    return sendResponse(res, 200, true, 'Ticket retrieved successfully', { ticket: ticketWithCategoryDetails });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return sendResponse(res, 500, false, 'Failed to fetch ticket');
  }
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) {
      return sendResponse(res, 404, false, 'Ticket not found');
    }

    // Only allow updating certain fields based on category
    const allowedUpdates = [
      'status',
      'priority',
      'completedBy',
      'diagnosis',
      'actionTaken',
      'recommendations',
      'response'
    ];

    // Add category-specific fields
    if (ticket.category === 'TROUBLESHOOTING') {
      allowedUpdates.push('specificProblem', 'typeOfEquipment', 'modelOfEquipment', 'serialNo');
    } else if (ticket.category === 'ACCOUNT_MANAGEMENT') {
      allowedUpdates.push('accountType', 'reason');
    } else if (ticket.category === 'DOCUMENT_UPLOAD') {
      allowedUpdates.push('documentTitle', 'documentType', 'documentDescription', 'files');
    }

    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: filteredUpdateData
    });

    return sendResponse(res, 200, true, 'Ticket updated successfully', { ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return sendResponse(res, 500, false, 'Failed to update ticket');
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) {
      return sendResponse(res, 404, false, 'Ticket not found');
    }

    // Only admin can delete tickets
    if (req.user.role !== 'ADMIN') {
      return sendResponse(res, 403, false, 'Access denied');
    }

    await prisma.ticket.delete({
      where: { id: parseInt(id) }
    });

    return sendResponse(res, 200, true, 'Ticket deleted successfully');
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return sendResponse(res, 500, false, 'Failed to delete ticket');
  }
};

const trackTicket = async (req, res) => {
  try {
    const { trackingId, email } = req.body;

    // Validate input
    if (!trackingId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Tracking ID and email are required'
      });
    }

    // Validate tracking ID format
    const trackingIdRegex = /^\d{8}-\d+$/;
    if (!trackingIdRegex.test(trackingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tracking ID format. Expected format: YYYYMMDD-TICKETID'
      });
    }

    // Find the ticket
    const ticket = await prisma.ticket.findFirst({
      where: {
        AND: [
          { trackingId },
          { email: email }
        ]
      },
      select: {
        id: true,
        category: true,
        status: true,
        priority: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        trackingId: true,
        // ICT Support fields
        ictAssignedTo: true,
        ictDiagnosisDetails: true,
        ictFixDetails: true,
        ictDateFixed: true,
        ictRecommendations: true,
        // Troubleshooting specific fields
        location: true,
        dateOfRequest: true,
        typeOfEquipment: true,
        modelOfEquipment: true,
        serialNo: true,
        specificProblem: true,
        // Account Management specific fields
        accountType: true,
        actionType: true,
        subject: true,
        message: true,
        // Document Upload specific fields
        documentSubject: true,
        documentMessage: true,
        // Category specific details
        categorySpecificDetails: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'No ticket found with the provided tracking ID and email'
      });
    }

    // Format dates
    const formattedTicket = {
      ...ticket,
      createdAt: ticket.createdAt.toLocaleString(),
      updatedAt: ticket.updatedAt.toLocaleString()
    };

    // Return ticket details based on category
    const ticketDetails = {
      ...formattedTicket,
      categorySpecificDetails: getCategorySpecificDetails(formattedTicket)
    };

    res.status(200).json({
      success: true,
      ticket: ticketDetails
    });

  } catch (error) {
    console.error('Error tracking ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track ticket'
    });
  }
};

// Helper function to get category-specific details
const getCategorySpecificDetails = (ticket) => {
  switch (ticket.category) {
    case 'TROUBLESHOOTING':
      return {
        type: 'Technical Support',
        details: {
          location: ticket.location,
          dateOfRequest: ticket.dateOfRequest,
          equipment: ticket.typeOfEquipment,
          model: ticket.modelOfEquipment,
          serialNo: ticket.serialNo,
          problem: ticket.specificProblem
        }
      };
    case 'ACCOUNT_MANAGEMENT':
      return {
        type: 'Account Management',
        details: {
          accountType: ticket.accountType,
          actionType: ticket.actionType,
          subject: ticket.subject,
          message: ticket.message
        }
      };
    case 'DOCUMENT_UPLOAD':
      return {
        type: 'Document Processing',
        details: {
          subject: ticket.documentSubject,
          message: ticket.documentMessage
        }
      };
    default:
      return {};
  }
};

// Create account management ticket
const createAccountManagementTicket = async (req, res) => {
  try {
    const {
      name,
      email,
      priority,
      accountType,
      actionType,
      locationType,
      schoolLevel,
      schoolName,
      department,
      subject,
      message,
      captchaId,
      captchaCode
    } = req.body;

    // Validate CAPTCHA
    const isValidCaptcha = await validateCaptcha(captchaId, captchaCode, req.ip);
    if (!isValidCaptcha) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Create ticket with tracking ID
    const ticket = await prisma.ticket.create({
      data: {
        category: 'ACCOUNT_MANAGEMENT',
        name,
        email,
        priority,
        accountType,
        actionType,
        locationType,
        schoolLevel: schoolLevel || null,
        schoolName: schoolName || null,
        department: department || null,
        subject,
        message,
        status: 'PENDING'
      }
    });

    // Generate tracking ID based on ticket ID
    const trackingId = generateTrackingId(ticket.id);

    // Update ticket with tracking ID
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { trackingId }
    });

    // Send confirmation email
    await sendTicketConfirmationEmail({
      email,
      name,
      trackingId,
      category: 'Account Management',
      subject,
      message
    });

    res.status(201).json({
      message: 'Account management ticket created successfully',
      ticketId: ticket.id,
      trackingId
    });
  } catch (error) {
    console.error('Error creating account management ticket:', error);
    res.status(500).json({ message: 'Failed to create account management ticket' });
  }
};

// Create troubleshooting ticket
const createTroubleshootingTicket = async (req, res) => {
  try {
    const { captchaId, captchaCode, ...ticketData } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Validate CAPTCHA
    if (!captchaId || !captchaCode) {
      return res.status(400).json({ 
        success: false,
        message: 'CAPTCHA verification required' 
      });
    }

    try {
      const isCaptchaValid = validateCaptcha(captchaId, captchaCode, clientIp);
      if (!isCaptchaValid) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid or expired CAPTCHA code' 
        });
      }
    } catch (error) {
      return res.status(429).json({ 
        success: false,
        message: error.message 
      });
    }

    // Check rate limiting
    try {
      canSubmitTicket(ticketData.email, clientIp);
    } catch (error) {
      return res.status(429).json({
        success: false,
        message: error.message
      });
    }

    // Create ticket first to get the ID
    const ticket = await prisma.ticket.create({
      data: {
        category: 'TROUBLESHOOTING',
        name: ticketData.name,
        email: ticketData.email,
        department: ticketData.department,
        location: ticketData.locationType === 'SCHOOL' ? ticketData.school : 'SDO - Imus City',
        dateOfRequest: new Date(ticketData.dateOfRequest),
        typeOfEquipment: ticketData.typeOfEquipment,
        modelOfEquipment: ticketData.modelOfEquipment,
        serialNo: ticketData.serialNo,
        specificProblem: ticketData.specificProblem,
        priority: ticketData.priority,
        status: 'PENDING',
        categorySpecificDetails: {
          type: 'Technical Support',
          details: {
            location: ticketData.locationType === 'SCHOOL' ? ticketData.school : 'SDO - Imus City',
            dateOfRequest: ticketData.dateOfRequest,
            equipment: ticketData.typeOfEquipment,
            model: ticketData.modelOfEquipment,
            serialNo: ticketData.serialNo,
            problem: ticketData.specificProblem
          }
        }
      }
    });

    // Generate tracking ID using the ticket ID
    const trackingId = generateTrackingId(ticket.id);

    // Update the ticket with the tracking ID
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { trackingId }
    });

    // Record successful submission for rate limiting
    recordSubmission(ticketData.email, clientIp);

    if (updatedTicket.email) {
      await sendTicketConfirmationEmail(updatedTicket);
    }

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticketId: updatedTicket.id,
      trackingId: updatedTicket.trackingId
    });
  } catch (error) {
    console.error('Error creating troubleshooting ticket:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to create troubleshooting ticket', 
      error: error.message 
    });
  }
};

// Module exports
export {
  createTroubleshootingTicket,
  createAccountManagementTicket,
  createDocumentUploadTicket,
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  trackTicket,
  getCategorySpecificDetails
}; 