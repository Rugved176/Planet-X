import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Registration, 
  CompetitionEvent, 
  CompetitionZone, 
  GlobalSettings, 
  OrganizingTeamMember, 
  EmailLog, 
  AuditLog,
  ContactMessage
} from '../types.ts';
import { api } from '../lib/api.ts';
import { DelegationTicketModal } from '../components/DelegationTicketModal.tsx';
import { 
  generateTeamDossierPdf, 
  generateAllRegistrationsMasterPdf, 
  getZoneLabel 
} from '../lib/pdfGenerator.ts';
import { 
  Shield, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Download, 
  Search, 
  Filter, 
  Settings, 
  Mail, 
  Eye, 
  Edit, 
  Upload, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  MessageCircle,
  Clock,
  Layers,
  ChevronRight,
  Send,
  Check,
  Plus,
  Trash2,
  Save,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  Calendar,
  DollarSign,
  Award,
  BookOpen,
  ListChecks,
  User,
  Phone,
  Image as ImageIcon,
  Ticket,
  X
} from 'lucide-react';

interface AdminDashboardPageProps {
  settings: GlobalSettings;
  zones: CompetitionZone[];
  events: CompetitionEvent[];
  teamMembers: OrganizingTeamMember[];
  onRefreshConfig: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  settings: initialSettings,
  zones,
  events: initialEvents,
  teamMembers: initialTeamMembers,
  onRefreshConfig
}) => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'inquiries' | 'events' | 'settings' | 'team' | 'emails' | 'audit'>('overview');
  
  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<CompetitionEvent[]>(initialEvents);
  const [teamList, setTeamList] = useState<OrganizingTeamMember[]>(initialTeamMembers);
  const [settings, setSettings] = useState<GlobalSettings>(initialSettings);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [queries, setQueries] = useState<ContactMessage[]>([]);
  const [filterQueryStatus, setFilterQueryStatus] = useState<'all' | 'unread' | 'replied'>('all');
  const [querySearch, setQuerySearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states for registrations
  const [filterZone, setFilterZone] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterRegStatus, setFilterRegStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected registration for payment review
  const [reviewingReg, setReviewingReg] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingTicketReg, setEditingTicketReg] = useState<Registration | null>(null);

  // Email preview modal
  const [previewingEmail, setPreviewingEmail] = useState<EmailLog | null>(null);

  // Editing event modal
  const [editingEvent, setEditingEvent] = useState<CompetitionEvent | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [showBatchFeeManager, setShowBatchFeeManager] = useState<boolean>(false);
  const [eventSearchTerm, setEventSearchTerm] = useState<string>('');
  const [eventZoneFilter, setEventZoneFilter] = useState<string>('all');
  const [batchFeesMap, setBatchFeesMap] = useState<Record<string, number>>({});
  const [savingBatchFees, setSavingBatchFees] = useState<boolean>(false);
  const [eventActionNotice, setEventActionNotice] = useState<string | null>(null);

  // New event form state
  const [newEventForm, setNewEventForm] = useState<Partial<CompetitionEvent>>({
    name: '',
    zoneId: 'zone-a',
    shortDescription: '',
    fullDescription: '',
    registrationFee: 150,
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationDeadline: '2026-11-18T23:59:59',
    isOpen: true,
    whatsappGroupLink: '',
    whatsappVisibility: 'after_submission',
    eligibility: 'Open to all undergraduate and postgraduate students with a valid institution ID.',
    rules: [
      'Original work and development required during the competition window.',
      'Open-source libraries and public frameworks are permitted with proper attribution.',
      'Judges decisions regarding scoring rubrics and podium allocations are final and binding.'
    ],
    judgingCriteria: [
      'Technical Execution & Architecture (35%)',
      'Innovation & Practical Feasibility (35%)',
      'Presentation, Visual Design & Q&A Defense (30%)'
    ],
    objectives: [
      'Architect a working project prototype addressing the official challenge theme',
      'Demonstrate clean code structure and real-world utility',
      'Present solution to technical evaluation jury'
    ],
    allowedTech: ['React', 'TypeScript', 'Node.js', 'Python']
  });

  // Editing & creating team member modal state
  const [editingMember, setEditingMember] = useState<OrganizingTeamMember | null>(null);
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState<Partial<OrganizingTeamMember>>({
    name: '',
    role: 'Event Organizer',
    email: '',
    phone: '',
    bio: '',
    photoUrl: '',
    socialLink: 'https://linkedin.com'
  });

  // QR Code upload
  const [qrFileBase64, setQrFileBase64] = useState<string>('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, regsRes, emailsRes, auditsRes, queriesRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminRegistrations({
          zone: filterZone,
          event: filterEvent,
          paymentStatus: filterPayment,
          regStatus: filterRegStatus,
          search: searchQuery
        }),
        api.getAdminEmails(),
        api.getAdminAuditLogs(),
        api.getAdminQueries().catch(() => ({ queries: [] }))
      ]);

      setOverview(overviewRes);
      setRegistrations(regsRes.registrations);
      setEmailLogs(emailsRes.emails);
      setAuditLogs(auditsRes.auditLogs);
      setQueries(queriesRes.queries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQueryStatus = async (queryId: string, currentStatus: 'unread' | 'replied') => {
    const newStatus = currentStatus === 'unread' ? 'replied' : 'unread';
    try {
      const res = await api.updateQueryStatus(queryId, newStatus);
      setQueries(res.queries);
    } catch (err: any) {
      console.error('Failed to update query status:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filterZone, filterEvent, filterPayment, filterRegStatus, searchQuery]);

  useEffect(() => {
    if (initialTeamMembers) {
      setTeamList(initialTeamMembers);
    }
  }, [initialTeamMembers]);

  useEffect(() => {
    if (initialEvents) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-slate-100">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-display uppercase tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-400 mt-2">
          Administrator privileges are required to access this system console. Please log in with an authorized organizer account.
        </p>
      </div>
    );
  }

  // Handle Payment Review (Approve / Reject)
  const handlePaymentReview = async (approved: boolean) => {
    if (!reviewingReg) return;
    setReviewSubmitting(true);
    try {
      await api.reviewPayment(reviewingReg.id, approved, rejectionReason);
      setReviewingReg(null);
      setRejectionReason('');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle Save Event Config (Full Details)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const res = await api.updateEvent(editingEvent.id, editingEvent);
      if (res.success && res.event) {
        setEvents((prev) => prev.map((ev) => (ev.id === res.event.id ? res.event : ev)));
      }
      setEditingEvent(null);
      setEventActionNotice(`Competition "${editingEvent.name}" details and fees successfully updated!`);
      setTimeout(() => setEventActionNotice(null), 4000);
      onRefreshConfig();
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update event configuration');
    }
  };

  // Handle Create New Competition
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.name || !newEventForm.name.trim()) {
      alert('Please enter a competition name.');
      return;
    }
    try {
      const res = await api.createEvent(newEventForm);
      if (res.success && res.event) {
        setEvents((prev) => [...prev, res.event]);
      }
      setIsCreatingEvent(false);
      setEventActionNotice(`New Competition "${newEventForm.name}" created successfully!`);
      setTimeout(() => setEventActionNotice(null), 4000);
      onRefreshConfig();
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create new competition');
    }
  };

  // Handle Delete Competition
  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This will remove it from all portal views.`)) {
      return;
    }
    try {
      await api.deleteEvent(eventId);
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      setEventActionNotice(`Event "${eventName}" has been deleted.`);
      setTimeout(() => setEventActionNotice(null), 4000);
      onRefreshConfig();
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  // Handle Quick Toggle Event Status (Open / Closed)
  const handleToggleEventStatus = async (ev: CompetitionEvent) => {
    try {
      const updated = { ...ev, isOpen: !ev.isOpen };
      await api.updateEvent(ev.id, { isOpen: !ev.isOpen });
      setEvents((prev) => prev.map((item) => (item.id === ev.id ? updated : item)));
      setEventActionNotice(`Event "${ev.name}" registration is now ${!ev.isOpen ? 'OPEN' : 'LOCKED'}.`);
      setTimeout(() => setEventActionNotice(null), 3000);
      onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to update event status');
    }
  };

  // Handle Batch Save Fees
  const handleBatchSaveFees = async () => {
    setSavingBatchFees(true);
    try {
      const res = await api.batchUpdateFees(batchFeesMap);
      if (res.success && res.events) {
        setEvents(res.events);
      }
      setShowBatchFeeManager(false);
      setEventActionNotice('All competition fees updated successfully across the platform!');
      setTimeout(() => setEventActionNotice(null), 4000);
      onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to update batch fees');
    } finally {
      setSavingBatchFees(false);
    }
  };

  // Handle Save Global Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateGlobalSettings(settings);
      if (qrFileBase64) {
        await api.uploadPaymentQr(qrFileBase64);
        setQrFileBase64('');
      }
      alert('Global settings successfully saved!');
      onRefreshConfig();
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update global settings');
    }
  };

  // Handle Save Team Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await api.updateTeamMember(editingMember.id, editingMember);
      setTeamList(res.teamMembers);
      setEditingMember(null);
      onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to update team member profile');
    }
  };

  const handleCreateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name?.trim()) {
      alert('Organizer Name is required.');
      return;
    }
    try {
      const res = await api.createTeamMember(newMemberData);
      setTeamList(res.teamMembers);
      setIsCreatingMember(false);
      setNewMemberData({
        name: '',
        role: 'Event Organizer',
        email: '',
        phone: '',
        bio: '',
        photoUrl: '',
        socialLink: 'https://linkedin.com'
      });
      onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to create team member.');
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from the organizing committee?`)) {
      return;
    }
    try {
      const res = await api.deleteTeamMember(memberId);
      setTeamList(res.teamMembers);
      onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to delete team member.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              OPERATIONAL COMMAND
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Administrator Level
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-tight mt-1">
            PLANET-X Administrative Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage registrations, verify payments, update competition rules & fees, and monitor system email logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh All Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <a
            href={api.getExportCsvUrl()}
            download
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white flex items-center gap-1.5 shadow-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs (Strictly functional segmented tabs) */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-8">
        {[
          { id: 'overview', label: 'Overview Analytics', icon: TrendingUp },
          { id: 'registrations', label: `Registrations (${registrations.length})`, icon: Users },
          { id: 'inquiries', label: `Participant Queries (${queries.filter(q => q.status === 'unread').length} new)`, icon: MessageCircle },
          { id: 'events', label: 'Competitions & Fees', icon: Layers },
          { id: 'settings', label: 'Event & Payment Config', icon: Settings },
          { id: 'team', label: 'Organizing Team (6)', icon: Users },
          { id: 'emails', label: `Email Outbox (${emailLogs.length})`, icon: Mail },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW ANALYTICS */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-8">
          {/* Key Metric Strips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0b1126] border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Total Registrations</span>
              <span className="text-3xl font-black font-display text-white tabular-nums">
                {overview.stats.totalRegistrations}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#0b1126] border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Registered Users</span>
              <span className="text-3xl font-black font-display text-cyan-300 tabular-nums">
                {overview.stats.totalParticipants}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#0b1126] border border-amber-500/20">
              <span className="text-[11px] font-mono uppercase text-amber-400 block mb-1">Pending Payment Review</span>
              <span className="text-3xl font-black font-display text-amber-300 tabular-nums">
                {overview.stats.pendingPayments}
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-[#0b1126] border border-emerald-500/20">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block mb-1">Verified Revenue</span>
              <span className="text-3xl font-black font-display text-emerald-300 tabular-nums">
                ₹{overview.stats.totalRevenueCollected}
              </span>
            </div>
          </div>

          {/* Registrations Grouped by Zone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {overview.zoneStats.map((z: any) => (
              <div key={z.zoneId} className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  ZONE BREAKDOWN
                </span>
                <h3 className="text-xl font-bold font-display text-white">{z.zoneName}</h3>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Delegations:</span>
                    <span className="font-bold text-white tabular-nums">{z.total}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Confirmed Entries:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{z.confirmed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Competitions Pod Table */}
          <div className="rounded-2xl bg-[#0b1126] border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-white uppercase tracking-tight">
                Competition Registration Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-400">8 Official Competitions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Competition</th>
                    <th className="p-4">Zone</th>
                    <th className="p-4">Total Squads</th>
                    <th className="p-4">Awaiting Review</th>
                    <th className="p-4">Confirmed</th>
                    <th className="p-4">Fee</th>
                    <th className="p-4">Portal Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {overview.eventStats.map((e: any) => (
                    <tr key={e.eventId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-semibold text-white">{e.eventName}</td>
                      <td className="p-4 text-slate-400">{e.zoneName}</td>
                      <td className="p-4 font-bold text-cyan-300 tabular-nums">{e.total}</td>
                      <td className="p-4 tabular-nums">
                        {e.pendingVerification > 0 ? (
                          <span className="text-amber-400 font-semibold">{e.pendingVerification} review</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-emerald-400 tabular-nums">{e.confirmed}</td>
                      <td className="p-4 text-slate-300">₹{e.registrationFee}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${e.isOpen ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                          {e.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTRATIONS MANAGEMENT */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#0b1126] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search ID, team, email, leader, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Zone Filter */}
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="all">All Zones</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>

            {/* Payment Filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending_verification">Pending Review</option>
              <option value="verified">Verified & Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Registration Status Filter */}
            <select
              value={filterRegStatus}
              onChange={(e) => setFilterRegStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_verification">Under Verification</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Registrations Table */}
          <div className="rounded-2xl bg-[#0b1126] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Reg ID</th>
                    <th className="p-4">Event & Zone Track</th>
                    <th className="p-4">Team & Leader</th>
                    <th className="p-4">College</th>
                    <th className="p-4">Squad Size</th>
                    <th className="p-4">Fee</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No registrations match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-cyan-300">{r.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{r.eventName}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              r.zoneId === 'zone-a'
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : r.zoneId === 'zone-b'
                                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}>
                              {getZoneLabel(r.zoneId, zones)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{r.teamName}</p>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            <span className="text-slate-400">Leader:</span> {r.teamLeaderName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <a href={`mailto:${r.teamLeaderEmail}`} className="hover:text-cyan-300 underline">
                              {r.teamLeaderEmail}
                            </a>
                            {r.teamLeaderPhone && (
                              <>
                                <span>•</span>
                                <a href={`tel:${r.teamLeaderPhone}`} className="hover:text-cyan-300 text-cyan-400">
                                  {r.teamLeaderPhone}
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 max-w-[150px] truncate">{r.college}</td>
                        <td className="p-4 text-slate-300 tabular-nums">
                          {r.teamMembers.length + 1} members
                        </td>
                        <td className="p-4 text-cyan-300 tabular-nums font-bold">₹{r.registrationFee}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            r.paymentStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : r.paymentStatus === 'pending_verification'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {r.paymentStatus.replace('_', ' ')}
                          </span>
                          {r.paymentReference && (
                            <span className="block text-[9px] font-mono text-slate-500 truncate max-w-[100px] mt-0.5">
                              {r.paymentReference}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            r.registrationStatus === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : r.registrationStatus === 'under_verification'
                              ? 'bg-cyan-500/10 text-cyan-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {r.registrationStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingTicketReg(r)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors flex items-center gap-1 shadow-sm"
                              title="View, Edit, or Resend Official Delegation Ticket Pass"
                            >
                              <Ticket className="w-3.5 h-3.5 text-amber-400" />
                              <span>Pass & Ticket</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => generateTeamDossierPdf(r, events.find(e => e.id === r.eventId), zones, settings)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/60 transition-colors flex items-center gap-1 shadow-sm"
                              title="Download complete delegation PDF dossier with roster and payment slip"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setReviewingReg(r);
                                setRejectionReason(r.rejectionReason || '');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PARTICIPANT QUERIES & INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="p-4 rounded-2xl bg-[#0b1126] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search queries by participant name, email, subject, or message..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterQueryStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterQueryStatus === 'all'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({queries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterQueryStatus('unread')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  filterQueryStatus === 'unread'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <span>Unread</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/80 text-amber-200">
                  {queries.filter(q => q.status === 'unread').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterQueryStatus('replied')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterQueryStatus === 'replied'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Replied ({queries.filter(q => q.status === 'replied').length})
              </button>
            </div>
          </div>

          {/* Queries List */}
          {(() => {
            const filteredQueries = queries.filter(q => {
              if (filterQueryStatus !== 'all' && q.status !== filterQueryStatus) return false;
              if (querySearch.trim()) {
                const s = querySearch.toLowerCase();
                return (
                  q.name.toLowerCase().includes(s) ||
                  q.email.toLowerCase().includes(s) ||
                  q.subject.toLowerCase().includes(s) ||
                  q.message.toLowerCase().includes(s)
                );
              }
              return true;
            });

            if (filteredQueries.length === 0) {
              return (
                <div className="p-12 text-center rounded-2xl bg-[#0b1126] border border-slate-800 text-slate-400">
                  <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">No participant inquiries found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {querySearch ? 'No messages match your search filter.' : 'Incoming contact form submissions will be listed here with complete message details.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredQueries.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl bg-[#0b1126] border transition-all ${
                      item.status === 'unread'
                        ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">{item.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              item.status === 'unread'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <a
                          href={`mailto:${item.email}?subject=${encodeURIComponent(`[PLANET-X 2026] Re: ${item.subject}`)}`}
                          className="text-xs font-mono text-cyan-400 hover:underline hover:text-cyan-300 block mt-0.5"
                        >
                          {item.email}
                        </a>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.receivedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                        Subject
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {item.subject}
                      </h4>
                    </div>

                    {/* Complete Query Message */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans mb-4">
                      {item.message}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => handleToggleQueryStatus(item.id, item.status)}
                        className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {item.status === 'unread' ? 'Mark as Replied' : 'Mark as Unread'}
                        </span>
                      </button>

                      <a
                        href={`mailto:${item.email}?subject=${encodeURIComponent(`[PLANET-X 2026] Re: ${item.subject}`)}`}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white flex items-center gap-1.5 shadow transition-all"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply to Participant</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: COMPETITIONS & FEES MANAGEMENT HUB */}
      {activeTab === 'events' && (() => {
        const filteredEvents = events.filter((ev) => {
          const matchesZone = eventZoneFilter === 'all' || ev.zoneId === eventZoneFilter;
          const matchesSearch =
            !eventSearchTerm ||
            ev.name.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
            ev.zoneName.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
            (ev.shortDescription && ev.shortDescription.toLowerCase().includes(eventSearchTerm.toLowerCase()));
          return matchesZone && matchesSearch;
        });

        return (
          <div className="space-y-6">
            {/* Top Action Notification Toast */}
            {eventActionNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{eventActionNotice}</span>
                </div>
                <button onClick={() => setEventActionNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Header Control Banner */}
            <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                    EVENT CONFIGURATION CENTER
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                    {events.length} Events Total
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  Competitions & Fees Master Control
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Update registration fees, rules, team squad limits, WhatsApp invite URLs, and zone allocations for all competitions live on the portal.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => {
                    const currentMap: Record<string, number> = {};
                    events.forEach(e => { currentMap[e.id] = e.registrationFee; });
                    setBatchFeesMap(currentMap);
                    setShowBatchFeeManager(!showBatchFeeManager);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                    showBatchFeeManager
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-400/30'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{showBatchFeeManager ? 'Close Fee Matrix' : 'Quick Fee Matrix'}</span>
                </button>

                <button
                  onClick={() => setIsCreatingEvent(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Competition</span>
                </button>
              </div>
            </div>

            {/* QUICK BATCH FEES MATRIX TABLE */}
            {showBatchFeeManager && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/30 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      Batch Competition Fees Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust fees for multiple events simultaneously and apply in one click.
                    </p>
                  </div>
                  <button
                    onClick={handleBatchSaveFees}
                    disabled={savingBatchFees}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingBatchFees ? 'Saving Changes...' : 'Save All Fees Across Platform'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-2.5 px-3">Competition</th>
                        <th className="py-2.5 px-3">Zone Track</th>
                        <th className="py-2.5 px-3">Squad Limits</th>
                        <th className="py-2.5 px-3">Current Fee</th>
                        <th className="py-2.5 px-3">Updated Fee (₹)</th>
                        <th className="py-2.5 px-3">Registration Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-white">{ev.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-cyan-300">
                              {ev.zoneName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{ev.minTeamSize} - {ev.maxTeamSize} Members</td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono">₹{ev.registrationFee}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 font-mono text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={batchFeesMap[ev.id] ?? ev.registrationFee}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setBatchFeesMap((prev) => ({ ...prev, [ev.id]: val }));
                                }}
                                className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleEventStatus(ev)}
                              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                                ev.isOpen
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                              }`}
                            >
                              {ev.isOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              <span>{ev.isOpen ? 'OPEN' : 'LOCKED'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search competition by name or rules..."
                  value={eventSearchTerm}
                  onChange={(e) => setEventSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Zone Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: `All (${events.length})` },
                  { id: 'zone-a', label: 'Zone A: Code-Zone' },
                  { id: 'zone-b', label: 'Zone B: Fun-Zone' },
                  { id: 'zone-c', label: 'Zone C: Fin-Tech' }
                ].map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setEventZoneFilter(z.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      eventZoneFilter === z.id
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((ev) => {
                const isZoneA = ev.zoneId === 'zone-a';
                const isZoneB = ev.zoneId === 'zone-b';

                return (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl bg-[#0b1126] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                            isZoneA
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : isZoneB
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {ev.zoneName || ev.zoneId.toUpperCase()}
                        </span>

                        <button
                          onClick={() => handleToggleEventStatus(ev)}
                          title="Click to toggle registration open/locked"
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                            ev.isOpen
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          {ev.isOpen ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                          <span>{ev.isOpen ? 'ACTIVE' : 'LOCKED'}</span>
                        </button>
                      </div>

                      {/* Title & Short Description */}
                      <h3 className="text-lg font-bold font-display text-white mb-1.5">{ev.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {ev.shortDescription || ev.fullDescription?.slice(0, 90) || 'Competition details active.'}
                      </p>

                      {/* Key Parameters Cards */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Entry Fee</span>
                          <span className="text-base font-black font-mono text-cyan-300">₹{ev.registrationFee}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase font-mono block">Team Size</span>
                          <span className="text-xs font-bold text-white block mt-0.5">{ev.minTeamSize} - {ev.maxTeamSize} Members</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-400 space-y-1 mb-4">
                        <div className="flex justify-between text-[11px]">
                          <span>Deadline:</span>
                          <span className="text-slate-300 font-mono">
                            {new Date(ev.registrationDeadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Rules Count:</span>
                          <span className="text-slate-300">{ev.rules?.length || 0} Listed</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Judging Rubrics:</span>
                          <span className="text-slate-300">{ev.judgingCriteria?.length || 0} Criteria</span>
                        </div>
                        <div className="flex justify-between text-[11px] truncate">
                          <span>WhatsApp:</span>
                          <span className="text-slate-300 font-mono truncate max-w-[140px]">
                            {ev.whatsappGroupLink ? 'Connected' : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setEditingEvent({ ...ev })}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center justify-center gap-1.5 shadow"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Full Details & Fees</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.name)}
                        title="Delete competition"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEvents.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No competitions match your search or filter</h4>
                <p className="text-xs text-slate-400 mt-1">Try switching to &quot;All Tracks&quot; or clearing your search term.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 4: EVENT & PAYMENT CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl rounded-2xl bg-[#0b1126] border border-slate-800 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold font-display text-white">Global Event & Payment Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates to dates, venue, and payment instructions take effect across the entire platform immediately.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Event Date</label>
                <input
                  type="date"
                  value={settings.eventDate}
                  onChange={(e) => setSettings({ ...settings, eventDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="provisionalCheck"
                  checked={settings.isProvisionalDate}
                  onChange={(e) => setSettings({ ...settings, isProvisionalDate: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400"
                />
                <label htmlFor="provisionalCheck" className="text-xs text-slate-300">
                  Mark date as provisional
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Prize Pool</label>
              <input
                type="text"
                value={settings.prizePool}
                onChange={(e) => setSettings({ ...settings, prizePool: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Venue Address</label>
              <input
                type="text"
                value={settings.venue}
                onChange={(e) => setSettings({ ...settings, venue: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold font-display text-white uppercase tracking-wider mb-3">
                Payment & UPI Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Official UPI ID</label>
                  <input
                    type="text"
                    value={settings.upiId}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Organizer Alert Email</label>
                  <input
                    type="email"
                    value={settings.organizerNotificationEmail}
                    onChange={(e) => setSettings({ ...settings, organizerNotificationEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Payment Instructions</label>
                <textarea
                  rows={3}
                  value={settings.paymentInstructions}
                  onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white resize-none"
                />
              </div>

              {/* Upload QR Code */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Upload Official Merchant QR Code
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (ev) => setQrFileBase64(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                />
                {settings.paymentQrCodeUrl && (
                  <p className="text-[10px] text-emerald-400 mt-2">
                    &check; QR code currently active on the registration portal.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white shadow-lg transition-all"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: ORGANIZING TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Organizing Committee Management</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update names, roles, official email addresses, mobile numbers, photos, and social profiles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingMember(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Organizer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamList.map((m) => (
              <div
                key={m.id}
                className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4 relative flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 border border-cyan-500/30 shadow-md">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{m.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">{m.name}</h4>
                      <p className="text-xs font-mono text-cyan-400 truncate">{m.role}</p>
                      {m.phone && (
                        <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <a href={`tel:${m.phone}`} className="hover:underline font-mono">{m.phone}</a>
                        </p>
                      )}
                    </div>
                  </div>

                  {m.email && (
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <a href={`mailto:${m.email}`} className="text-cyan-300 hover:underline font-mono truncate">{m.email}</a>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {m.bio || 'No biography provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingMember({ ...m })}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Profile & Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMember(m.id, m.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 transition-colors cursor-pointer"
                    title="Remove Organizer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: EMAIL OUTBOX */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            Audit of all transactional emails dispatched by PLANET-X 2026. Click any row to preview the generated HTML email template.
          </div>

          <div className="rounded-2xl bg-[#0b1126] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Template Type</th>
                    <th className="p-4">Dispatched At</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No transactional emails dispatched yet.
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-mono text-white">{e.to}</td>
                        <td className="p-4 font-medium text-slate-200">{e.subject}</td>
                        <td className="p-4 font-mono text-cyan-300 text-[10px]">{e.type}</td>
                        <td className="p-4 text-slate-400 text-[11px] tabular-nums">
                          {new Date(e.sentAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase">
                            {e.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setPreviewingEmail(e)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                            title="Preview HTML"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0b1126] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No admin actions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-900/40">
                        <td className="p-4 font-mono text-[11px] text-slate-400 tabular-nums">
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 font-mono text-cyan-300">{a.adminEmail}</td>
                        <td className="p-4 font-bold text-white uppercase text-[10px] font-mono">
                          {a.action}
                        </td>
                        <td className="p-4 text-slate-300">{a.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Payment Review Modal (with Proof Screenshot Preview) */}
      {reviewingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
            <div className="border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  PAYMENT AUDIT & VERIFICATION
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {getZoneLabel(reviewingReg.zoneId, zones)}
                </span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white mt-1">
                {reviewingReg.eventName} — {reviewingReg.teamName}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="font-mono text-cyan-300">ID: {reviewingReg.id}</span>
                <span>•</span>
                <span>Submitted: {new Date(reviewingReg.submittedAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Delegation Data Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-4">
              <div>
                <span className="text-slate-500 block">Leader:</span>
                <span className="text-white font-medium">{reviewingReg.teamLeaderName}</span>
                <span className="block text-slate-400 font-mono">{reviewingReg.teamLeaderEmail}</span>
                <span className="block text-cyan-300 font-mono">{reviewingReg.teamLeaderPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">College:</span>
                <span className="text-white font-medium">{reviewingReg.college}</span>
                <span className="text-slate-500 block mt-2">Registration Fee:</span>
                <span className="text-cyan-300 font-bold text-sm">₹{reviewingReg.registrationFee}</span>
              </div>
            </div>

            {/* Squad Members Roster */}
            {reviewingReg.teamMembers && reviewingReg.teamMembers.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-mono uppercase text-slate-400 block mb-2">
                  Squad Members ({reviewingReg.teamMembers.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-auto">
                  {reviewingReg.teamMembers.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-slate-400 font-mono text-[11px] truncate">{m.email}</p>
                      {m.phone && <p className="text-cyan-400 font-mono text-[11px] mt-0.5">{m.phone}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Proof Image / PDF */}
            <div className="mb-4">
              <span className="text-xs font-mono uppercase text-slate-400 block mb-2">
                Uploaded Transaction Proof:
              </span>
              {reviewingReg.paymentProofUrl ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-[320px] overflow-auto text-center">
                  {reviewingReg.paymentProofUrl.startsWith('data:application/pdf') ? (
                    <div className="p-6 text-center">
                      <FileText className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
                      <span className="text-xs text-slate-300 font-semibold block">PDF Document Uploaded</span>
                      <a
                        href={reviewingReg.paymentProofUrl}
                        download={reviewingReg.paymentProofFileName || 'payment_receipt.pdf'}
                        className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                      >
                        Download PDF Receipt
                      </a>
                    </div>
                  ) : (
                    <img
                      src={reviewingReg.paymentProofUrl}
                      alt="Payment Proof"
                      className="max-h-[300px] w-auto mx-auto object-contain rounded-lg"
                    />
                  )}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-slate-950 border border-dashed border-slate-800 text-xs text-slate-500">
                  No payment screenshot has been uploaded yet for this registration.
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Reported UTR / Transaction Reference:</span>
                <code className="text-cyan-300 font-mono font-semibold">
                  {reviewingReg.paymentReference || 'None supplied'}
                </code>
              </div>
            </div>

            {/* Rejection reason if rejecting */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Rejection Reason (Sent to participant if rejected)
              </label>
              <input
                type="text"
                placeholder="e.g. UTR mismatch, blur screenshot, incomplete amount..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            {/* Decision Actions & PDF Download */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingReg(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => generateTeamDossierPdf(reviewingReg, events.find(e => e.id === reviewingReg.eventId), zones, settings)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 transition-all flex items-center gap-1.5 shadow"
                  title="Download complete printable PDF report for this delegation with attached payment slip"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Dossier (PDF)</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handlePaymentReview(false)}
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handlePaymentReview(true)}
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-white transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Full Event Details & Fees */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase font-bold">
                  EDIT COMPETITION PARAMETERS
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-0.5">
                  Configure {editingEvent.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-6 text-xs">
              {/* SECTION 1: ESSENTIAL DETAILS */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-l-2 border-cyan-400 pl-2">
                  1. Essential Info & Allocation
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Competition Title *</label>
                    <input
                      type="text"
                      required
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Zone Track Allocation *</label>
                    <select
                      value={editingEvent.zoneId}
                      onChange={(e) => {
                        const zid = e.target.value;
                        const zObj = zones.find(z => z.id === zid);
                        setEditingEvent({
                          ...editingEvent,
                          zoneId: zid,
                          zoneName: zObj ? zObj.name : editingEvent.zoneName
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="zone-a">ZONE A: CODE-ZONE</option>
                      <option value="zone-b">ZONE B: FUN-ZONE</option>
                      <option value="zone-c">ZONE C: FIN-TECH</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Registration Fee (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editingEvent.registrationFee}
                      onChange={(e) => setEditingEvent({ ...editingEvent, registrationFee: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Min Squad Size</label>
                    <input
                      type="number"
                      min="1"
                      value={editingEvent.minTeamSize}
                      onChange={(e) => setEditingEvent({ ...editingEvent, minTeamSize: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Max Squad Size</label>
                    <input
                      type="number"
                      min="1"
                      value={editingEvent.maxTeamSize}
                      onChange={(e) => setEditingEvent({ ...editingEvent, maxTeamSize: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Registration Status</label>
                    <select
                      value={editingEvent.isOpen ? 'open' : 'closed'}
                      onChange={(e) => setEditingEvent({ ...editingEvent, isOpen: e.target.value === 'open' })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none font-semibold"
                    >
                      <option value="open">Active (Open)</option>
                      <option value="closed">Locked (Closed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Registration Deadline</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DDTHH:mm:ss"
                    value={editingEvent.registrationDeadline}
                    onChange={(e) => setEditingEvent({ ...editingEvent, registrationDeadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: DESCRIPTIONS & ELIGIBILITY */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-l-2 border-indigo-400 pl-2">
                  2. Descriptions & Eligibility
                </span>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Short Catchy Description (Card overview)</label>
                  <input
                    type="text"
                    value={editingEvent.shortDescription || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Full Competition Description</label>
                  <textarea
                    rows={3}
                    value={editingEvent.fullDescription || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, fullDescription: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={editingEvent.eligibility || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, eligibility: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 3: RULES & GUIDELINES */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-l-2 border-emerald-400 pl-2">
                    3. Rules & Guidelines ({editingEvent.rules?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentRules = editingEvent.rules || [];
                      setEditingEvent({ ...editingEvent, rules: [...currentRules, ''] });
                    }}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Rule</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(editingEvent.rules || []).map((rule, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-xs w-5">{rIdx + 1}.</span>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => {
                          const newRules = [...(editingEvent.rules || [])];
                          newRules[rIdx] = e.target.value;
                          setEditingEvent({ ...editingEvent, rules: newRules });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newRules = (editingEvent.rules || []).filter((_, i) => i !== rIdx);
                          setEditingEvent({ ...editingEvent, rules: newRules });
                        }}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: JUDGING CRITERIA */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-l-2 border-amber-400 pl-2">
                    4. Judging Criteria & Weightage ({editingEvent.judgingCriteria?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingEvent.judgingCriteria || [];
                      setEditingEvent({ ...editingEvent, judgingCriteria: [...current, ''] });
                    }}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Criteria</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(editingEvent.judgingCriteria || []).map((crit, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-xs w-5">{cIdx + 1}.</span>
                      <input
                        type="text"
                        value={crit}
                        placeholder="e.g. Technical Innovation (40%)"
                        onChange={(e) => {
                          const newCrit = [...(editingEvent.judgingCriteria || [])];
                          newCrit[cIdx] = e.target.value;
                          setEditingEvent({ ...editingEvent, judgingCriteria: newCrit });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newCrit = (editingEvent.judgingCriteria || []).filter((_, i) => i !== cIdx);
                          setEditingEvent({ ...editingEvent, judgingCriteria: newCrit });
                        }}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: WHATSAPP GROUP & COMMUNICATION */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block border-l-2 border-emerald-500 pl-2">
                  5. Participant Community WhatsApp Link
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">WhatsApp Invite URL</label>
                    <input
                      type="url"
                      placeholder="https://chat.whatsapp.com/..."
                      value={editingEvent.whatsappGroupLink || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, whatsappGroupLink: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Visibility Policy</label>
                    <select
                      value={editingEvent.whatsappVisibility}
                      onChange={(e) => setEditingEvent({ ...editingEvent, whatsappVisibility: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="after_submission">Visible immediately after registration submission</option>
                      <option value="after_confirmation">Visible only after payment verified & confirmed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes to Live Website</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Competition */}
      {isCreatingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b1126] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase font-bold">
                  PORTAL CONFIGURATION
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-0.5">
                  Add New Competition
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingEvent(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Competition Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Prompt Verse"
                    value={newEventForm.name || ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Zone Track *</label>
                  <select
                    value={newEventForm.zoneId}
                    onChange={(e) => setNewEventForm({ ...newEventForm, zoneId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="zone-a">ZONE A: CODE-ZONE</option>
                    <option value="zone-b">ZONE B: FUN-ZONE</option>
                    <option value="zone-c">ZONE C: FIN-TECH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Registration Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newEventForm.registrationFee}
                    onChange={(e) => setNewEventForm({ ...newEventForm, registrationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Min Squad Size</label>
                  <input
                    type="number"
                    min="1"
                    value={newEventForm.minTeamSize}
                    onChange={(e) => setNewEventForm({ ...newEventForm, minTeamSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Max Squad Size</label>
                  <input
                    type="number"
                    min="1"
                    value={newEventForm.maxTeamSize}
                    onChange={(e) => setNewEventForm({ ...newEventForm, maxTeamSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Short Catchy Description</label>
                <input
                  type="text"
                  placeholder="e.g. Rapid-fire generative AI prompt engineering challenges."
                  value={newEventForm.shortDescription || ''}
                  onChange={(e) => setNewEventForm({ ...newEventForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Competition Details</label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive event details, format, and structure."
                  value={newEventForm.fullDescription || ''}
                  onChange={(e) => setNewEventForm({ ...newEventForm, fullDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">WhatsApp Group Invite URL</label>
                  <input
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    value={newEventForm.whatsappGroupLink || ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, whatsappGroupLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Eligibility</label>
                  <input
                    type="text"
                    value={newEventForm.eligibility || ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, eligibility: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingEvent(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish New Competition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Team Member */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span>Edit Organizer Profile</span>
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Official Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="organizer@nmims.edu"
                    value={editingMember.email || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Biography & Responsibilities
                </label>
                <textarea
                  rows={3}
                  value={editingMember.bio}
                  onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  LinkedIn / Social Profile URL
                </label>
                <input
                  type="url"
                  value={editingMember.socialLink}
                  onChange={(e) => setEditingMember({ ...editingMember, socialLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block font-semibold text-slate-300 uppercase tracking-wider">
                  Organizer Profile Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 shadow-md">
                    {editingMember.photoUrl ? (
                      <img src={editingMember.photoUrl} alt="Photo preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Photo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_SIZE = 400;
                                let width = img.width;
                                let height = img.height;
                                if (width > height) {
                                  if (width > MAX_SIZE) {
                                    height = Math.round(height * (MAX_SIZE / width));
                                    width = MAX_SIZE;
                                  }
                                } else {
                                  if (height > MAX_SIZE) {
                                    width = Math.round(width * (MAX_SIZE / height));
                                    height = MAX_SIZE;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  setEditingMember({ ...editingMember, photoUrl: canvas.toDataURL('image/jpeg', 0.85) });
                                } else {
                                  setEditingMember({ ...editingMember, photoUrl: event.target?.result as string });
                                }
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste Image URL / Data URI..."
                      value={editingMember.photoUrl}
                      onChange={(e) => setEditingMember({ ...editingMember, photoUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-lg"
                >
                  Save Organizer Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Team Member */}
      {isCreatingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
            <button
              type="button"
              onClick={() => setIsCreatingMember(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Add New Organizing Member</span>
            </h3>

            <form onSubmit={handleCreateMemberSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Roy"
                    value={newMemberData.name || ''}
                    onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technical Coordinator"
                    value={newMemberData.role || ''}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="ananya@nmims.edu"
                    value={newMemberData.email || ''}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={newMemberData.phone || ''}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Biography
                </label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities and domain background..."
                  value={newMemberData.bio || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  LinkedIn / Social Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={newMemberData.socialLink || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, socialLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block font-semibold text-slate-300 uppercase tracking-wider">
                  Organizer Profile Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 shadow-md">
                    {newMemberData.photoUrl ? (
                      <img src={newMemberData.photoUrl} alt="Photo preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Photo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_SIZE = 400;
                                let width = img.width;
                                let height = img.height;
                                if (width > height) {
                                  if (width > MAX_SIZE) {
                                    height = Math.round(height * (MAX_SIZE / width));
                                    width = MAX_SIZE;
                                  }
                                } else {
                                  if (height > MAX_SIZE) {
                                    width = Math.round(width * (MAX_SIZE / height));
                                    height = MAX_SIZE;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  setNewMemberData({ ...newMemberData, photoUrl: canvas.toDataURL('image/jpeg', 0.85) });
                                } else {
                                  setNewMemberData({ ...newMemberData, photoUrl: event.target?.result as string });
                                }
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste Image URL..."
                      value={newMemberData.photoUrl || ''}
                      onChange={(e) => setNewMemberData({ ...newMemberData, photoUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingMember(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Organizer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Email HTML Preview */}
      {previewingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 flex flex-col text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase">Email Preview</span>
                <h4 className="text-sm font-bold text-white">{previewingEmail.subject}</h4>
                <p className="text-[11px] text-slate-400">To: {previewingEmail.to}</p>
              </div>
              <button
                onClick={() => setPreviewingEmail(null)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-black p-2 border border-slate-800">
              <iframe
                title="Email Preview"
                srcDoc={previewingEmail.htmlBody}
                className="w-full h-[480px] rounded border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Admin Edit & View Ticket Pass */}
      {editingTicketReg && (
        <DelegationTicketModal
          registration={editingTicketReg}
          events={events}
          settings={settings}
          isAdmin={true}
          onClose={() => setEditingTicketReg(null)}
          onUpdated={() => {
            loadAllData();
            onRefreshConfig();
          }}
        />
      )}
    </div>
  );
};
