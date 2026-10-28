import { 
  UserProfile, 
  Registration, 
  CompetitionEvent, 
  CompetitionZone, 
  OrganizingTeamMember, 
  GlobalSettings, 
  EmailLog, 
  AuditLog,
  ContactMessage
} from '../types.ts';

const TOKEN_KEY = 'planetx_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Public
  getPublicConfig: () => request<{
    settings: GlobalSettings;
    zones: CompetitionZone[];
    events: CompetitionEvent[];
    teamMembers: OrganizingTeamMember[];
  }>('/api/public/config'),

  getEvent: (slug: string) => request<{ event: CompetitionEvent }>(`/api/events/${slug}`),

  submitContact: (data: { name: string; email: string; subject: string; message: string }) =>
    request<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Auth
  register: (data: { email: string; password: string; name: string; phone?: string; college?: string }) =>
    request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  googleAuth: (data: { uid: string; email: string; name?: string; photoUrl?: string }) =>
    request<{ user: UserProfile; token: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => request<{ user: UserProfile }>('/api/auth/me'),

  updateProfile: (data: { name?: string; phone?: string; college?: string }) =>
    request<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  // Participant Registrations
  getMyRegistrations: () => request<{ registrations: Registration[] }>('/api/registrations/my'),

  submitRegistration: (data: {
    eventId: string;
    teamName: string;
    teamLeaderName: string;
    teamLeaderPhone: string;
    college: string;
    teamMembers: any[];
    additionalInfo?: Record<string, string>;
    paymentProofBase64?: string;
    paymentProofFileName?: string;
    paymentReference?: string;
  }) =>
    request<{ success: boolean; registration: Registration; message: string }>('/api/registrations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  uploadPaymentProof: (registrationId: string, proofBase64: string, paymentReference: string, fileName?: string) =>
    request<{ success: boolean; registration: Registration; message: string }>(`/api/registrations/${registrationId}/payment-proof`, {
      method: 'POST',
      body: JSON.stringify({ proofBase64, paymentReference, fileName })
    }),

  resendRegistrationTicket: (registrationId: string) =>
    request<{ success: boolean; message: string }>(`/api/registrations/${registrationId}/resend-ticket`, {
      method: 'POST'
    }),

  // Admin
  getAdminOverview: () =>
    request<{
      stats: {
        totalRegistrations: number;
        totalParticipants: number;
        pendingPayments: number;
        confirmedRegistrations: number;
        totalRevenueCollected: number;
      };
      zoneStats: { zoneId: string; zoneName: string; total: number; confirmed: number }[];
      eventStats: any[];
    }>('/api/admin/overview'),

  getAdminRegistrations: (filters?: { zone?: string; event?: string; paymentStatus?: string; regStatus?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.zone) params.set('zone', filters.zone);
    if (filters?.event) params.set('event', filters.event);
    if (filters?.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
    if (filters?.regStatus) params.set('regStatus', filters.regStatus);
    if (filters?.search) params.set('search', filters.search);
    return request<{ registrations: Registration[] }>(`/api/admin/registrations?${params.toString()}`);
  },

  reviewPayment: (registrationId: string, approved: boolean, rejectionReason?: string) =>
    request<{ success: boolean; registration: Registration; message: string }>(`/api/admin/registrations/${registrationId}/payment-review`, {
      method: 'POST',
      body: JSON.stringify({ approved, rejectionReason })
    }),

  updateRegistrationStatus: (registrationId: string, status: string, note?: string) =>
    request<{ success: boolean; registration: Registration }>(`/api/admin/registrations/${registrationId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note })
    }),

  updateRegistrationTicketPass: (registrationId: string, updates: any) =>
    request<{ success: boolean; registration: Registration; message: string }>(`/api/admin/registrations/${registrationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  resendRegistrationTicketAdmin: (registrationId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/registrations/${registrationId}/resend-ticket`, {
      method: 'POST'
    }),

  updateEvent: (eventId: string, updates: Partial<CompetitionEvent>) =>
    request<{ success: boolean; event: CompetitionEvent }>(`/api/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  createEvent: (data: Partial<CompetitionEvent>) =>
    request<{ success: boolean; event: CompetitionEvent }>('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteEvent: (eventId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/events/${eventId}`, {
      method: 'DELETE'
    }),

  batchUpdateFees: (feesMap: Record<string, number>) =>
    request<{ success: boolean; events: CompetitionEvent[] }>('/api/admin/events/batch-fees', {
      method: 'POST',
      body: JSON.stringify({ feesMap })
    }),

  updateGlobalSettings: (updates: Partial<GlobalSettings>) =>
    request<{ success: boolean; settings: GlobalSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  uploadPaymentQr: (qrBase64: string) =>
    request<{ success: boolean; paymentQrCodeUrl: string }>('/api/admin/upload-qr', {
      method: 'POST',
      body: JSON.stringify({ qrBase64 })
    }),

  updateTeamMember: (memberId: string, updates: Partial<OrganizingTeamMember>) =>
    request<{ success: boolean; teamMembers: OrganizingTeamMember[] }>(`/api/admin/team/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  createTeamMember: (data: Partial<OrganizingTeamMember>) =>
    request<{ success: boolean; member: OrganizingTeamMember; teamMembers: OrganizingTeamMember[] }>('/api/admin/team', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteTeamMember: (memberId: string) =>
    request<{ success: boolean; teamMembers: OrganizingTeamMember[] }>(`/api/admin/team/${memberId}`, {
      method: 'DELETE'
    }),

  getAdminEmails: () => request<{ emails: EmailLog[] }>('/api/admin/emails'),

  getAdminAuditLogs: () => request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs'),

  getAdminQueries: () => request<{ queries: ContactMessage[] }>('/api/admin/queries'),

  updateQueryStatus: (queryId: string, status: 'unread' | 'replied') =>
    request<{ success: boolean; queries: ContactMessage[] }>(`/api/admin/queries/${queryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getExportCsvUrl: () => `/api/admin/export-csv`
};
