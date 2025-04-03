import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send an email using the provided settings or environment variables
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email plain text content (fallback)
 * @param {Object} [emailSettings] - Optional SMTP settings, will default to .env if not provided
 * @returns {Promise<Object>} - Send info
 */
export const sendEmail = async (options, emailSettings = null) => {
  try {
    // Use provided settings or default to environment variables
    const settings = emailSettings || {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.EMAIL_USER,
      smtpPassword: process.env.EMAIL_PASSWORD,
      senderName: process.env.SENDER_NAME || 'Ticket System',
      senderEmail: process.env.EMAIL_USER
    };

    // Gmail specific configuration
    const transporterConfig = {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword
      }
    };
    
    // Add special options for Gmail
    if (settings.smtpHost.includes('gmail')) {
      transporterConfig.service = 'gmail';
      // Gmail requires these additional settings
      transporterConfig.tls = {
        rejectUnauthorized: false
      };
    }

    // Create a transporter with the specified settings
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection configuration
    await transporter.verify();

    // Set up email data
    const mailOptions = {
      from: `"${settings.senderName}" <${settings.senderEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || ''
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Send ticket confirmation email
 * @param {Object} ticket - Ticket object
 * @param {Object} user - User object
 * @param {Object} [emailSettings] - Optional email settings
 */
export const sendTicketConfirmation = async (ticket, user, emailSettings = null) => {
  const subject = `Ticket #${ticket.id} Received - ${ticket.category.replace(/_/g, ' ')}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2196f3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Ticket Confirmation</h2>
      <p>Dear ${user.name},</p>
      <p>Your ticket has been received and is being processed. Here are the details:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Ticket ID:</strong> #${ticket.id}</p>
        <p><strong>Category:</strong> ${ticket.category.replace(/_/g, ' ')}</p>
        <p><strong>Subject:</strong> ${ticket.subject || 'N/A'}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
      </div>
      
      <p>Our team will review your request and provide updates as needed.</p>
      <p>Thank you for using our ticket system.</p>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Ticket #${ticket.id} received for ${ticket.category.replace(/_/g, ' ')}. Status: ${ticket.status}. We'll update you as needed.`
  }, emailSettings);
};

/**
 * Send ticket status update email
 * @param {Object} ticket - Updated ticket object
 * @param {Object} user - User object
 * @param {Object} update - The update object with previous status and comment
 * @param {Object} [emailSettings] - Optional email settings
 */
export const sendStatusUpdateEmail = async (ticket, user, update, emailSettings = null) => {
  const subject = `Ticket #${ticket.id} Updated - Now ${ticket.status.replace(/_/g, ' ')}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2196f3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Ticket Status Update</h2>
      <p>Dear ${user.name},</p>
      <p>The status of your ticket has been updated:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Ticket ID:</strong> #${ticket.id}</p>
        <p><strong>Category:</strong> ${ticket.category.replace(/_/g, ' ')}</p>
        <p><strong>Previous Status:</strong> ${update.previousStatus.replace(/_/g, ' ')}</p>
        <p><strong>New Status:</strong> ${ticket.status.replace(/_/g, ' ')}</p>
        <p><strong>Updated:</strong> ${new Date(update.createdAt).toLocaleString()}</p>
      </div>
      
      ${update.comment ? `<p><strong>Comments:</strong> ${update.comment}</p>` : ''}
      
      <p>Thank you for using our ticket system.</p>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Ticket #${ticket.id} status updated from ${update.previousStatus} to ${ticket.status}. ${update.comment ? 'Comment: ' + update.comment : ''}`
  }, emailSettings);
};

/**
 * Send test email to verify email settings
 * @param {string} recipientEmail - Email to send test to
 * @param {Object} emailSettings - SMTP settings to test
 */
export const sendTestEmail = async (recipientEmail, emailSettings) => {
  const subject = 'Test Email - Ticket System';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2196f3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Email Configuration Test</h2>
      <p>This is a test email from your ticket management system.</p>
      <p>If you're receiving this email, your email configuration is working correctly!</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>SMTP Host:</strong> ${emailSettings.smtpHost}</p>
        <p><strong>SMTP Port:</strong> ${emailSettings.smtpPort}</p>
        <p><strong>Sender:</strong> ${emailSettings.senderName} &lt;${emailSettings.senderEmail}&gt;</p>
        <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>You can now use these settings for your ticket system notifications.</p>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated test message.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text: `This is a test email from your ticket system. Email settings are working correctly.`
  }, emailSettings);
};

// Get email settings from global app settings or environment variables
const getEmailSettings = async () => {
  // First try to get from global app settings
  if (global.appSettings && global.appSettings.email) {
    return global.appSettings.email;
  }

  // Fallback to environment variables
  return {
    enabled: true, // Default to enabled when using env vars
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.EMAIL_USER,
    smtpPassword: process.env.EMAIL_PASSWORD,
    senderName: process.env.SENDER_NAME || 'Ticket System',
    senderEmail: process.env.EMAIL_USER
  };
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendTicketEmail = async (ticketData) => {
  const {
    email,
    name,
    trackingId,
    category,
    subject,
    message
  } = ticketData;

  const emailSubject = `Ticket Confirmation - ${category} Request`;
  
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2196f3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Ticket Confirmation</h2>
      <p>Dear ${name},</p>
      <p>Your ${category} request has been successfully submitted. Here are your ticket details:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      </div>

      <p>You can use this Tracking ID to check the status of your ticket at any time.</p>
      
      <p>Best regards,<br>SDO Imus City Support Team</p>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"SDO Imus City Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: emailSubject,
    html: emailBody
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

const sendResolvedTicketEmail = async (ticketData) => {
  const {
    email,
    name,
    trackingId,
    category,
    subject,
    ictFixDetails,
    ictRecommendations
  } = ticketData;

  const emailSubject = `Ticket ${trackingId} - Has Been Resolved`;
  
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #2196f3; border-bottom: 1px solid #eee; padding-bottom: 10px;">Ticket Resolved</h2>
      <p>Dear ${name},</p>
      <p>Your ticket has been resolved by our support team. Here are the details:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Resolution Details:</strong> ${ictFixDetails}</p>
        ${ictRecommendations ? `<p><strong>Recommendations:</strong> ${ictRecommendations}</p>` : ''}
      </div>

      <p>You can check your ticket status anytime at: <a href="http://localhost:3000/track-ticket">Track Ticket</a></p>
      
      <p>Best regards,<br>SDO Imus City Support Team</p>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"SDO Imus City Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: emailSubject,
    html: emailBody
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Resolution notification email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending resolution notification email:', error);
    throw error;
  }
};

export { sendTicketEmail, sendResolvedTicketEmail }; 