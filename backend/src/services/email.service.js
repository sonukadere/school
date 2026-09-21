import nodemailer from 'nodemailer';
import { prisma } from '../config/database.js';
import env from '../config/env.js';
import { notDeleted } from '../utils/helpers.js';
import ApiError from '../utils/ApiError.js';

const SETTINGS_ID = 'school-settings';

/**
 * Resolves the effective SMTP configuration by reading DB settings first,
 * then falling back to environment variables.
 */
export async function getEffectiveSmtpConfig() {
  let dbSettings = null;
  try {
    dbSettings = await prisma.setting.findFirst({ where: notDeleted() });
  } catch (err) {
    console.warn('[EMAIL SERVICE] Could not read settings from DB:', err.message);
  }

  const host = dbSettings?.smtpHost || env.smtp.host || '';
  const port = Number(dbSettings?.smtpPort || env.smtp.port || 587);
  const secure = dbSettings?.smtpSecure ?? (port === 465 || env.smtp.secure);
  const user = dbSettings?.smtpUser || env.smtp.user || '';
  const pass = dbSettings?.smtpPass || env.smtp.pass || '';
  const fromName = dbSettings?.smtpFromName || env.smtp.fromName || dbSettings?.schoolName || 'Daily Day Academy';
  const fromEmail = dbSettings?.smtpFromEmail || env.smtp.fromEmail || dbSettings?.email || 'no-reply@dailydayacademy.edu';

  const isConfigured = Boolean(host && port && user);

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
    isConfigured,
  };
}

/**
 * Returns safe SMTP settings for UI consumption (password masked).
 */
export async function getSmtpSettingsForClient() {
  const config = await getEffectiveSmtpConfig();
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    isConfigured: config.isConfigured,
    hasPassword: Boolean(config.pass),
  };
}

/**
 * Updates SMTP configuration in the database.
 */
export async function updateSmtpSettings(data) {
  const { host, port, secure, user, pass, fromName, fromEmail } = data;

  const existing = await prisma.setting.findFirst({ where: notDeleted() });
  const updateData = {};

  if (host !== undefined) updateData.smtpHost = host ? host.trim() : null;
  if (port !== undefined) updateData.smtpPort = port ? Number(port) : 587;
  if (secure !== undefined) updateData.smtpSecure = Boolean(secure);
  if (user !== undefined) updateData.smtpUser = user ? user.trim() : null;
  
  // Only update pass if a non-placeholder value was provided
  if (pass !== undefined && pass !== '' && pass !== '••••••••') {
    updateData.smtpPass = pass;
  } else if (pass === '') {
    updateData.smtpPass = null;
  }

  if (fromName !== undefined) updateData.smtpFromName = fromName ? fromName.trim() : null;
  if (fromEmail !== undefined) updateData.smtpFromEmail = fromEmail ? fromEmail.trim().toLowerCase() : null;

  let updated;
  if (!existing) {
    updated = await prisma.setting.create({
      data: {
        id: SETTINGS_ID,
        schoolName: fromName || 'Daily Day Academy',
        ...updateData,
      },
    });
  } else {
    updated = await prisma.setting.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  return getSmtpSettingsForClient();
}

/**
 * Builds a Nodemailer transporter instance using given or effective config.
 */
function createTransporter(config) {
  if (!config.host) {
    throw ApiError.badRequest('SMTP Host is required to establish connection.');
  }

  const transportOptions = {
    host: config.host,
    port: Number(config.port) || 587,
    secure: Boolean(config.secure), // true for 465, false for other ports
    auth: config.user ? {
      user: config.user,
      pass: config.pass || '',
    } : undefined,
    // Sensible timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };

  // If self-signed or internal test server in dev mode
  if (process.env.NODE_ENV === 'development') {
    transportOptions.tls = {
      rejectUnauthorized: false,
    };
  }

  return nodemailer.createTransport(transportOptions);
}

/**
 * Verifies SMTP connection credentials.
 */
export async function verifySmtpConnection(customConfig = null) {
  let config = customConfig;
  if (!config) {
    config = await getEffectiveSmtpConfig();
  } else if (!config.pass) {
    // If testing using UI values but pass is empty, fall back to stored pass
    const effective = await getEffectiveSmtpConfig();
    config.pass = effective.pass;
  }

  if (!config.host || !config.port) {
    throw ApiError.badRequest('SMTP Host and Port are required.');
  }

  const transporter = createTransporter(config);
  try {
    await transporter.verify();
    return { success: true, message: 'SMTP server connection verified successfully.' };
  } catch (error) {
    console.error('[EMAIL SERVICE] SMTP verification failed:', error.message);
    throw ApiError.badRequest(`SMTP Connection failed: ${error.message}`);
  }
}

/**
 * Generic email sender.
 * Gracefully handles unconfigured SMTP without crashing the calling workflow.
 */
export async function sendEmail({ to, subject, text, html, attachments }) {
  const config = await getEffectiveSmtpConfig();

  if (!config.isConfigured) {
    console.warn(`[EMAIL SERVICE] Email sending skipped for "${subject}" to "${to}": SMTP is not configured.`);
    return {
      success: false,
      skipped: true,
      reason: 'SMTP is not configured in school settings.',
    };
  }

  const transporter = createTransporter(config);
  const fromAddress = `"${config.fromName}" <${config.fromEmail}>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
      html: html || `<p>${text}</p>`,
      attachments,
    });

    console.log(`[EMAIL SERVICE] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed to send email to ${to}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sends a live test email to verify credentials and check delivery.
 */
export async function sendTestEmail(recipientEmail, customConfig = null) {
  if (!recipientEmail) {
    throw ApiError.badRequest('Recipient email is required for test email.');
  }

  let config = customConfig;
  if (!config) {
    config = await getEffectiveSmtpConfig();
  } else if (!config.pass) {
    const effective = await getEffectiveSmtpConfig();
    config.pass = effective.pass;
  }

  if (!config.host) {
    throw ApiError.badRequest('SMTP Host is required.');
  }

  const transporter = createTransporter(config);
  const fromAddress = `"${config.fromName || 'Daily Day Academy'}" <${config.fromEmail || 'no-reply@school.com'}>`;
  const timestamp = new Date().toLocaleString();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${config.fromName || 'School Management'}</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">SMTP Configuration Test</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b;">
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px; color: #166534; font-size: 16px; font-weight: 600;">✓ Connection Successful!</h3>
          <p style="margin: 0; color: #15803d; font-size: 14px;">Your school SMTP email server is correctly configured and successfully delivering outbound messages.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">SMTP Server:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${config.host}:${config.port}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Encryption / SSL:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${config.secure ? 'SSL / TLS (Port 465)' : 'STARTTLS (Port 587)'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Sender Email:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${config.fromEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Timestamp:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${timestamp}</td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
          This is an automated diagnostic test email sent from the School Management System settings dashboard.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject: `[Test] SMTP Email Service Verified - ${config.fromName || 'School Management'}`,
      html,
    });
    return {
      success: true,
      message: `Test email successfully dispatched to ${recipientEmail}.`,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[EMAIL SERVICE] Test email delivery failed:', error.message);
    throw ApiError.badRequest(`Failed to deliver test email: ${error.message}`);
  }
}

/**
 * Sends a password reset email to a user.
 */
export async function sendPasswordResetEmail({ to, resetToken, userName }) {
  const clientUrl = env.clientUrl || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  const config = await getEffectiveSmtpConfig();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${config.fromName}</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
      </div>
      <div style="padding: 32px 24px; color: #1e293b;">
        <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${userName || 'User'}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
          We received a request to reset your password for your school portal account. Click the button below to choose a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Reset Password</a>
        </div>
        <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">
          Or copy and paste this link into your browser:<br/>
          <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          This link will expire in 1 hour. If you did not request this password reset, please ignore this email or contact the school administrator immediately.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Password Reset Request - ${config.fromName}`,
    html,
  });
}
