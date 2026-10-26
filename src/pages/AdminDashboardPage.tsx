import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Registration, 
  CompetitionEvent, 
  CompetitionZone, 
  GlobalSettings, 
  OrganizingTeamMember, 
  EmailLog, 
  AuditLog 
} from '../types.ts';
import { api } from '../lib/api.ts';
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
  ChevronRight
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

  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'events' | 'settings' | 'team' | 'emails' | 'audit'>('overview');
  
  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<CompetitionEvent[]>(initialEvents);
  const [teamList, setTeamList] = useState<OrganizingTeamMember[]>(initialTeamMembers);
  const [settings, setSettings] = useState<GlobalSettings>(initialSettings);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
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

  // Email preview modal
  const [previewingEmail, setPreviewingEmail] = useState<EmailLog | null>(null);

  // Editing event modal
  const [editingEvent, setEditingEvent] = useState<CompetitionEvent | null>(null);

  // Editing team member modal
  const [editingMember, setEditingMember] = useState<OrganizingTeamMember | null>(null);

  // QR Code upload
  const [qrFileBase64, setQrFileBase64] = useState<string>('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, regsRes, emailsRes, auditsRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminRegistrations({
          zone: filterZone,
          event: filterEvent,
          paymentStatus: filterPayment,
          regStatus: filterRegStatus,
          search: searchQuery
        }),
        api.getAdminEmails(),
        api.getAdminAuditLogs()
      ]);

      setOverview(overviewRes);
      setRegistrations(regsRes.registrations);
      setEmailLogs(emailsRes.emails);
      setAuditLogs(auditsRes.auditLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filterZone, filterEvent, filterPayment, filterRegStatus, searchQuery]);

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

  // Handle Save Event Config
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      await api.updateEvent(editingEvent.id, editingEvent);
      setEditingEvent(null);
      onRefreshConfig();
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update event configuration');
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
                    <th className="p-4">Event</th>
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
                        <td className="p-4 font-semibold text-white">{r.eventName}</td>
                        <td className="p-4">
                          <p className="font-semibold text-white">{r.teamName}</p>
                          <p className="text-[11px] text-slate-400">{r.teamLeaderName} ({r.teamLeaderEmail})</p>
                        </td>
                        <td className="p-4 text-slate-400 max-w-[150px] truncate">{r.college}</td>
                        <td className="p-4 text-slate-300 tabular-nums">
                          {r.teamMembers.length + 1} members
                        </td>
                        <td className="p-4 text-cyan-300 tabular-nums">₹{r.registrationFee}</td>
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
                          <button
                            onClick={() => {
                              setReviewingReg(r);
                              setRejectionReason(r.rejectionReason || '');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
                          >
                            Review & Details
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

      {/* TAB 3: COMPETITIONS & FEES CONFIGURATION */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              Configure entry fees, team-size minimums & maximums, WhatsApp invite URLs, and registration open/closed states.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{ev.zoneName}</span>
                    <h3 className="text-xl font-bold font-display text-white">{ev.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${ev.isOpen ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                    {ev.isOpen ? 'ACTIVE' : 'LOCKED'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Fee</span>
                    <span className="font-bold text-cyan-300">₹{ev.registrationFee}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Team Limits</span>
                    <span className="font-bold text-white">{ev.minTeamSize}-{ev.maxTeamSize}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Deadline</span>
                    <span className="font-medium text-slate-300 truncate block">
                      {new Date(ev.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 block mb-1">WhatsApp Group URL:</span>
                  <p className="font-mono text-slate-300 truncate">
                    {ev.whatsappGroupLink || 'Not provided yet'}
                  </p>
                  <span className="text-[10px] text-cyan-400 block mt-1">
                    Visibility: {ev.whatsappVisibility === 'after_submission' ? 'Visible immediately upon registration' : 'Visible only after payment verified'}
                  </span>
                </div>

                <button
                  onClick={() => setEditingEvent({ ...ev })}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Event Parameters</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <p className="text-xs text-slate-400">
            Configure official responsibilities, biographies, photographs, and LinkedIn profiles for the six organizers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamList.map((m) => (
              <div
                key={m.id}
                className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{m.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-white truncate">{m.name}</h4>
                    <p className="text-xs font-mono text-cyan-400 truncate">{m.role}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {m.bio}
                </p>

                <button
                  onClick={() => setEditingMember({ ...m })}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Profile & Photo</span>
                </button>
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
              <span className="text-xs font-mono text-cyan-400 uppercase">
                PAYMENT AUDIT & VERIFICATION
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-0.5">
                {reviewingReg.eventName} — {reviewingReg.teamName}
              </h3>
              <p className="text-xs text-slate-400">Registration ID: {reviewingReg.id}</p>
            </div>

            {/* Delegation Data Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-4">
              <div>
                <span className="text-slate-500 block">Leader:</span>
                <span className="text-white font-medium">{reviewingReg.teamLeaderName}</span>
                <span className="block text-slate-400">{reviewingReg.teamLeaderEmail}</span>
                <span className="block text-slate-400">{reviewingReg.teamLeaderPhone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">College:</span>
                <span className="text-white font-medium">{reviewingReg.college}</span>
                <span className="text-slate-500 block mt-2">Registration Fee:</span>
                <span className="text-cyan-300 font-bold text-sm">₹{reviewingReg.registrationFee}</span>
              </div>
            </div>

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

            {/* Decision Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => setReviewingReg(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePaymentReview(false)}
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Payment</span>
                </button>
                <button
                  onClick={() => handlePaymentReview(true)}
                  disabled={reviewSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-white transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Event Parameters */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
            <h3 className="text-xl font-bold font-display text-white mb-4">
              Configure {editingEvent.name}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Registration Fee (₹)</label>
                  <input
                    type="number"
                    value={editingEvent.registrationFee}
                    onChange={(e) => setEditingEvent({ ...editingEvent, registrationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Portal Registration Status</label>
                  <select
                    value={editingEvent.isOpen ? 'open' : 'closed'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, isOpen: e.target.value === 'open' })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="open">Open for Submissions</option>
                    <option value="closed">Closed / Locked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Min Squad Members</label>
                  <input
                    type="number"
                    min="1"
                    value={editingEvent.minTeamSize}
                    onChange={(e) => setEditingEvent({ ...editingEvent, minTeamSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Squad Members</label>
                  <input
                    type="number"
                    min="1"
                    value={editingEvent.maxTeamSize}
                    onChange={(e) => setEditingEvent({ ...editingEvent, maxTeamSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">WhatsApp Group Invite Link</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={editingEvent.whatsappGroupLink || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, whatsappGroupLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">WhatsApp Visibility Policy</label>
                <select
                  value={editingEvent.whatsappVisibility}
                  onChange={(e) => setEditingEvent({ ...editingEvent, whatsappVisibility: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="after_submission">Visible immediately after registration submission</option>
                  <option value="after_confirmation">Visible only after payment verification and confirmation</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Team Member */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0b1126] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100">
            <h3 className="text-xl font-bold font-display text-white mb-4">
              Edit Organizer Profile: {editingMember.name}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Organizer Role</label>
                <input
                  type="text"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Short Biography</label>
                <textarea
                  rows={3}
                  value={editingMember.bio}
                  onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">LinkedIn / Social URL</label>
                <input
                  type="url"
                  value={editingMember.socialLink}
                  onChange={(e) => setEditingMember({ ...editingMember, socialLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Profile Photo (Image URL or Data URI)</label>
                <input
                  type="text"
                  placeholder="https://... or data:image/..."
                  value={editingMember.photoUrl}
                  onChange={(e) => setEditingMember({ ...editingMember, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  Update Profile
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
    </div>
  );
};
