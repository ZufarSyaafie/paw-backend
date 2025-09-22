// utils/notificationsMailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || '',
  port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || ''
  }
});

async function sendEmail(to, subject, text, html = null) {
  if (!process.env.MAIL_USER) {
    // Mail not configured, skip but don't crash
    console.warn('MAIL_USER not set — skipping sendEmail');
    return;
  }
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
