"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter;
async function getTransporter() {
    if (transporter)
        return transporter;
    if (process.env.NODE_ENV === 'production') {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    else {
        // Auto-create a throwaway Ethereal account for development
        const testAccount = await nodemailer_1.default.createTestAccount();
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('[Email] Using Ethereal test account:', testAccount.user);
    }
    return transporter;
}
async function sendPasswordResetEmail(to, name, resetToken) {
    const t = await getTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'exp://localhost:8081'}/reset-password?token=${resetToken}`;
    const info = await t.sendMail({
        from: process.env.EMAIL_FROM || '"Body is Diet" <noreply@bodyisdiet.com>',
        to,
        subject: 'Reset your Body is Diet password',
        html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#00E676;">Body is Diet</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new one:</p>
        <a href="${resetUrl}" style="
          display:inline-block;background:#00E676;color:#000;
          padding:14px 28px;border-radius:8px;font-weight:700;
          text-decoration:none;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
    });
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Email] Preview URL:', nodemailer_1.default.getTestMessageUrl(info));
    }
}
//# sourceMappingURL=email.js.map