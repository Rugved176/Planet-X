import express, { Request, Response } from 'express';
import multer from 'multer';
import { 
  dbManager, 
  Registration, 
  UserProfile, 
  CompetitionEvent, 
  AuditLog, 
  ContactMessage 
} from './db.ts';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authMiddleware, 
  adminOnlyMiddleware, 
  AuthenticatedRequest 
} from './auth.ts';
import { 
  sendSubmissionReceivedEmail, 
  sendOrganizerAlertEmail, 
  sendPaymentReviewEmail, 
  sendFinalConfirmationEmail,
  sendEmail,
  generateBrandEmailHtml
} from './email.ts';

export const apiRouter = express.Router();

// Memory storage for file uploads (payment proofs, QR codes, avatars)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) and PDF receipts are allowed'));
    }
  }
});

// Helper: record audit log
function recordAudit(adminEmail: string, action: string, details: string) {
  const audit: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminEmail,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  dbManager.update(db => {
    db.auditLogs.unshift(audit);
  });
}

// -------------------------------------------------------------
// PUBLIC ROUTES
// -------------------------------------------------------------

// Global config, zones, events, team info, settings
apiRouter.get('/public/config', (_req: Request, res: Response) => {
  const db = dbManager.get();
  res.json({
    settings: db.settings,
    zones: db.zones,
    events: db.events.map(ev => ({
      ...ev,
      // Hide whatsapp link if restricted until after confirmation
      whatsappGroupLink: ev.whatsappVisibility === 'after_submission' ? ev.whatsappGroupLink : ''
    })),
    teamMembers: db.teamMembers.sort((a, b) => a.displayOrder - b.displayOrder)
  });
});

// Single event by slug or id
apiRouter.get('/events/:slug', (req: Request, res: Response) => {
  const db = dbManager.get();
  const event = db.events.find(e => e.slug === req.params.slug || e.id === req.params.slug);
  if (!event) {
    res.status(404).json({ error: 'Competition not found' });
    return;
  }
  res.json({ event });
});

// Contact form submission
apiRouter.post('/contact', async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required' });
    return;
  }

  const contactEntry: ContactMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    subject: String(subject || 'General Inquiry').trim(),
    message: String(message).trim(),
    receivedAt: new Date().toISOString(),
    status: 'unread'
  };

  dbManager.update(db => {
    db.contactMessages.unshift(contactEntry);
  });

  // Notify organizers
  const settings = dbManager.get().settings;
  const adminNotificationEmail = settings.organizerNotificationEmail || 'organizers.planetx@nmims.edu';

  await sendEmail({
    to: adminNotificationEmail,
    subject: `[CONTACT INQUIRY] ${contactEntry.subject} from ${contactEntry.name}`,
    type: 'contact_received',
    previewText: `Message from ${contactEntry.name} (${contactEntry.email}): ${contactEntry.message.substring(0, 80)}...`,
    htmlBody: generateBrandEmailHtml(
      'New Contact Inquiry Received',
      'Support & Communication Desk',
      `
        <p>A visitor submitted an inquiry through the PLANET-X contact portal:</p>
        <p><strong>From:</strong> ${contactEntry.name} (${contactEntry.email})</p>
        <p><strong>Subject:</strong> ${contactEntry.subject}</p>
        <div style="background: #070c1d; padding: 16px; border-radius: 8px; border: 1px solid #1e294f; margin: 16px 0;">
          <p style="white-space: pre-wrap; margin: 0; color: #cbd5e1;">${contactEntry.message}</p>
        </div>
      `
    )
  });

  res.json({ success: true, message: 'Message sent successfully. Our team will review and respond promptly.' });
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, college } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and full name are required' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const db = dbManager.get();
    if (db.users.some(u => u.email === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser: UserProfile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      passwordHash,
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      college: String(college || "SVKM's NMIMS").trim(),
      role: 'participant',
      emailVerified: true, // Auto-verified for seamless UX
      createdAt: new Date().toISOString()
    };

    dbManager.update(d => {
      d.users.push(newUser);
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        college: newUser.college,
        role: newUser.role,
        emailVerified: newUser.emailVerified
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = dbManager.get();
    const user = db.users.find(u => u.email === cleanEmail);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        college: user.college,
        role: user.role,
        emailVerified: user.emailVerified
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      college: user.college,
      role: user.role,
      emailVerified: user.emailVerified
    }
  });
});

apiRouter.put('/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, phone, college } = req.body;

  dbManager.update(db => {
    const u = db.users.find(x => x.id === user.id);
    if (u) {
      if (name) u.name = String(name).trim();
      if (phone !== undefined) u.phone = String(phone).trim();
      if (college !== undefined) u.college = String(college).trim();
    }
  });

  const updated = dbManager.get().users.find(x => x.id === user.id)!;
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      college: updated.college,
      role: updated.role,
      emailVerified: updated.emailVerified
    }
  });
});

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = dbManager.get();
  const user = db.users.find(u => u.email === cleanEmail);

  if (user) {
    // Generate secure temporary code
    const resetToken = `PX-RESET-${Math.floor(100000 + Math.random() * 900000)}`;
    await sendEmail({
      to: cleanEmail,
      subject: '[PLANET-X 2026] Password Recovery Security Code',
      type: 'password_reset',
      previewText: `Your password recovery security code is: ${resetToken}`,
      htmlBody: generateBrandEmailHtml(
        'Password Recovery Verification',
        'Security & Account Recovery',
        `
          <p>Hello ${user.name},</p>
          <p>We received a password reset request for your PLANET-X account.</p>
          <div style="background-color: #070c1d; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #1e294f; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.2em; color: #38bdf8; font-family: monospace;">${resetToken}</span>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">If you did not initiate this request, you can safely disregard this email.</p>
        `
      )
    });
  }

  // Always return success to prevent email enumeration
  res.json({ success: true, message: 'If an account matches that email address, password recovery instructions have been dispatched.' });
});

// -------------------------------------------------------------
// PARTICIPANT REGISTRATION ROUTES
// -------------------------------------------------------------

apiRouter.get('/registrations/my', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = dbManager.get();
  
  // Return registrations where user is leader or listed as a member
  const userRegs = db.registrations.filter(r => 
    r.userId === user.id || 
    r.teamLeaderEmail.toLowerCase() === user.email.toLowerCase() ||
    r.teamMembers.some(m => m.email.toLowerCase() === user.email.toLowerCase())
  );

  // Augment with event whatsapp link if visibility criteria met
  const enriched = userRegs.map(reg => {
    const event = db.events.find(e => e.id === reg.eventId);
    let whatsappLink = '';
    if (event && event.whatsappGroupLink) {
      if (event.whatsappVisibility === 'after_submission') {
        whatsappLink = event.whatsappGroupLink;
      } else if (event.whatsappVisibility === 'after_confirmation' && (reg.registrationStatus === 'confirmed' || reg.paymentStatus === 'verified')) {
        whatsappLink = event.whatsappGroupLink;
      }
    }
    return {
      ...reg,
      whatsappLink
    };
  });

  res.json({ registrations: enriched });
});

apiRouter.post('/registrations', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { 
      eventId, 
      teamName, 
      teamLeaderName, 
      teamLeaderPhone, 
      college, 
      teamMembers, 
      additionalInfo 
    } = req.body;

    if (!eventId || !teamName) {
      res.status(400).json({ error: 'Event selection and Team Name are required' });
      return;
    }

    const db = dbManager.get();
    const event = db.events.find(e => e.id === eventId || e.slug === eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (!event.isOpen) {
      res.status(400).json({ error: 'Registrations for this competition are currently closed' });
      return;
    }

    // Team size validation (Leader counts as 1)
    const membersList: any[] = Array.isArray(teamMembers) ? teamMembers : [];
    const totalTeamSize = membersList.length + 1;

    if (totalTeamSize < event.minTeamSize) {
      res.status(400).json({ error: `This event requires at least ${event.minTeamSize} team member(s) (including team leader).` });
      return;
    }

    if (totalTeamSize > event.maxTeamSize) {
      res.status(400).json({ error: `This event allows at most ${event.maxTeamSize} team members (including team leader).` });
      return;
    }

    // Check duplicate registrations for same user in same event
    const existing = db.registrations.find(r => 
      r.eventId === event.id && 
      (r.userId === user.id || r.teamLeaderEmail.toLowerCase() === user.email.toLowerCase()) &&
      r.registrationStatus !== 'cancelled'
    );

    if (existing) {
      res.status(409).json({ error: `You already have an active registration (${existing.id}) for ${event.name}.` });
      return;
    }

    // Generate unique Registration ID e.g. PX26-WEB-8491
    const prefix = event.id.substring(0, 3).toUpperCase();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const regId = `PX26-${prefix}-${randomCode}`;

    const newRegistration: Registration = {
      id: regId,
      userId: user.id,
      eventId: event.id,
      zoneId: event.zoneId,
      eventName: event.name,
      teamName: String(teamName).trim(),
      teamLeaderName: String(teamLeaderName || user.name).trim(),
      teamLeaderEmail: user.email,
      teamLeaderPhone: String(teamLeaderPhone || user.phone).trim(),
      college: String(college || user.college).trim(),
      teamMembers: membersList.map(m => ({
        name: String(m.name || '').trim(),
        email: String(m.email || '').trim().toLowerCase(),
        phone: String(m.phone || '').trim(),
        college: String(m.college || college || '').trim(),
        role: String(m.role || 'Member').trim()
      })),
      additionalInfo: additionalInfo || {},
      registrationFee: event.registrationFee,
      paymentStatus: event.registrationFee === 0 ? 'verified' : 'unpaid',
      registrationStatus: event.registrationFee === 0 ? 'confirmed' : 'submitted',
      submittedAt: new Date().toISOString()
    };

    dbManager.update(d => {
      d.registrations.unshift(newRegistration);
    });

    // Send asynchronous transactional emails
    sendSubmissionReceivedEmail(newRegistration).catch(err => console.error('Submission email failed:', err));
    sendOrganizerAlertEmail(newRegistration).catch(err => console.error('Organizer alert failed:', err));

    res.status(201).json({
      success: true,
      registration: newRegistration,
      message: `Registration ${regId} successfully submitted!`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit registration' });
  }
});

// Upload Payment Proof
apiRouter.post('/registrations/:id/payment-proof', authMiddleware, upload.single('paymentProof'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const regId = req.params.id;
    const { paymentReference } = req.body;

    const db = dbManager.get();
    const registration = db.registrations.find(r => r.id === regId);

    if (!registration) {
      res.status(404).json({ error: 'Registration record not found' });
      return;
    }

    // Only owner or admin can upload
    if (registration.userId !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized to modify this registration' });
      return;
    }

    let fileDataUrl = '';
    let fileName = '';

    if (req.file) {
      const mime = req.file.mimetype;
      const base64 = req.file.buffer.toString('base64');
      fileDataUrl = `data:${mime};base64,${base64}`;
      fileName = req.file.originalname;
    } else if (req.body.proofBase64) {
      fileDataUrl = req.body.proofBase64;
      fileName = req.body.fileName || 'payment_receipt.png';
    }

    if (!fileDataUrl && !paymentReference) {
      res.status(400).json({ error: 'Please upload a payment screenshot/receipt or provide a valid transaction reference.' });
      return;
    }

    dbManager.update(d => {
      const target = d.registrations.find(r => r.id === regId);
      if (target) {
        if (fileDataUrl) {
          target.paymentProofUrl = fileDataUrl;
          target.paymentProofFileName = fileName;
        }
        if (paymentReference) {
          target.paymentReference = String(paymentReference).trim();
        }
        target.paymentProofUploadedAt = new Date().toISOString();
        target.paymentStatus = 'pending_verification';
        target.registrationStatus = 'under_verification';
      }
    });

    const updated = dbManager.get().registrations.find(r => r.id === regId)!;
    res.json({
      success: true,
      registration: updated,
      message: 'Payment proof uploaded successfully! Your payment is now Under Verification by our finance committee.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment upload failed' });
  }
});

// -------------------------------------------------------------
// ADMINISTRATOR ROUTES
// -------------------------------------------------------------

// Admin Overview Analytics
apiRouter.get('/admin/overview', adminOnlyMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.get();
  
  const totalRegistrations = db.registrations.length;
  const totalParticipants = db.users.filter(u => u.role === 'participant').length;
  const pendingPayments = db.registrations.filter(r => r.paymentStatus === 'pending_verification').length;
  const confirmedRegistrations = db.registrations.filter(r => r.registrationStatus === 'confirmed').length;

  const totalRevenueCollected = db.registrations
    .filter(r => r.paymentStatus === 'verified')
    .reduce((sum, r) => sum + (r.registrationFee || 0), 0);

  // Group by zone
  const zoneStats = db.zones.map(z => {
    const regsInZone = db.registrations.filter(r => r.zoneId === z.id);
    return {
      zoneId: z.id,
      zoneName: z.name,
      total: regsInZone.length,
      confirmed: regsInZone.filter(r => r.registrationStatus === 'confirmed').length
    };
  });

  // Group by event
  const eventStats = db.events.map(e => {
    const regsInEvent = db.registrations.filter(r => r.eventId === e.id);
    return {
      eventId: e.id,
      eventName: e.name,
      zoneName: e.zoneName,
      total: regsInEvent.length,
      pendingVerification: regsInEvent.filter(r => r.paymentStatus === 'pending_verification').length,
      confirmed: regsInEvent.filter(r => r.registrationStatus === 'confirmed').length,
      maxTeamSize: e.maxTeamSize,
      registrationFee: e.registrationFee,
      isOpen: e.isOpen
    };
  });

  res.json({
    stats: {
      totalRegistrations,
      totalParticipants,
      pendingPayments,
      confirmedRegistrations,
      totalRevenueCollected
    },
    zoneStats,
    eventStats
  });
});

// Admin list registrations with filtering
apiRouter.get('/admin/registrations', adminOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.get();
  const { zone, event, paymentStatus, regStatus, search } = req.query;

  let list = [...db.registrations];

  if (zone && typeof zone === 'string' && zone !== 'all') {
    list = list.filter(r => r.zoneId === zone);
  }

  if (event && typeof event === 'string' && event !== 'all') {
    list = list.filter(r => r.eventId === event);
  }

  if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'all') {
    list = list.filter(r => r.paymentStatus === paymentStatus);
  }

  if (regStatus && typeof regStatus === 'string' && regStatus !== 'all') {
    list = list.filter(r => r.registrationStatus === regStatus);
  }

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    list = list.filter(r => 
      r.id.toLowerCase().includes(s) ||
      r.teamName.toLowerCase().includes(s) ||
      r.teamLeaderName.toLowerCase().includes(s) ||
      r.teamLeaderEmail.toLowerCase().includes(s) ||
      r.college.toLowerCase().includes(s) ||
      (r.paymentReference && r.paymentReference.toLowerCase().includes(s))
    );
  }

  res.json({ registrations: list });
});

// Admin Review Payment (Approve / Reject)
apiRouter.post('/admin/registrations/:id/payment-review', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const regId = req.params.id;
  const { approved, rejectionReason } = req.body;

  const db = dbManager.get();
  const target = db.registrations.find(r => r.id === regId);
  if (!target) {
    res.status(404).json({ error: 'Registration not found' });
    return;
  }

  const isApproved = Boolean(approved);

  dbManager.update(d => {
    const r = d.registrations.find(x => x.id === regId);
    if (r) {
      if (isApproved) {
        r.paymentStatus = 'verified';
        r.registrationStatus = 'confirmed';
        r.verifiedAt = new Date().toISOString();
        r.rejectionReason = undefined;
      } else {
        r.paymentStatus = 'rejected';
        r.registrationStatus = 'rejected';
        r.rejectionReason = String(rejectionReason || 'Invalid transaction receipt or unverified UTR').trim();
      }
    }
  });

  const updated = dbManager.get().registrations.find(x => x.id === regId)!;
  const event = db.events.find(e => e.id === updated.eventId);

  recordAudit(
    admin.email,
    isApproved ? 'APPROVE_PAYMENT' : 'REJECT_PAYMENT',
    `Registration ${regId} (${updated.teamName} - ${updated.eventName}): ${isApproved ? 'Approved payment' : `Rejected: ${rejectionReason}`}`
  );

  // Send transactional email updates
  await sendPaymentReviewEmail(updated, isApproved, rejectionReason);
  if (isApproved && event) {
    await sendFinalConfirmationEmail(updated, event, event.whatsappGroupLink);
  }

  res.json({
    success: true,
    registration: updated,
    message: isApproved ? 'Payment approved and registration confirmed!' : 'Payment rejected and notification sent.'
  });
});

// Admin change registration status directly
apiRouter.post('/admin/registrations/:id/status', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const regId = req.params.id;
  const { status, note } = req.body;

  const validStatuses = ['draft', 'submitted', 'under_verification', 'confirmed', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid registration status' });
    return;
  }

  const db = dbManager.get();
  const target = db.registrations.find(r => r.id === regId);
  if (!target) {
    res.status(404).json({ error: 'Registration not found' });
    return;
  }

  dbManager.update(d => {
    const r = d.registrations.find(x => x.id === regId);
    if (r) {
      r.registrationStatus = status;
      if (status === 'confirmed') {
        r.paymentStatus = 'verified';
        r.verifiedAt = new Date().toISOString();
      }
      if (note) {
        r.rejectionReason = note;
      }
    }
  });

  const updated = dbManager.get().registrations.find(x => x.id === regId)!;
  const event = db.events.find(e => e.id === updated.eventId);

  recordAudit(admin.email, 'UPDATE_STATUS', `Set status of ${regId} to ${status}`);

  if (status === 'confirmed' && event) {
    await sendFinalConfirmationEmail(updated, event, event.whatsappGroupLink);
  }

  res.json({ success: true, registration: updated });
});

// Admin update competition settings (rules, team limits, deadlines, fees, WhatsApp link)
apiRouter.put('/admin/events/:id', adminOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const eventId = req.params.id;
  const updates = req.body;

  const db = dbManager.get();
  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  dbManager.update(d => {
    const ev = d.events.find(e => e.id === eventId);
    if (ev) {
      if (updates.name !== undefined) ev.name = updates.name;
      if (updates.shortDescription !== undefined) ev.shortDescription = updates.shortDescription;
      if (updates.fullDescription !== undefined) ev.fullDescription = updates.fullDescription;
      if (updates.registrationFee !== undefined) ev.registrationFee = Number(updates.registrationFee);
      if (updates.minTeamSize !== undefined) ev.minTeamSize = Number(updates.minTeamSize);
      if (updates.maxTeamSize !== undefined) ev.maxTeamSize = Number(updates.maxTeamSize);
      if (updates.registrationDeadline !== undefined) ev.registrationDeadline = updates.registrationDeadline;
      if (updates.isOpen !== undefined) ev.isOpen = Boolean(updates.isOpen);
      if (updates.whatsappGroupLink !== undefined) ev.whatsappGroupLink = updates.whatsappGroupLink;
      if (updates.whatsappVisibility !== undefined) ev.whatsappVisibility = updates.whatsappVisibility;
      if (Array.isArray(updates.rules)) ev.rules = updates.rules;
      if (Array.isArray(updates.judgingCriteria)) ev.judgingCriteria = updates.judgingCriteria;
      if (Array.isArray(updates.objectives)) ev.objectives = updates.objectives;
    }
  });

  recordAudit(admin.email, 'UPDATE_EVENT', `Updated configuration for event: ${event.name}`);
  res.json({ success: true, event: dbManager.get().events.find(e => e.id === eventId) });
});

// Admin update global settings (dates, venue, UPI details, QR code, notification email)
apiRouter.put('/admin/settings', adminOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const updates = req.body;

  dbManager.update(d => {
    d.settings = {
      ...d.settings,
      ...updates
    };
  });

  recordAudit(admin.email, 'UPDATE_GLOBAL_SETTINGS', 'Updated event date, venue, or payment configuration');
  res.json({ success: true, settings: dbManager.get().settings });
});

// Admin upload payment QR Code
apiRouter.post('/admin/upload-qr', adminOnlyMiddleware, upload.single('qrCode'), (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  let qrDataUrl = '';

  if (req.file) {
    const mime = req.file.mimetype;
    const base64 = req.file.buffer.toString('base64');
    qrDataUrl = `data:${mime};base64,${base64}`;
  } else if (req.body.qrBase64) {
    qrDataUrl = req.body.qrBase64;
  }

  if (!qrDataUrl) {
    res.status(400).json({ error: 'No QR code image uploaded' });
    return;
  }

  dbManager.update(d => {
    d.settings.paymentQrCodeUrl = qrDataUrl;
  });

  recordAudit(admin.email, 'UPDATE_PAYMENT_QR', 'Uploaded new official payment QR code');
  res.json({ success: true, paymentQrCodeUrl: qrDataUrl });
});

// Admin update organizing team member
apiRouter.put('/admin/team/:id', adminOnlyMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const memberId = req.params.id;
  const updates = req.body;

  dbManager.update(d => {
    const m = d.teamMembers.find(t => t.id === memberId);
    if (m) {
      if (updates.name !== undefined) m.name = updates.name;
      if (updates.role !== undefined) m.role = updates.role;
      if (updates.bio !== undefined) m.bio = updates.bio;
      if (updates.photoUrl !== undefined) m.photoUrl = updates.photoUrl;
      if (updates.socialLink !== undefined) m.socialLink = updates.socialLink;
    }
  });

  recordAudit(admin.email, 'UPDATE_TEAM_MEMBER', `Updated profile for member: ${memberId}`);
  res.json({ success: true, teamMembers: dbManager.get().teamMembers });
});

// Admin view email outbox
apiRouter.get('/admin/emails', adminOnlyMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.get();
  res.json({ emails: db.emailLogs });
});

// Admin view audit logs
apiRouter.get('/admin/audit-logs', adminOnlyMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.get();
  res.json({ auditLogs: db.auditLogs });
});

// Admin export registrations to CSV
apiRouter.get('/admin/export-csv', adminOnlyMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const db = dbManager.get();
  const rows = [
    [
      'Registration ID',
      'Event Name',
      'Zone',
      'Team Name',
      'Leader Name',
      'Leader Email',
      'Leader Phone',
      'College',
      'Members Count',
      'Member Names & Emails',
      'Fee',
      'Payment Status',
      'Registration Status',
      'Payment Ref / UTR',
      'Submission Timestamp'
    ]
  ];

  db.registrations.forEach(r => {
    const memberStr = r.teamMembers.map(m => `${m.name} (${m.email || 'no email'})`).join('; ');
    rows.push([
      r.id,
      r.eventName,
      r.zoneId,
      r.teamName,
      r.teamLeaderName,
      r.teamLeaderEmail,
      r.teamLeaderPhone,
      r.college,
      String(r.teamMembers.length + 1),
      memberStr,
      String(r.registrationFee),
      r.paymentStatus,
      r.registrationStatus,
      r.paymentReference || 'N/A',
      r.submittedAt
    ]);
  });

  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=PLANET-X-2026-Registrations-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});
