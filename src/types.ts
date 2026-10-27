export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  college: string;
  role: 'participant' | 'admin';
  emailVerified: boolean;
  createdAt?: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone: string;
  college?: string;
  role?: string;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  zoneId: string;
  eventName: string;
  teamName: string;
  teamLeaderName: string;
  teamLeaderEmail: string;
  teamLeaderPhone: string;
  college: string;
  teamMembers: TeamMember[];
  additionalInfo?: Record<string, string>;
  registrationFee: number;
  paymentStatus: 'unpaid' | 'pending_verification' | 'verified' | 'rejected';
  registrationStatus: 'draft' | 'submitted' | 'under_verification' | 'confirmed' | 'rejected' | 'cancelled';
  paymentReference?: string;
  paymentProofUrl?: string;
  paymentProofFileName?: string;
  paymentProofUploadedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
  whatsappLink?: string;
}

export interface CompetitionEvent {
  id: string;
  slug: string;
  zoneId: string;
  zoneName: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  objectives: string[];
  eligibility: string;
  rules: string[];
  judgingCriteria: string[];
  allowedTech?: string[];
  minTeamSize: number;
  maxTeamSize: number;
  registrationFee: number;
  registrationDeadline: string;
  isOpen: boolean;
  whatsappGroupLink: string;
  whatsappVisibility: 'after_submission' | 'after_confirmation';
  customFields?: { id: string; label: string; placeholder: string; required: boolean }[];
}

export interface CompetitionZone {
  id: string;
  name: string;
  code: string;
  tagline: string;
  description: string;
  eventIds: string[];
}

export interface OrganizingTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  socialLink: string;
  phone?: string;
  displayOrder: number;
}

export interface GlobalSettings {
  eventName: string;
  institution: string;
  eventDate: string;
  isProvisionalDate: boolean;
  venue: string;
  prizePool: string;
  tagline: string;
  supportingTagline: string;
  organizerNotificationEmail: string;
  upiId: string;
  paymentQrCodeUrl: string;
  paymentInstructions: string;
  contactEmail: string;
  contactPhone: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: string;
  sentAt: string;
  status: 'delivered' | 'accepted' | 'failed';
  previewText: string;
  htmlBody: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
  status: 'unread' | 'replied';
}
