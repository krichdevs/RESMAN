import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface BookingData {
  id: string;
  title: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  status: string;
  room: {
    name: string;
    building: string;
    floor: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

type NotificationType = 'created' | 'updated' | 'confirmed' | 'cancelled' | 'reminder';

/**
 * Send booking notification email
 * @param booking - Booking data
 * @param type - Type of notification
 */
export async function sendBookingNotification(
  booking: BookingData,
  type: NotificationType
): Promise<void> {
  try {
    const subject = getEmailSubject(type, booking);
    const html = getEmailTemplate(type, booking);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Central University <noreply@centraluniversity.edu.gh>',
      to: booking.user.email,
      subject,
      html,
    });

    logger.info(`Notification email sent: ${type} to ${booking.user.email}`);
  } catch (error) {
    logger.error('Failed to send notification email:', error);
    // Don't throw - email failures shouldn't break the main flow
  }
}

/**
 * Get email subject based on notification type
 */
function getEmailSubject(type: NotificationType, booking: BookingData): string {
  const subjects: Record<NotificationType, string> = {
    created: `Booking Request Submitted: ${booking.title}`,
    updated: `Booking Updated: ${booking.title}`,
    confirmed: `Booking Confirmed: ${booking.title}`,
    cancelled: `Booking Cancelled: ${booking.title}`,
    reminder: `Reminder: Upcoming Booking - ${booking.title}`,
  };
  return subjects[type];
}

/**
 * Get email HTML template based on notification type
 */
function getEmailTemplate(type: NotificationType, booking: BookingData): string {
  const formattedDate = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1a365d;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f7fafc;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .booking-details {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border: 1px solid #e2e8f0;
        }
        .detail-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #edf2f7;
        }
        .detail-label {
          font-weight: bold;
          width: 120px;
          color: #4a5568;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
        }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-confirmed { background-color: #d1fae5; color: #065f46; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; }
        .footer {
          text-align: center;
          padding: 20px;
          color: #718096;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          background-color: #1a365d;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Central University</h1>
        <p>Available Class System</p>
      </div>
      <div class="content">
        ${getContentByType(type, booking, formattedDate)}
      </div>
      <div class="footer">
        <p>This is an automated message from the Central University Available Class System.</p>
        <p>© ${new Date().getFullYear()} Central University. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return baseTemplate;
}

/**
 * Get email content based on notification type
 */
function getContentByType(
  type: NotificationType,
  booking: BookingData,
  formattedDate: string
): string {
  const statusClass = booking.status.toLowerCase();
  const bookingDetails = `
    <div class="booking-details">
      <div class="detail-row">
        <span class="detail-label">Title:</span>
        <span>${booking.title}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Room:</span>
        <span>${booking.room.name} (${booking.room.building}, ${booking.room.floor})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span>${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time:</span>
        <span>${booking.startTime} - ${booking.endTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="status status-${statusClass}">${booking.status}</span>
      </div>
    </div>
  `;

  const contents: Record<NotificationType, string> = {
    created: `
      <h2>Booking Request Submitted</h2>
      <p>Dear ${booking.user.firstName},</p>
      <p>Your booking request has been successfully submitted and is pending approval.</p>
      ${bookingDetails}
      <p>You will receive another notification once your booking is confirmed by an administrator.</p>
      <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">View Booking</a>
    `,
    updated: `
      <h2>Booking Updated</h2>
      <p>Dear ${booking.user.firstName},</p>
      <p>Your booking has been updated with the following details:</p>
      ${bookingDetails}
      <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">View Booking</a>
    `,
    confirmed: `
      <h2>Booking Confirmed! ✓</h2>
      <p>Dear ${booking.user.firstName},</p>
      <p>Great news! Your booking has been confirmed.</p>
      ${bookingDetails}
      <p>Please ensure you arrive on time and leave the room in good condition.</p>
      <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">View Booking</a>
    `,
    cancelled: `
      <h2>Booking Cancelled</h2>
      <p>Dear ${booking.user.firstName},</p>
      <p>Your booking has been cancelled.</p>
      ${bookingDetails}
      <p>If you did not request this cancellation, please contact the administration.</p>
      <a href="${process.env.FRONTEND_URL}/bookings" class="button">Make New Booking</a>
    `,
    reminder: `
      <h2>Upcoming Booking Reminder</h2>
      <p>Dear ${booking.user.firstName},</p>
      <p>This is a reminder about your upcoming booking:</p>
      ${bookingDetails}
      <p>Please ensure you arrive on time.</p>
      <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">View Booking</a>
    `,
  };

  return contents[type];
}

/**
 * Send a generic email
 * @param to - Recipient email
 * @param subject - Email subject
 * @param html - Email HTML content
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Central University <noreply@centraluniversity.edu.gh>',
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return false;
  }
}
