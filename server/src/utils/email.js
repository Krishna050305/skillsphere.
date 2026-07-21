import nodemailer from 'nodemailer';

const isProduction = process.env.NODE_ENV === 'production';
const hasSmtpConfig = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

// In production, enforce SMTP configurations and throw an error on startup if missing.
if (isProduction && !hasSmtpConfig) {
  throw new Error(
    'CRITICAL: SMTP configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) is missing in production mode!'
  );
}

// Set up transporter if we have the config
const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@skillsphere.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Sends an email, logging to console in development and using SMTP in production.
 * @param {Object} mailOptions - Nodemailer mail options
 */
const sendMailHelper = async (mailOptions) => {
  if (!hasSmtpConfig) {
    console.log('\n=================== DEV EMAIL SENT (CONSOLE ONLY) ===================');
    console.log(`To:      ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log('------------------ HTML BODY ------------------');
    console.log(mailOptions.html);
    console.log('======================================================\n');
    console.log('Note: To send real emails, configure SMTP_ variables in your .env file.');
    return;
  }

  await transporter.sendMail(mailOptions);
};

/**
 * Send email verification link to user.
 * @param {String} email
 * @param {String} name
 * @param {String} token
 */
export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo-container { display: flex; align-items: center; margin-bottom: 24px; }
        .logo-box { width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 8px; display: inline-block; text-align: center; line-height: 40px; color: #fff; font-weight: bold; font-size: 20px; margin-right: 12px; }
        .logo-text { font-size: 20px; font-weight: bold; color: #0f172a; }
        h2 { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; }
        p { font-size: 16px; line-height: 24px; color: #475569; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo-container">
          <div class="logo-box">S</div>
          <span class="logo-text">SkillSphere</span>
        </div>
        <h2>Verify your email address</h2>
        <p>Hello ${name},</p>
        <p>Thank you for signing up on SkillSphere! Please verify your email address to unlock full access to post gigs, submit proposals, and collaborate.</p>
        <a href="${verifyUrl}" class="btn" target="_blank">Verify Email</a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${verifyUrl}" style="color: #4f46e5;">${verifyUrl}</a></p>
        <div class="footer">
          This link will expire in 24 hours. If you did not create an account with us, please ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMailHelper({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your SkillSphere Account',
    html,
  });
};

/**
 * Send password reset link to user.
 * @param {String} email
 * @param {String} name
 * @param {String} token
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo-container { display: flex; align-items: center; margin-bottom: 24px; }
        .logo-box { width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 8px; display: inline-block; text-align: center; line-height: 40px; color: #fff; font-weight: bold; font-size: 20px; margin-right: 12px; }
        .logo-text { font-size: 20px; font-weight: bold; color: #0f172a; }
        h2 { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; }
        p { font-size: 16px; line-height: 24px; color: #475569; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo-container">
          <div class="logo-box">S</div>
          <span class="logo-text">SkillSphere</span>
        </div>
        <h2>Reset your password</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password on SkillSphere. Click the button below to choose a new password.</p>
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a></p>
        <div class="footer">
          This link will expire in 1 hour. If you did not request a password reset, please ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMailHelper({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your SkillSphere Password',
    html,
  });
};
