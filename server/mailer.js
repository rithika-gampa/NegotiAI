// Optional email delivery for verification codes.
//
// If SMTP env vars are configured, OTP codes are emailed for real. If not,
// the app stays in demo mode (the code is shown on screen instead) — so it
// works out of the box with zero setup, and turns into real delivery the
// moment you add credentials. Nothing here ever throws in a way that blocks
// signup: a send failure just falls back to demo mode.
//
// To enable real email, set in .env (any SMTP provider works — Brevo,
// SendGrid, Mailgun, or a Gmail "app password"):
//   SMTP_HOST=smtp-relay.brevo.com
//   SMTP_PORT=587
//   SMTP_USER=your_smtp_user
//   SMTP_PASS=your_smtp_pass
//   MAIL_FROM="NegotiAI <no-reply@yourdomain.com>"

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

function isMailConfigured() {
  return Boolean(
    nodemailer &&
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // 465 = implicit TLS, else STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

// Returns true if the email was actually sent, false otherwise (caller then
// falls back to demo mode). Never throws.
async function sendOtpEmail(to, code, name) {
  if (!isMailConfigured()) return false;
  try {
    const from = process.env.MAIL_FROM || `NegotiAI <${process.env.SMTP_USER}>`;
    await getTransporter().sendMail({
      from,
      to,
      subject: `Your NegotiAI verification code: ${code}`,
      text:
        `Hi ${name || "there"},\n\n` +
        `Your NegotiAI verification code is ${code}. It expires in 10 minutes.\n\n` +
        `If you didn't create a NegotiAI account, you can ignore this email.`,
      html:
        `<div style="font-family:Arial,sans-serif;max-width:440px;margin:auto">` +
        `<h2 style="color:#17293A">Verify your NegotiAI account</h2>` +
        `<p>Hi ${name || "there"}, your verification code is:</p>` +
        `<div style="font-size:30px;font-weight:700;letter-spacing:6px;color:#0D9488;margin:16px 0">${code}</div>` +
        `<p style="color:#5F736E;font-size:13px">This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>` +
        `</div>`,
    });
    return true;
  } catch (err) {
    console.warn("Email OTP send failed, falling back to demo mode:", err.message);
    return false;
  }
}

module.exports = { isMailConfigured, sendOtpEmail };
