import axios from 'axios';

export class EmailService {
  public async sendPasswordResetEmail(toEmail: string, rawToken: string): Promise<boolean> {
    const rawClientUrl =
      process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawClientUrl.replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    const fromAddress =
      process.env.MAIL_FROM ||
      'LeopardX Xerox Super Admin <onboarding@resend.dev>';
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

    // 1. Resend HTTPS API (POST https://api.resend.com/emails)
    const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    if (resendApiKey) {
      try {
        const res = await axios.post(
          'https://api.resend.com/emails',
          {
            from: fromAddress,
            to: [toEmail],
            subject,
            html: htmlBody,
            text: textBody,
          },
          {
            headers: {
              Authorization: `Bearer ${resendApiKey.trim()}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (res.status >= 200 && res.status < 300) {
          console.log(
            `[Email Service] Password reset email dispatched successfully via Resend HTTPS API to ${toEmail}`
          );
          return true;
        }
      } catch (err: any) {
        console.error(
          '[Email Service Error - Resend HTTPS API]',
          err?.response?.data || err?.message || err
        );
      }
    }

    // 2. Brevo / Sendinblue HTTPS API (POST https://api.brevo.com/v3/smtp/email)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      try {
        const res = await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: {
              name: 'LeopardX Xerox Super Admin',
              email: process.env.MAIL_FROM || 'kondhalkarp1600@gmail.com',
            },
            to: [{ email: toEmail }],
            subject,
            htmlContent: htmlBody,
            textContent: textBody,
          },
          {
            headers: {
              'api-key': brevoApiKey.trim(),
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (res.status >= 200 && res.status < 300) {
          console.log(
            `[Email Service] Password reset email dispatched successfully via Brevo HTTPS API to ${toEmail}`
          );
          return true;
        }
      } catch (err: any) {
        console.error(
          '[Email Service Error - Brevo HTTPS API]',
          err?.response?.data || err?.message || err
        );
      }
    }

    // 3. SendGrid HTTPS API (POST https://api.sendgrid.com/v3/mail/send)
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      try {
        const res = await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [{ to: [{ email: toEmail }] }],
            from: { email: process.env.MAIL_FROM || 'kondhalkarp1600@gmail.com', name: 'LeopardX Xerox Super Admin' },
            subject,
            content: [
              { type: 'text/plain', value: textBody },
              { type: 'text/html', value: htmlBody },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${sendgridApiKey.trim()}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        if (res.status >= 200 && res.status < 300) {
          console.log(
            `[Email Service] Password reset email dispatched successfully via SendGrid HTTPS API to ${toEmail}`
          );
          return true;
        }
      } catch (err: any) {
        console.error(
          '[Email Service Error - SendGrid HTTPS API]',
          err?.response?.data || err?.message || err
        );
      }
    }

    // 4. Custom HTTPS Email Webhook / REST API
    const customEndpoint = process.env.EMAIL_API_ENDPOINT;
    if (customEndpoint) {
      try {
        const res = await axios.post(
          customEndpoint,
          {
            to: toEmail,
            from: fromAddress,
            subject,
            html: htmlBody,
            text: textBody,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.EMAIL_API_KEY && {
                Authorization: `Bearer ${process.env.EMAIL_API_KEY.trim()}`,
              }),
            },
            timeout: 10000,
          }
        );

        if (res.status >= 200 && res.status < 300) {
          console.log(
            `[Email Service] Password reset email dispatched successfully via Custom HTTPS Endpoint to ${toEmail}`
          );
          return true;
        }
      } catch (err: any) {
        console.error(
          '[Email Service Error - Custom HTTPS Endpoint]',
          err?.response?.data || err?.message || err
        );
      }
    }

    console.warn(
      '[Email Service Warning] No transactional HTTPS Email API key configured. Please set RESEND_API_KEY, BREVO_API_KEY, or SENDGRID_API_KEY in server environment variables.'
    );
    return false;
  }
}

export const emailService = new EmailService();
