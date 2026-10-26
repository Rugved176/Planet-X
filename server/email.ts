import { dbManager, EmailLog, Registration } from './db.ts';

interface SendEmailParams {
  to: string;
  subject: string;
  type: EmailLog['type'];
  previewText: string;
  htmlBody: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailLog> {
  const { to, subject, type, previewText, htmlBody } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'PLANET-X 2026 <onboarding@resend.dev>';
  
  let deliveryStatus: 'delivered' | 'accepted' | 'failed' = 'accepted';

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html: htmlBody
        })
      });

      if (response.ok) {
        deliveryStatus = 'delivered';
      } else {
        const errorData = await response.json();
        console.warn('Resend API returned non-200 status:', errorData);
        deliveryStatus = 'accepted'; // fallback accepted to outbox
      }
    } catch (err) {
      console.error('Failed to communicate with Resend API:', err);
      deliveryStatus = 'accepted';
    }
  }

  const logEntry: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to,
    subject,
    type,
    sentAt: new Date().toISOString(),
    status: deliveryStatus,
    previewText,
    htmlBody
  };

  dbManager.update(db => {
    db.emailLogs.unshift(logEntry);
  });

  return logEntry;
}

// Brand HTML email template builder
export function generateBrandEmailHtml(title: string, subtitle: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050713; color: #e2e8f0; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0b1126; border: 1px solid #1e294f; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0b1126 0%, #172554 100%); padding: 32px 28px; border-bottom: 1px solid #1e294f; text-align: center; }
    .kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px; }
    .brand-title { font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 6px 0; letter-spacing: 0.05em; }
    .brand-sub { font-size: 13px; color: #94a3b8; margin: 0; }
    .body-content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .badge-info { background-color: #0369a1; color: #e0f2fe; }
    .badge-success { background-color: #065f46; color: #d1fae5; }
    .badge-warning { background-color: #854d0e; color: #fef9c3; }
    .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #070c1d; border-radius: 8px; overflow: hidden; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid #151f3d; font-size: 13px; }
    .data-table tr:last-child td { border-bottom: none; }
    .label-col { color: #94a3b8; font-weight: 500; width: 38%; }
    .val-col { color: #f8fafc; font-weight: 600; }
    .roster-list { margin: 8px 0; padding-left: 20px; color: #cbd5e1; }
    .footer { padding: 24px 28px; background-color: #050814; border-top: 1px solid #151f3d; font-size: 11px; color: #64748b; text-align: center; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 24px; border-radius: 8px; margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="kicker">SVKM's NMIMS Global University, Dhule</div>
      <h1 class="brand-title">PLANET-X 2026</h1>
      <p class="brand-sub">${subtitle}</p>
    </div>
    <div class="body-content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>PLANET-X 2026 &bull; SVKM's NMIMS Global University, Dhule &bull; 21 November 2026 (Provisional)</p>
      <p>BEYOND INNOVATION. BEYOND LIMITS.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// 1. Participant Registration Submission Email
export async function sendSubmissionReceivedEmail(reg: Registration): Promise<void> {
  const settings = dbManager.get().settings;
  const rosterHtml = reg.teamMembers
    .map(m => `<li><strong>${m.name}</strong> (${m.email} &bull; ${m.phone})</li>`)
    .join('');

  const html = generateBrandEmailHtml(
    `Registration Received — ${reg.id}`,
    'Registration Submission Confirmed',
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Hello ${reg.teamLeaderName},</h2>
      <p>Your team registration for <strong>${reg.eventName}</strong> has been successfully received by the PLANET-X 2026 organizing committee.</p>
      
      <table class="data-table">
        <tr>
          <td class="label-col">Registration ID</td>
          <td class="val-col"><span style="color: #38bdf8; font-family: monospace;">${reg.id}</span></td>
        </tr>
        <tr>
          <td class="label-col">Competition</td>
          <td class="val-col">${reg.eventName}</td>
        </tr>
        <tr>
          <td class="label-col">Team Name</td>
          <td class="val-col">${reg.teamName}</td>
        </tr>
        <tr>
          <td class="label-col">Registration Fee</td>
          <td class="val-col">₹${reg.registrationFee}</td>
        </tr>
        <tr>
          <td class="label-col">Payment Status</td>
          <td class="val-col"><span class="badge ${reg.paymentStatus === 'verified' ? 'badge-success' : 'badge-warning'}">${reg.paymentStatus.toUpperCase().replace('_', ' ')}</span></td>
        </tr>
        <tr>
          <td class="label-col">Submission Timestamp</td>
          <td class="val-col">${new Date(reg.submittedAt).toLocaleString()}</td>
        </tr>
      </table>

      <h3 style="color: #e2e8f0; font-size: 14px; margin-bottom: 6px;">Team Roster:</h3>
      <ul class="roster-list">
        <li><strong>${reg.teamLeaderName}</strong> (Leader &bull; ${reg.teamLeaderEmail})</li>
        ${rosterHtml}
      </ul>

      <div style="background-color: #172554; border: 1px solid #1d4ed8; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #bfdbfe;">
          <strong>Important Payment Notice:</strong> Your payment status is currently <em>Pending Verification</em>. Our finance team will review the submitted transaction proof. You can monitor verification progress anytime from your Participant Dashboard.
        </p>
      </div>

      <p>Thank you for competing at PLANET-X 2026. Prepare for an unforgettable technological arena.</p>
    `
  );

  await sendEmail({
    to: reg.teamLeaderEmail,
    subject: `[PLANET-X 2026] Registration Received: ${reg.id} (${reg.eventName})`,
    type: 'submission_received',
    previewText: `Registration ${reg.id} for ${reg.eventName} received. Payment status: ${reg.paymentStatus}.`,
    htmlBody: html
  });
}

// 2. Organizer Alert Email
export async function sendOrganizerAlertEmail(reg: Registration): Promise<void> {
  const settings = dbManager.get().settings;
  const organizerEmail = settings.organizerNotificationEmail || 'organizers.planetx@nmims.edu';

  const html = generateBrandEmailHtml(
    `New Registration: ${reg.id}`,
    'Organizing Committee Operational Alert',
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">New Team Registration Logged</h2>
      <p>A new registration has been submitted for <strong>${reg.eventName}</strong> (${reg.zoneId.toUpperCase()}).</p>
      
      <table class="data-table">
        <tr>
          <td class="label-col">Registration ID</td>
          <td class="val-col"><span style="color: #38bdf8; font-family: monospace;">${reg.id}</span></td>
        </tr>
        <tr>
          <td class="label-col">Team Name</td>
          <td class="val-col">${reg.teamName}</td>
        </tr>
        <tr>
          <td class="label-col">Leader Name</td>
          <td class="val-col">${reg.teamLeaderName}</td>
        </tr>
        <tr>
          <td class="label-col">Leader Email</td>
          <td class="val-col">${reg.teamLeaderEmail}</td>
        </tr>
        <tr>
          <td class="label-col">Leader Phone</td>
          <td class="val-col">${reg.teamLeaderPhone}</td>
        </tr>
        <tr>
          <td class="label-col">College / Institute</td>
          <td class="val-col">${reg.college}</td>
        </tr>
        <tr>
          <td class="label-col">Total Squad Size</td>
          <td class="val-col">${reg.teamMembers.length + 1} Members</td>
        </tr>
        <tr>
          <td class="label-col">Fee Amount</td>
          <td class="val-col">₹${reg.registrationFee}</td>
        </tr>
        <tr>
          <td class="label-col">Payment Proof</td>
          <td class="val-col">${reg.paymentProofUrl ? 'Uploaded & Awaiting Review' : 'Pending Upload'}</td>
        </tr>
      </table>

      <p>Log in to the PLANET-X Admin Dashboard to review payment proofs and update confirmation records.</p>
    `
  );

  await sendEmail({
    to: organizerEmail,
    subject: `[ADMIN ALERT] New Registration: ${reg.eventName} - ${reg.teamName} (${reg.id})`,
    type: 'organizer_alert',
    previewText: `New registration for ${reg.eventName} by ${reg.teamName}. Total squad: ${reg.teamMembers.length + 1}.`,
    htmlBody: html
  });
}

// 3. Payment Status Update Email (Approved or Rejected)
export async function sendPaymentReviewEmail(reg: Registration, approved: boolean, reason?: string): Promise<void> {
  const html = generateBrandEmailHtml(
    `Payment Update: ${reg.id}`,
    approved ? 'Payment Proof Verified' : 'Payment Verification Issue',
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Hello ${reg.teamLeaderName},</h2>
      <p>This is an official update regarding your payment proof for <strong>${reg.eventName}</strong> (ID: <code>${reg.id}</code>).</p>
      
      ${approved ? `
        <div style="background-color: #064e3b; border: 1px solid #059669; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #a7f3d0; font-weight: 600;">
            &check; Payment Verification Successful!
          </p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;">
            Your transaction has been approved by the organizing committee. Your registration is now officially locked and verified.
          </p>
        </div>
      ` : `
        <div style="background-color: #450a0a; border: 1px solid #dc2626; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #fecaca; font-weight: 600;">
            &cross; Payment Proof Rejected
          </p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #fee2e2;">
            Reason: <strong>${reason || 'The transaction screenshot was illegible, incomplete, or the transaction reference did not match.'}</strong>
          </p>
        </div>
        <p>Please log in to your participant dashboard to re-upload a clear payment screenshot or correct the transaction reference.</p>
      `}

      <table class="data-table">
        <tr>
          <td class="label-col">Registration ID</td>
          <td class="val-col"><span style="color: #38bdf8; font-family: monospace;">${reg.id}</span></td>
        </tr>
        <tr>
          <td class="label-col">Competition</td>
          <td class="val-col">${reg.eventName}</td>
        </tr>
        <tr>
          <td class="label-col">Team Name</td>
          <td class="val-col">${reg.teamName}</td>
        </tr>
        <tr>
          <td class="label-col">Updated Status</td>
          <td class="val-col"><span class="badge ${approved ? 'badge-success' : 'badge-warning'}">${reg.paymentStatus.toUpperCase()}</span></td>
        </tr>
      </table>
    `
  );

  await sendEmail({
    to: reg.teamLeaderEmail,
    subject: `[PLANET-X 2026] Payment ${approved ? 'Approved' : 'Action Required'}: ${reg.id}`,
    type: approved ? 'payment_verified' : 'payment_rejected',
    previewText: `Payment review for registration ${reg.id} (${reg.eventName}): ${approved ? 'Approved' : 'Rejected'}.`,
    htmlBody: html
  });
}

// 4. Final Registration Confirmation Email (with Venue, Date, Team & WhatsApp Link if authorized)
export async function sendFinalConfirmationEmail(reg: Registration, event: any, whatsappLink?: string): Promise<void> {
  const settings = dbManager.get().settings;
  const showWhatsapp = whatsappLink && (event.whatsappVisibility === 'after_submission' || reg.registrationStatus === 'confirmed');

  const html = generateBrandEmailHtml(
    `Registration Confirmed — ${reg.id}`,
    'Official Delegation Pass & Event Briefing',
    `
      <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Congratulations ${reg.teamLeaderName}!</h2>
      <p>Your team <strong>${reg.teamName}</strong> has been officially confirmed for <strong>${reg.eventName}</strong> at PLANET-X 2026!</p>
      
      <div style="background-color: #064e3b; border: 1px solid #059669; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 15px; color: #a7f3d0; font-weight: 700;">
          &starf; STATUS: CONFIRMED DELEGATION
        </p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;">
          Keep this email and your Registration ID handy for desk check-in on event day.
        </p>
      </div>

      <table class="data-table">
        <tr>
          <td class="label-col">Registration ID</td>
          <td class="val-col"><span style="color: #38bdf8; font-family: monospace; font-size: 15px;">${reg.id}</span></td>
        </tr>
        <tr>
          <td class="label-col">Event Date</td>
          <td class="val-col">${settings.eventDate} ${settings.isProvisionalDate ? '(Provisional)' : ''}</td>
        </tr>
        <tr>
          <td class="label-col">Venue</td>
          <td class="val-col">${settings.venue}</td>
        </tr>
        <tr>
          <td class="label-col">Competition</td>
          <td class="val-col">${reg.eventName} (${reg.zoneId.toUpperCase()})</td>
        </tr>
        <tr>
          <td class="label-col">Team Name</td>
          <td class="val-col">${reg.teamName}</td>
        </tr>
        <tr>
          <td class="label-col">Total Squad</td>
          <td class="val-col">${reg.teamMembers.length + 1} Registered Members</td>
        </tr>
      </table>

      ${showWhatsapp ? `
        <div style="background: #064e3b; border: 1px solid #10b981; border-radius: 8px; padding: 18px; margin: 24px 0; text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 15px;">Official WhatsApp Participant Group</h4>
          <p style="margin: 0 0 14px 0; font-size: 13px; color: #a7f3d0;">Join the coordinators, mentors, and competition peers for live announcements:</p>
          <a href="${whatsappLink}" class="btn" style="background-color: #25d366; color: #ffffff !important;">Join ${reg.eventName} WhatsApp Group &rarr;</a>
        </div>
      ` : ''}

      <p>We look forward to seeing you at SVKM's NMIMS Global University, Dhule. Bring your absolute best!</p>
    `
  );

  await sendEmail({
    to: reg.teamLeaderEmail,
    subject: `[CONFIRMED] Delegation Pass: ${reg.id} - ${reg.eventName} at PLANET-X 2026`,
    type: 'registration_confirmed',
    previewText: `Registration ${reg.id} for ${reg.eventName} is confirmed! Check venue and team details.`,
    htmlBody: html
  });
}
