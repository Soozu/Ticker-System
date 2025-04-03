import { PrismaClient } from '@prisma/client';
import { generateTrackingId } from '../utils/trackingId.js';
import { sendEmail } from '../utils/emailService.js';

const prisma = new PrismaClient();

export const createAccountManagementTicket = async (req, res) => {
  try {
    const {
      name,
      email,
      priority,
      accountType,
      actionType,
      subject,
      message
    } = req.body;

    // Validate required fields
    if (!name || !email || !priority || !accountType || !actionType || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Generate tracking ID
    const trackingId = generateTrackingId();

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        category: 'ACCOUNT_MANAGEMENT',
        name,
        email,
        priority,
        status: 'PENDING',
        trackingId,
        categorySpecificDetails: {
          type: 'Account Management',
          details: {
            accountType,
            actionType,
            subject,
            message
          }
        }
      }
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: `Account Management Request Confirmation - Ticket #${ticket.id}`,
      html: `
        <h2>Account Management Request Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Your account management request has been received and is being processed. Here are your ticket details:</p>
        <ul>
          <li><strong>Ticket ID:</strong> #${ticket.id}</li>
          <li><strong>Tracking ID:</strong> ${trackingId}</li>
          <li><strong>Account Type:</strong> ${accountType}</li>
          <li><strong>Action Type:</strong> ${actionType}</li>
          <li><strong>Subject:</strong> ${subject}</li>
        </ul>
        <p>You can track your ticket status using your Ticket ID and Tracking ID at any time.</p>
        <p>Our IT team will process your request and contact you through email.</p>
        <p>Thank you for your patience.</p>
      `
    });

    res.status(201).json({
      success: true,
      ticketId: ticket.id,
      trackingId: ticket.trackingId,
      message: 'Account management request created successfully'
    });

  } catch (error) {
    console.error('Error creating account management ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account management request',
      error: error.message
    });
  }
}; 