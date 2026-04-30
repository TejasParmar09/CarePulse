const nodemailer = require("nodemailer")

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  })
}

async function sendEmail(options) {
  const { to, subject, html, text } = options
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"Hospital Appointments" <${process.env.NODEMAILER_EMAIL}>`,
    to,
    subject,
    html,
    text,
  })
}

function appointmentConfirmationEmail({
  patientName,
  doctorName,
  date,
  time,
  fee,
}) {
  const subject = "Appointment confirmed"
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,60,140,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#0b5ed7 0%,#084298 100%);padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Appointment confirmed</h1>
              <p style="margin:8px 0 0;color:#cfe2ff;font-size:14px;">Thank you for choosing our hospital</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.6;">Dear <strong>${patientName}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">Your appointment has been successfully booked with the following details:</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
                <tr><td style="padding:16px 20px;color:#0f172a;font-size:14px;"><strong style="color:#1d4ed8;">Doctor</strong><br/>${doctorName}</td></tr>
                <tr><td style="padding:0 20px 16px;color:#0f172a;font-size:14px;"><strong style="color:#1d4ed8;">Date</strong><br/>${date}</td></tr>
                <tr><td style="padding:0 20px 16px;color:#0f172a;font-size:14px;"><strong style="color:#1d4ed8;">Time</strong><br/>${time}</td></tr>
                <tr><td style="padding:0 20px 20px;color:#0f172a;font-size:14px;"><strong style="color:#1d4ed8;">Consultation fee</strong><br/>${fee}</td></tr>
              </table>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">Please arrive 10 minutes early. If you need to reschedule, use the patient portal or contact reception.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated message. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return { subject, html }
}

function appointmentReminderEmail({ patientName, doctorName, date, time }) {
  const subject = "Reminder: your appointment is coming up"
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,60,140,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Appointment reminder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hi <strong>${patientName}</strong>,</p>
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">This is a friendly reminder about your upcoming visit.</p>
              <table role="presentation" width="100%" style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:4px;">
                <tr><td style="padding:20px;color:#0f172a;font-size:14px;line-height:1.7;">
                  <strong style="color:#1d4ed8;">Doctor:</strong> ${doctorName}<br/>
                  <strong style="color:#1d4ed8;">Date:</strong> ${date}<br/>
                  <strong style="color:#1d4ed8;">Time:</strong> ${time}
                </td></tr>
              </table>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;">We look forward to seeing you. Bring a valid ID and any prior reports if applicable.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return { subject, html }
}

function appointmentCancellationEmail({ patientName, doctorName, reason }) {
  const subject = "Appointment cancelled"
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,60,140,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#172554 100%);padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Appointment cancelled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Dear <strong>${patientName}</strong>,</p>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">Your appointment with <strong style="color:#1e40af;">${doctorName}</strong> has been cancelled.</p>
              <table role="presentation" width="100%" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                <tr><td style="padding:16px 20px;color:#991b1b;font-size:14px;line-height:1.6;">
                  <strong style="color:#b91c1c;">Reason</strong><br/>${reason || "No reason provided"}
                </td></tr>
              </table>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.5;">You may book a new slot anytime through our website or app.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;background:#f8fafc;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Hospital Appointments — care team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return { subject, html }
}

module.exports = {
  sendEmail,
  appointmentConfirmationEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
}
