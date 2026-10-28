import express, { Request, Response } from 'express';
import multer from 'multer';
import { doc, deleteDoc } from 'firebase/firestore';
import { 
  dbManager,
  firestoreDb, 
  Registration, 
  UserProfile, 
  CompetitionEvent, 
  OrganizingTeamMember,
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
apiRouter.get('/public/config', async (_req: Request, res: Response) => {
  await dbManager.syncFromFirestore();
  const db = dbManager.get();
  res.json({
    settings: db.settings,
    zones: db.zones,
    events: db.events.map(ev => ({
      ...ev,
      // Hide whatsapp link if restricted until after confirmation
      whatsappGroupLink: ev.whatsappVisibility === 'after_submission' ? ev.whatsappGroupLink : ''
    })),
    teamMembers: [...db.teamMembers].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  });
});

// Single event by slug or id
apiRouter.get('/events/:slug', async (req: Request, res: Response) => {
  await dbManager.syncFromFirestore();
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

apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { uid, email, name, photoUrl } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required for Google authentication' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || email.split('@')[0] || 'Participant').trim();
    const db = dbManager.get();

    // Check if this account is an administrator
    const isAdminAccount = cleanEmail === 'planetx.event@gmail.com' ||
      db.users.some(u => u.email.toLowerCase() === cleanEmail && u.role === 'admin');

    // BLOCK Google authentication for Admin accounts per security requirement:
    if (isAdminAccount) {
      res.status(403).json({
        error: 'Google authentication is blocked for Administrator login. Administrators must log in using official email (planetx.event@gmail.com) and fixed password (SVKM).'
      });
      return;
    }

    let user = db.users.find(u => u.email === cleanEmail);

    if (!user) {
      // Create new Google-authenticated user (strictly participant)
      const newUser: UserProfile = {
        id: uid ? `usr-g-${uid}` : `usr-g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        passwordHash: '',
        name: cleanName,
        phone: '',
        college: "SVKM's NMIMS Global University, Dhule",
        role: 'participant',
        emailVerified: true,
        createdAt: new Date().toISOString()
      };

      dbManager.update(d => {
        d.users.push(newUser);
      });
      user = newUser;
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
        emailVerified: true
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google authentication failed' });
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

apiRouter.put('/auth/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, phone, college } = req.body;

  await dbManager.updateAsync(db => {
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
      additionalInfo,
      paymentProofBase64,
      paymentProofFileName,
      paymentReference
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

    // Require payment proof and reference when fee is applicable
    if (event.registrationFee > 0 && (!paymentProofBase64 || !paymentReference)) {
      res.status(400).json({ error: 'Submitting payment slip and UTR transaction reference is mandatory to complete registration.' });
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

    const hasProof = Boolean(paymentProofBase64 && paymentReference);

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
      paymentStatus: hasProof ? 'pending_verification' : (event.registrationFee === 0 ? 'verified' : 'unpaid'),
      registrationStatus: event.registrationFee === 0 ? 'confirmed' : 'submitted',
      paymentReference: paymentReference ? String(paymentReference).trim() : undefined,
      paymentProofUrl: paymentProofBase64 || undefined,
      paymentProofFileName: paymentProofFileName || (paymentProofBase64 ? 'payment_slip.png' : undefined),
      paymentProofUploadedAt: hasProof ? new Date().toISOString() : undefined,
      submittedAt: new Date().toISOString()
    };

    await dbManager.updateAsync(d => {
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

    await dbManager.updateAsync(d => {
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
apiRouter.get('/admin/overview', adminOnlyMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await dbManager.syncFromFirestore();
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
apiRouter.get('/admin/registrations', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  await dbManager.syncFromFirestore();
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

  await dbManager.updateAsync(d => {
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

  await dbManager.updateAsync(d => {
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

// Admin full edit registration ticket pass
apiRouter.put('/admin/registrations/:id', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const regId = req.params.id;
  const updates = req.body;

  const db = dbManager.get();
  const target = db.registrations.find(r => r.id === regId);
  if (!target) {
    res.status(404).json({ error: 'Registration record not found' });
    return;
  }

  await dbManager.updateAsync(d => {
    const r = d.registrations.find(x => x.id === regId);
    if (r) {
      if (updates.teamName !== undefined) r.teamName = String(updates.teamName).trim();
      if (updates.teamLeaderName !== undefined) r.teamLeaderName = String(updates.teamLeaderName).trim();
      if (updates.teamLeaderEmail !== undefined) r.teamLeaderEmail = String(updates.teamLeaderEmail).trim().toLowerCase();
      if (updates.teamLeaderPhone !== undefined) r.teamLeaderPhone = String(updates.teamLeaderPhone).trim();
      if (updates.college !== undefined) r.college = String(updates.college).trim();
      if (updates.registrationFee !== undefined) r.registrationFee = Math.max(0, Number(updates.registrationFee) || 0);
      if (updates.paymentStatus !== undefined) r.paymentStatus = updates.paymentStatus;
      if (updates.registrationStatus !== undefined) r.registrationStatus = updates.registrationStatus;
      if (updates.paymentReference !== undefined) r.paymentReference = String(updates.paymentReference).trim();
      if (updates.rejectionReason !== undefined) r.rejectionReason = String(updates.rejectionReason).trim();
      
      if (Array.isArray(updates.teamMembers)) {
        r.teamMembers = updates.teamMembers.map((m: any) => ({
          name: String(m.name || '').trim(),
          email: String(m.email || '').trim().toLowerCase(),
          phone: String(m.phone || '').trim(),
          college: String(m.college || r.college || '').trim(),
          role: String(m.role || 'Member').trim()
        })).filter((m: any) => Boolean(m.name));
      }
    }
  });

  const updated = dbManager.get().registrations.find(x => x.id === regId)!;
  const event = db.events.find(e => e.id === updated.eventId);

  recordAudit(admin.email, 'UPDATE_TICKET_PASS', `Updated ticket pass details for registration ${regId} (${updated.teamName})`);

  if (updates.resendTicketEmail) {
    if (updated.registrationStatus === 'confirmed' && event) {
      await sendFinalConfirmationEmail(updated, event, event.whatsappGroupLink);
    } else {
      await sendSubmissionReceivedEmail(updated);
    }
  }

  res.json({
    success: true,
    registration: updated,
    message: `Ticket pass details for ${updated.id} successfully updated and saved!`
  });
});

// Admin trigger resend ticket pass email
apiRouter.post('/admin/registrations/:id/resend-ticket', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const regId = req.params.id;

  const db = dbManager.get();
  const reg = db.registrations.find(r => r.id === regId);
  if (!reg) {
    res.status(404).json({ error: 'Registration record not found' });
    return;
  }

  const event = db.events.find(e => e.id === reg.eventId);

  if (reg.registrationStatus === 'confirmed' && event) {
    await sendFinalConfirmationEmail(reg, event, event.whatsappGroupLink);
  } else {
    await sendSubmissionReceivedEmail(reg);
  }

  recordAudit(admin.email, 'RESEND_TICKET_EMAIL', `Resent ticket pass email to leader (${reg.teamLeaderEmail}) and squad for ${regId}`);

  res.json({
    success: true,
    message: `Official ticket pass email sent to ${reg.teamLeaderEmail} and squad members!`
  });
});

// Participant trigger resend ticket pass email
apiRouter.post('/registrations/:id/resend-ticket', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const regId = req.params.id;

  const db = dbManager.get();
  const reg = db.registrations.find(r => r.id === regId);
  if (!reg) {
    res.status(404).json({ error: 'Registration record not found' });
    return;
  }

  if (reg.userId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized to resend this ticket' });
    return;
  }

  const event = db.events.find(e => e.id === reg.eventId);

  if (reg.registrationStatus === 'confirmed' && event) {
    await sendFinalConfirmationEmail(reg, event, event.whatsappGroupLink);
  } else {
    await sendSubmissionReceivedEmail(reg);
  }

  res.json({
    success: true,
    message: `Official delegation ticket pass email successfully dispatched to ${reg.teamLeaderEmail} and squad members!`
  });
});

// Admin update competition settings (all details: name, description, rules, eligibility, judging, zone, limits, deadlines, fees, WhatsApp link)
apiRouter.put('/admin/events/:id', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const eventId = req.params.id;
  const updates = req.body;

  const db = dbManager.get();
  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  await dbManager.updateAsync(d => {
    const ev = d.events.find(e => e.id === eventId);
    if (ev) {
      if (updates.name !== undefined) ev.name = updates.name.trim();
      if (updates.slug !== undefined) ev.slug = updates.slug.trim().toLowerCase();
      if (updates.shortDescription !== undefined) ev.shortDescription = updates.shortDescription;
      if (updates.fullDescription !== undefined) ev.fullDescription = updates.fullDescription;
      if (updates.eligibility !== undefined) ev.eligibility = updates.eligibility;
      if (updates.registrationFee !== undefined) ev.registrationFee = Number(updates.registrationFee);
      if (updates.minTeamSize !== undefined) ev.minTeamSize = Math.max(1, Number(updates.minTeamSize));
      if (updates.maxTeamSize !== undefined) ev.maxTeamSize = Math.max(ev.minTeamSize, Number(updates.maxTeamSize));
      if (updates.registrationDeadline !== undefined) ev.registrationDeadline = updates.registrationDeadline;
      if (updates.isOpen !== undefined) ev.isOpen = Boolean(updates.isOpen);
      if (updates.whatsappGroupLink !== undefined) ev.whatsappGroupLink = updates.whatsappGroupLink;
      if (updates.whatsappVisibility !== undefined) ev.whatsappVisibility = updates.whatsappVisibility;
      
      // Update arrays
      if (Array.isArray(updates.rules)) ev.rules = updates.rules.filter((r: any) => Boolean(r && typeof r === 'string' && r.trim()));
      if (Array.isArray(updates.judgingCriteria)) ev.judgingCriteria = updates.judgingCriteria.filter((j: any) => Boolean(j && typeof j === 'string' && j.trim()));
      if (Array.isArray(updates.objectives)) ev.objectives = updates.objectives.filter((o: any) => Boolean(o && typeof o === 'string' && o.trim()));
      if (Array.isArray(updates.allowedTech)) ev.allowedTech = updates.allowedTech.filter((t: any) => Boolean(t && typeof t === 'string' && t.trim()));
      if (Array.isArray(updates.customFields)) ev.customFields = updates.customFields;

      // Handle zone reassignment
      if (updates.zoneId && updates.zoneId !== ev.zoneId) {
        // Remove from old zone
        const oldZone = d.zones.find(z => z.id === ev.zoneId);
        if (oldZone) {
          oldZone.eventIds = oldZone.eventIds.filter(id => id !== ev.id);
        }
        // Add to new zone
        const newZone = d.zones.find(z => z.id === updates.zoneId);
        if (newZone) {
          ev.zoneId = newZone.id;
          ev.zoneName = newZone.name;
          if (!newZone.eventIds.includes(ev.id)) {
            newZone.eventIds.push(ev.id);
          }
        }
      }
    }
  });

  recordAudit(admin.email, 'UPDATE_EVENT', `Updated all parameters for event: ${event.name} (Fee: ₹${updates.registrationFee ?? event.registrationFee})`);
  res.json({ success: true, event: dbManager.get().events.find(e => e.id === eventId) });
});

// Admin create new competition event
apiRouter.post('/admin/events', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const {
    name,
    zoneId,
    shortDescription,
    fullDescription,
    registrationFee,
    minTeamSize,
    maxTeamSize,
    registrationDeadline,
    eligibility,
    rules,
    judgingCriteria,
    objectives,
    allowedTech,
    whatsappGroupLink,
    whatsappVisibility
  } = req.body;

  if (!name || !zoneId) {
    res.status(400).json({ error: 'Competition name and Zone track are required.' });
    return;
  }

  const db = dbManager.get();
  const targetZone = db.zones.find(z => z.id === zoneId);
  if (!targetZone) {
    res.status(400).json({ error: 'Invalid zone track specified.' });
    return;
  }

  const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newEventId = `ev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const newEvent: CompetitionEvent = {
    id: newEventId,
    slug: generatedSlug || newEventId,
    zoneId: targetZone.id,
    zoneName: targetZone.name,
    name: name.trim(),
    shortDescription: shortDescription || 'Competitive showcase at PLANET-X 2026.',
    fullDescription: fullDescription || 'Participants compete across technical challenges and real-world problem statements.',
    objectives: Array.isArray(objectives) ? objectives.filter(Boolean) : ['Demonstrate technical excellence and teamwork'],
    eligibility: eligibility || 'Open to all undergraduate and postgraduate students with valid institution ID.',
    rules: Array.isArray(rules) ? rules.filter(Boolean) : ['Original work required.', 'Judges decision will be final.'],
    judgingCriteria: Array.isArray(judgingCriteria) ? judgingCriteria.filter(Boolean) : ['Technical Execution (40%)', 'Innovation (30%)', 'Presentation (30%)'],
    allowedTech: Array.isArray(allowedTech) ? allowedTech.filter(Boolean) : [],
    minTeamSize: Math.max(1, Number(minTeamSize) || 1),
    maxTeamSize: Math.max(Number(minTeamSize) || 1, Number(maxTeamSize) || 2),
    registrationFee: Number(registrationFee) >= 0 ? Number(registrationFee) : 100,
    registrationDeadline: registrationDeadline || '2026-11-18T23:59:59',
    isOpen: true,
    whatsappGroupLink: whatsappGroupLink || '',
    whatsappVisibility: whatsappVisibility || 'after_submission'
  };

  await dbManager.updateAsync(d => {
    d.events.push(newEvent);
    const z = d.zones.find(zn => zn.id === targetZone.id);
    if (z && !z.eventIds.includes(newEventId)) {
      z.eventIds.push(newEventId);
    }
  });

  recordAudit(admin.email, 'CREATE_EVENT', `Created new competition: ${newEvent.name} in ${targetZone.name} (Fee: ₹${newEvent.registrationFee})`);
  res.status(201).json({ success: true, event: newEvent });
});

// Admin delete competition event
apiRouter.delete('/admin/events/:id', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const eventId = req.params.id;

  const db = dbManager.get();
  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  await dbManager.updateAsync(d => {
    d.events = d.events.filter(e => e.id !== eventId);
    d.zones.forEach(z => {
      z.eventIds = z.eventIds.filter(id => id !== eventId);
    });
  });

  recordAudit(admin.email, 'DELETE_EVENT', `Deleted competition: ${event.name} (${eventId})`);
  res.json({ success: true, message: `Event ${event.name} successfully deleted.` });
});

// Admin batch update fees for all competitions
apiRouter.post('/admin/events/batch-fees', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { feesMap } = req.body; // e.g. { "webathon": 200, "ai-quiz": 100 }

  if (!feesMap || typeof feesMap !== 'object') {
    res.status(400).json({ error: 'Invalid feesMap provided.' });
    return;
  }

  await dbManager.updateAsync(d => {
    Object.entries(feesMap).forEach(([eventId, newFee]) => {
      const ev = d.events.find(e => e.id === eventId);
      if (ev && typeof newFee === 'number' && !isNaN(newFee)) {
        ev.registrationFee = Math.max(0, newFee);
      }
    });
  });

  recordAudit(admin.email, 'BATCH_UPDATE_FEES', `Batch updated registration fees for ${Object.keys(feesMap).length} competitions`);
  res.json({ success: true, events: dbManager.get().events });
});

// Admin update global settings (dates, venue, UPI details, QR code, notification email)
apiRouter.put('/admin/settings', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const updates = req.body;

  await dbManager.updateAsync(d => {
    d.settings = {
      ...d.settings,
      ...updates
    };
  });

  recordAudit(admin.email, 'UPDATE_GLOBAL_SETTINGS', 'Updated event date, venue, or payment configuration');
  res.json({ success: true, settings: dbManager.get().settings });
});

// Admin upload payment QR Code
apiRouter.post('/admin/upload-qr', adminOnlyMiddleware, upload.single('qrCode'), async (req: AuthenticatedRequest, res: Response) => {
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

  await dbManager.updateAsync(d => {
    d.settings.paymentQrCodeUrl = qrDataUrl;
  });

  recordAudit(admin.email, 'UPDATE_PAYMENT_QR', 'Uploaded new official payment QR code');
  res.json({ success: true, paymentQrCodeUrl: qrDataUrl });
});

// Admin update organizing team member
apiRouter.put('/admin/team/:id', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const memberId = req.params.id;
  const updates = req.body;

  await dbManager.updateAsync(d => {
    const m = d.teamMembers.find(t => t.id === memberId);
    if (m) {
      if (updates.name !== undefined) m.name = String(updates.name).trim();
      if (updates.role !== undefined) m.role = String(updates.role).trim();
      if (updates.email !== undefined) m.email = String(updates.email).trim();
      if (updates.phone !== undefined) m.phone = String(updates.phone).trim();
      if (updates.bio !== undefined) m.bio = String(updates.bio).trim();
      if (updates.photoUrl !== undefined) m.photoUrl = String(updates.photoUrl).trim();
      if (updates.socialLink !== undefined) m.socialLink = String(updates.socialLink).trim();
      if (updates.displayOrder !== undefined) m.displayOrder = Number(updates.displayOrder) || m.displayOrder;
    }
  });

  recordAudit(admin.email, 'UPDATE_TEAM_MEMBER', `Updated organizer profile for member: ${memberId}`);
  res.json({ success: true, teamMembers: dbManager.get().teamMembers });
});

// Admin add new team member
apiRouter.post('/admin/team', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const body = req.body;

  if (!body.name || !body.name.trim()) {
    res.status(400).json({ error: 'Organizer Name is required' });
    return;
  }

  const newMember: OrganizingTeamMember = {
    id: `team-${Date.now()}`,
    name: String(body.name).trim(),
    role: body.role ? String(body.role).trim() : 'Event Organizer',
    email: body.email ? String(body.email).trim() : '',
    phone: body.phone ? String(body.phone).trim() : '',
    bio: body.bio ? String(body.bio).trim() : '',
    photoUrl: body.photoUrl ? String(body.photoUrl).trim() : '',
    socialLink: body.socialLink ? String(body.socialLink).trim() : 'https://linkedin.com',
    displayOrder: body.displayOrder ? Number(body.displayOrder) : dbManager.get().teamMembers.length + 1
  };

  await dbManager.updateAsync(d => {
    d.teamMembers.push(newMember);
  });

  recordAudit(admin.email, 'CREATE_TEAM_MEMBER', `Created organizer profile for: ${newMember.name}`);
  res.json({ success: true, member: newMember, teamMembers: dbManager.get().teamMembers });
});

// Admin delete team member
apiRouter.delete('/admin/team/:id', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const memberId = req.params.id;

  await dbManager.updateAsync(d => {
    d.teamMembers = d.teamMembers.filter(t => t.id !== memberId);
  });

  if (firestoreDb) {
    try {
      await deleteDoc(doc(firestoreDb, 'team_members', memberId));
    } catch (err) {
      console.error('Failed to delete team member from Cloud Firestore:', err);
    }
  }

  recordAudit(admin.email, 'DELETE_TEAM_MEMBER', `Deleted organizer: ${memberId}`);
  res.json({ success: true, teamMembers: dbManager.get().teamMembers });
});

// Admin view email outbox
apiRouter.get('/admin/emails', adminOnlyMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await dbManager.syncFromFirestore();
  const db = dbManager.get();
  res.json({ emails: db.emailLogs });
});

// Admin view audit logs
apiRouter.get('/admin/audit-logs', adminOnlyMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await dbManager.syncFromFirestore();
  const db = dbManager.get();
  res.json({ auditLogs: db.auditLogs });
});

// Admin export registrations to CSV
apiRouter.get('/admin/export-csv', adminOnlyMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await dbManager.syncFromFirestore();
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
      'Payment Proof Attached',
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
      r.paymentProofUrl ? 'YES (Receipt Slip Attached)' : 'NO',
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

// Admin view all participant contact inquiries
apiRouter.get('/admin/queries', adminOnlyMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  await dbManager.syncFromFirestore();
  const db = dbManager.get();
  res.json({ queries: db.contactMessages });
});

// Admin update query status
apiRouter.patch('/admin/queries/:id', adminOnlyMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  await dbManager.updateAsync(d => {
    const q = d.contactMessages.find(m => m.id === id);
    if (q && status) {
      q.status = status;
    }
  });
  res.json({ success: true, queries: dbManager.get().contactMessages });
});
