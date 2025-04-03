import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  trackTicket,
  createAccountManagementTicket,
  createTroubleshootingTicket,
  createDocumentUploadTicket,
  createTechnicalAssistanceTicket
} from '../controllers/ticketController.js';
import { generateCaptcha } from '../utils/captchaUtils.js';
import { upload } from '../middleware/multerMiddleware.js';

const router = express.Router();

// Generate CAPTCHA for ticket submission
router.get('/generate-captcha', (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress;
    const captcha = generateCaptcha(clientIp);
    res.json({ 
      success: true,
      captchaId: captcha.captchaId, 
      captchaCode: captcha.captchaCode 
    });
  } catch (error) {
    console.error('Error generating CAPTCHA:', error);
    res.status(429).json({ 
      success: false,
      message: error.message || 'Failed to generate CAPTCHA'
    });
  }
});

// Public routes (no authentication required)
router.post('/troubleshooting', createTroubleshootingTicket);
router.post('/account-management', createAccountManagementTicket);
router.post('/document-upload', upload, createDocumentUploadTicket);
router.post('/technical-assistance', createTechnicalAssistanceTicket);
router.post('/', createTicket);
router.post('/track', trackTicket);

// Protected routes (authentication required)
router.use(authenticateToken);

// User routes
router.get('/my-tickets', getTickets);
router.get('/my-tickets/:id', getTicketById);

// Admin routes
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

export default router; 