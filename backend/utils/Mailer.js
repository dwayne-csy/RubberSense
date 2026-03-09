// backend/utils/Mailer.js
const nodemailer = require("nodemailer");

const smtpEmail = process.env.SMTP_EMAIL || process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;
const smtpService = process.env.SMTP_SERVICE || (smtpHost.includes("gmail") ? "gmail" : undefined);

const transporterConfig = smtpService
  ? {
      service: smtpService,
      auth: { user: smtpEmail, pass: smtpPassword },
    }
  : {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpEmail, pass: smtpPassword },
    };

const transporter = nodemailer.createTransport(transporterConfig);

/**
 * Send an email with optional attachments
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - HTML message
 * @param {Array} options.attachments - Optional array of attachments [{ filename, content, encoding, contentType }]
 */
const sendEmail = async (options) => {
  try {
    if (!smtpEmail || !smtpPassword) {
      throw new Error("Missing SMTP credentials. Set SMTP_EMAIL and SMTP_PASSWORD in backend/config/.env");
    }

    const fromName = process.env.FROM_NAME || process.env.SMTP_FROM_NAME || process.env.APP_NAME || "RubberSense";
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_FROM_EMAIL || smtpEmail;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // Attach files if provided
    if (options.attachments && Array.isArray(options.attachments)) {
      mailOptions.attachments = options.attachments;
    }

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to: ${options.email}`);
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR:\n", error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
