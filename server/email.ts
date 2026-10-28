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
  const fromEmail = process.env.EMAIL_FROM || 'PLANET-X 2026 <planetx.event@gmail.com>';
  
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
          reply_to: 'planetx.event@gmail.com',
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
  const utrRef = reg.paymentReference || 'Payment Slip Uploaded (Pending Review)';

  // Build clean HTML table rows for all squad members
  let memberRowsHtml = `
    <tr style="background: rgba(14, 165, 233, 0.08);">
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; font-weight: bold; color: #38bdf8;">1</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; font-weight: bold; color: #ffffff;">${reg.teamLeaderName} <span style="font-size: 11px; color: #38bdf8; background: rgba(56, 189, 248, 0.15); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">Leader</span></td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; color: #94a3b8;">${reg.teamLeaderEmail}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; color: #cbd5e1;">${reg.teamLeaderPhone}</td>
    </tr>
  `;

  if (reg.teamMembers && reg.teamMembers.length > 0) {
    memberRowsHtml += reg.teamMembers.map((m, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#070c1d' : '#0b1126'};">
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; color: #94a3b8;">${idx + 2}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; font-weight: 600; color: #ffffff;">${m.name}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; color: #94a3b8;">${m.email || 'N/A'}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1e294f; color: #cbd5e1;">${m.phone || 'N/A'}</td>
      </tr>
    `).join('');
  }

  const html = generateBrandEmailHtml(
    `Registration Confirmed — ${reg.id}`,
    'Official Event Registration & Payment Receipt',
    `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid #059669; color: #34d399; font-weight: 700; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          ✓ REGISTRATION & PAYMENT RECEIVED
        </div>
        <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px; font-weight: 800;">Hello ${reg.teamLeaderName},</h2>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.5;">
          You and your squad have successfully registered for <strong>${reg.eventName}</strong> at <strong>PLANET-X 2026</strong>!
        </p>
      </div>

      <!-- Registration ID Highlight Box -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 1px solid #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #a5b4fc; font-weight: 700; display: block; margin-bottom: 6px;">Your Official Registration ID</span>
        <span style="font-size: 28px; font-weight: 900; font-family: monospace; color: #38bdf8; letter-spacing: 0.08em; display: block;">
          ${reg.id}
        </span>
        <span style="font-size: 12px; color: #94a3b8; display: block; margin-top: 6px;">Save this Registration ID for helpdesk queries and on-campus check-in.</span>
      </div>

      <!-- Event & Team Overview -->
      <h3 style="color: #ffffff; font-size: 15px; margin: 24px 0 10px 0; border-left: 3px solid #38bdf8; padding-left: 10px;">Event & Team Overview</h3>
      <table class="data-table">
        <tr>
          <td class="label-col">Competition Track</td>
          <td class="val-col"><strong style="color: #38bdf8;">${reg.eventName}</strong> <span style="font-size: 11px; color: #a5b4fc;">(${reg.zoneId.toUpperCase()})</span></td>
        </tr>
        <tr>
          <td class="label-col">Team / Delegation Name</td>
          <td class="val-col">${reg.teamName}</td>
        </tr>
        <tr>
          <td class="label-col">College / University</td>
          <td class="val-col">${reg.college || "SVKM's NMIMS Global University"}</td>
        </tr>
        <tr>
          <td class="label-col">Registration Fee</td>
          <td class="val-col">₹${reg.registrationFee}</td>
        </tr>
        <tr>
          <td class="label-col">Payment UTR / Ref ID</td>
          <td class="val-col"><span style="font-family: monospace; color: #34d399;">${utrRef}</span></td>
        </tr>
        <tr>
          <td class="label-col">Payment Verification</td>
          <td class="val-col"><span class="badge ${reg.paymentStatus === 'verified' ? 'badge-success' : 'badge-warning'}">${reg.paymentStatus.toUpperCase().replace('_', ' ')}</span></td>
        </tr>
        <tr>
          <td class="label-col">Submission Timestamp</td>
          <td class="val-col">${new Date(reg.submittedAt).toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <!-- Complete Team Squad Details -->
      <h3 style="color: #ffffff; font-size: 15px; margin: 26px 0 10px 0; border-left: 3px solid #6366f1; padding-left: 10px;">Registered Team Members (${reg.teamMembers.length + 1} Total)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #1e294f;">
        <thead>
          <tr style="background: #1e294f; color: #e2e8f0; text-align: left;">
            <th style="padding: 10px 14px;">#</th>
            <th style="padding: 10px 14px;">Full Name</th>
            <th style="padding: 10px 14px;">Email Address</th>
            <th style="padding: 10px 14px;">Phone / WhatsApp</th>
          </tr>
        </thead>
        <tbody>
          ${memberRowsHtml}
        </tbody>
      </table>

      <!-- Payment Notice -->
      <div style="background-color: #0c1a3b; border: 1px solid #2563eb; padding: 16px 20px; border-radius: 8px; margin: 22px 0;">
        <p style="margin: 0; font-size: 13px; color: #93c5fd; line-height: 1.5;">
          <strong>Payment Verification Status:</strong> Your payment slip and transaction reference have been securely recorded. Our finance desk verifies all slips against the official account. Once verified, your status will be updated to <em>Confirmed</em>.
        </p>
      </div>

      <!-- Official Helpdesk & Hotlines -->
      <div style="background-color: #0b1126; border: 1px solid #1e294f; border-radius: 8px; padding: 18px 20px; margin-top: 24px;">
        <h4 style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px;">Need Any Assistance? Contact PLANET-X Helpdesk:</h4>
        <div style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
          <div>&bull; <strong>Rugved Solanki</strong>: <a href="tel:+919975952579" style="color: #38bdf8; text-decoration: none;">+91 9975952579</a></div>
          <div>&bull; <strong>Ved Shinde</strong>: <a href="tel:+918262058180" style="color: #38bdf8; text-decoration: none;">+91 8262058180</a></div>
          <div>&bull; <strong>Dakshal Ahire</strong>: <a href="tel:+918412820178" style="color: #38bdf8; text-decoration: none;">+91 8412820178</a></div>
          <div>&bull; <strong>Yash Khairnar</strong>: <a href="tel:+918080156469" style="color: #38bdf8; text-decoration: none;">+91 8080156469</a></div>
          <div style="margin-top: 6px;">&bull; <strong>Official Mail</strong>: <a href="mailto:planetx.event@gmail.com" style="color: #38bdf8; text-decoration: none; font-weight: bold;">planetx.event@gmail.com</a></div>
        </div>
      </div>
    `
  );

  // Send to Leader
  await sendEmail({
    to: reg.teamLeaderEmail,
    subject: `🎉 Registration Confirmed! Your ID: ${reg.id} - ${reg.eventName} | PLANET-X 2026`,
    type: 'submission_received',
    previewText: `Successfully registered for ${reg.eventName}! Registration ID: ${reg.id}. Team: ${reg.teamName}.`,
    htmlBody: html
  });

  // Also dispatch a copy to squad members if they provided an email address
  if (reg.teamMembers && reg.teamMembers.length > 0) {
    for (const member of reg.teamMembers) {
      if (member.email && member.email.includes('@') && member.email.toLowerCase() !== reg.teamLeaderEmail.toLowerCase()) {
        sendEmail({
          to: member.email,
          subject: `🎉 Team Registration Confirmed! ID: ${reg.id} - ${reg.eventName} | PLANET-X 2026`,
          type: 'submission_received',
          previewText: `You have been added to team ${reg.teamName} for ${reg.eventName} at PLANET-X 2026. ID: ${reg.id}.`,
          htmlBody: html
        }).catch(err => console.warn(`Failed to dispatch member email to ${member.email}:`, err));
      }
    }
  }
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

  if (reg.teamMembers && reg.teamMembers.length > 0) {
    for (const member of reg.teamMembers) {
      if (member.email && member.email.includes('@') && member.email.toLowerCase() !== reg.teamLeaderEmail.toLowerCase()) {
        sendEmail({
          to: member.email,
          subject: `[CONFIRMED] Team Delegation Pass: ${reg.id} - ${reg.eventName} at PLANET-X 2026`,
          type: 'registration_confirmed',
          previewText: `Your team ${reg.teamName} is confirmed for ${reg.eventName} at PLANET-X 2026. ID: ${reg.id}.`,
          htmlBody: html
        }).catch(err => console.warn(`Failed to dispatch confirmation email to ${member.email}:`, err));
      }
    }
  }
}
