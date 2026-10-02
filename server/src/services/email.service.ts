import nodemailer from 'nodemailer';

export class EmailService {
  private getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        family: 4, // Force IPv4 to avoid ENETUNREACH IPv6 routing errors on Render/cloud environments
        connectionTimeout: 10000, // 10s connection timeout
        greetingTimeout: 10000,   // 10s greeting timeout
        socketTimeout: 15000,     // 15s socket timeout
        dnsTimeout: 10000,        // 10s DNS resolution timeout
        auth: {
          user,
          pass,
        },
      } as any);
    }

    return null;
  }

  public async sendPasswordResetEmail(toEmail: string, rawToken: string): Promise<boolean> {
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const baseUrl = rawClientUrl.replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@leopardx-xerox.com';
    const subject = 'LeopardX Xerox - Reset Your Super Admin Password';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; margin: 0; padding: 30px; color: #f8fafc; }
            .card { max-width: 540px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
            .brand-logo { background: linear-gradient(135deg, #f59e0b, #ea580c); width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; }
            .brand-title { font-size: 20px; font-weight: 800; color: #ffffff; }
            h2 { color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 16px; font-weight: 800; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .btn-container { text-align: center; margin: 32px 0; }
            .btn { background: linear-gradient(135deg, #f59e0b, #ea580c); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3); }
            .warning { background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 12px; padding: 14px; font-size: 12px; color: #c7d2fe; margin-top: 24px; }
            .footer { margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">
              <span class="brand-title">Leopard<span style="color: #f59e0b;">X</span> Xerox Super Admin</span>
            </div>

            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your LeopardX Xerox Super Admin password. Click the button below to create a new password:</p>

            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>

            <div class="warning">
              ⏳ <strong>Notice:</strong> This password reset link will expire in <strong>15 minutes</strong>. If you did not request this password reset, you can safely ignore this email.
            </div>

            <div class="footer">
              LeopardX Xerox • Automated Printing Kiosk System<br>
              LeopardX Technologies
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hello,

We received a request to reset your LeopardX Xerox Super Admin password.

Click or copy the link below to create a new password:
${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.

LeopardX Xerox
LeopardX Technologies
    `;

    try {
      const transporter = this.getTransporter();

      if (transporter) {
        await transporter.sendMail({
          from: `"LeopardX Xerox Super Admin" <${fromAddress}>`,
          to: toEmail,
          subject,
          text: textBody,
          html: htmlBody,
        });
        console.log(`[Email Service] Password reset email sent via Nodemailer to ${toEmail}`);
        return true;
      } else {
        console.warn(
          '[Email Service] SMTP credentials not configured (SMTP_USER / SMTP_PASS missing).'
        );
        return false;
      }
    } catch (error) {
      console.error('[Email Service Error]', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
