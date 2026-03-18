require('dotenv').config();

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
        return jsonResponse(500, { error: 'Email service is not configured.' });
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const name = (payload.name || '').toString().trim();
        const email = (payload.email || '').toString().trim();
        const message = (payload.message || '').toString().trim();

        if (!name || !email || !message) {
            return jsonResponse(400, { error: 'Name, email, and message are required.' });
        }

        if (!isValidEmail(email)) {
            return jsonResponse(400, { error: 'Please enter a valid email address.' });
        }

        const submittedAt = formatTimestamp();
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailAppPassword
            }
        });

        await transporter.sendMail({
            from: gmailUser,
            to: gmailUser,
            replyTo: email,
            subject: `New Portfolio Contact Message from ${name}`,
            text: buildOwnerEmailText({ name, email, message, submittedAt }),
            html: buildOwnerEmailHtml({ safeName, safeEmail, safeMessage, submittedAt })
        });

        await transporter.sendMail({
            from: `"Mukund Khandelwal" <${gmailUser}>`,
            to: email,
            replyTo: gmailUser,
            subject: 'Thank you for contacting Mukund Khandelwal',
            text: buildAutoReplyText({ name }),
            html: buildAutoReplyHtml({ safeName })
        });

        return jsonResponse(200, {
            message: 'Message sent successfully. A thank-you email has also been sent to the sender.'
        });
    } catch (error) {
        return jsonResponse(500, { error: 'Unable to send message right now.' });
    }
};

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatTimestamp() {
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    }).format(new Date());
}

function buildOwnerEmailText({ name, email, message, submittedAt }) {
    return [
        'New message from your portfolio website',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Submitted: ${submittedAt}`,
        '',
        'Message:',
        message
    ].join('\n');
}

function buildAutoReplyText({ name }) {
    return [
        `Hi ${name},`,
        '',
        'Thank you for reaching out through my portfolio website.',
        'I have received your message and will get back to you as soon as possible.',
        '',
        'Best regards,',
        'Mukund Khandelwal'
    ].join('\n');
}

function buildOwnerEmailHtml({ safeName, safeEmail, safeMessage, submittedAt }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Portfolio Message</title>
</head>
<body style="margin:0;padding:0;background:#07111f;font-family:Segoe UI,Arial,sans-serif;color:#e8f1ff;">
  <div style="padding:32px 16px;background:radial-gradient(circle at top right,#16385f 0%,#07111f 58%);">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="padding:0;">
          <div style="border:1px solid rgba(124,242,200,0.18);border-radius:24px;overflow:hidden;background:#0d1b30;box-shadow:0 24px 60px rgba(0,0,0,0.35);">
            <div style="padding:28px 32px;background:linear-gradient(135deg,#7cf2c8 0%,#4ed9ff 100%);color:#04131f;">
              <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;opacity:0.8;">Portfolio Contact</div>
              <h1 style="margin:10px 0 8px;font-size:30px;line-height:1.2;">New website message received</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;">A visitor just submitted your portfolio contact form.</p>
            </div>
            <div style="padding:32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 14px;">
                <tr>
                  <td style="width:140px;color:#8ca3c7;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Sender</td>
                  <td style="background:#12243e;border:1px solid rgba(124,242,200,0.12);border-radius:16px;padding:16px 18px;">
                    <div style="font-size:20px;font-weight:700;color:#ffffff;">${safeName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="width:140px;color:#8ca3c7;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Email</td>
                  <td style="background:#12243e;border:1px solid rgba(124,242,200,0.12);border-radius:16px;padding:16px 18px;">
                    <a href="mailto:${safeEmail}" style="color:#7cf2c8;text-decoration:none;font-size:18px;font-weight:600;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="width:140px;color:#8ca3c7;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Submitted</td>
                  <td style="background:#12243e;border:1px solid rgba(124,242,200,0.12);border-radius:16px;padding:16px 18px;font-size:16px;color:#ffffff;">
                    ${submittedAt}
                  </td>
                </tr>
              </table>

              <div style="margin-top:22px;background:#0a1628;border:1px solid rgba(78,217,255,0.16);border-radius:20px;padding:22px 24px;">
                <div style="color:#8ca3c7;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Message</div>
                <div style="font-size:17px;line-height:1.9;color:#f3f7ff;">${safeMessage}</div>
              </div>

              <div style="margin-top:24px;text-align:center;">
                <a href="mailto:${safeEmail}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#7cf2c8 0%,#4ed9ff 100%);color:#04131f;font-weight:700;text-decoration:none;">Reply to ${safeName}</a>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

function buildAutoReplyHtml({ safeName }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank You</title>
</head>
<body style="margin:0;padding:0;background:#f3f8ff;font-family:Segoe UI,Arial,sans-serif;color:#10233f;">
  <div style="padding:32px 16px;background:linear-gradient(180deg,#eef7ff 0%,#dff2ff 100%);">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;border-collapse:collapse;">
      <tr>
        <td style="padding:0;">
          <div style="overflow:hidden;border-radius:24px;background:#ffffff;border:1px solid rgba(78,217,255,0.18);box-shadow:0 22px 50px rgba(16,35,63,0.12);">
            <div style="padding:28px 32px;background:linear-gradient(135deg,#4ed9ff 0%,#7cf2c8 100%);">
              <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#11314b;">Mukund Khandelwal</div>
              <h1 style="margin:10px 0 6px;font-size:30px;line-height:1.2;color:#0a2135;">Thank you for reaching out</h1>
              <p style="margin:0;font-size:15px;line-height:1.8;color:#12324c;">Your message has been received successfully.</p>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 16px;font-size:18px;line-height:1.8;">Hi ${safeName},</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#37506a;">
                Thank you for contacting me through my portfolio website. I appreciate you taking the time to write, and I will review your message as soon as possible.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.9;color:#37506a;">
                If your message is urgent, you can also reply directly to this email.
              </p>
              <div style="padding:20px 22px;border-radius:18px;background:#eff9ff;border:1px solid rgba(78,217,255,0.18);">
                <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#4b6986;margin-bottom:8px;">What happens next</div>
                <div style="font-size:15px;line-height:1.8;color:#16314b;">I will get back to you after reviewing your message. Thank you again for connecting.</div>
              </div>
              <p style="margin:24px 0 0;font-size:16px;line-height:1.8;color:#16314b;">
                Best regards,<br>
                <strong>Mukund Khandelwal</strong>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
