import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Registration, CompetitionEvent, CompetitionZone, GlobalSettings } from '../types.ts';
import { api } from '../lib/api.ts';
import { PaymentProofModal } from '../components/PaymentProofModal.tsx';
import { DelegationTicketModal } from '../components/DelegationTicketModal.tsx';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  Edit3, 
  Save, 
  Upload, 
  MessageCircle, 
  ExternalLink, 
  Calendar, 
  Clock, 
  FileCheck, 
  AlertCircle,
  CheckCircle2,
  Printer,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  settings: GlobalSettings;
  zones: CompetitionZone[];
  events: CompetitionEvent[];
  onNavigate: (page: string, param?: string) => void;
  onRegisterEvent: (event: CompetitionEvent) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  settings,
  zones,
  events,
  onNavigate,
  onRegisterEvent
}) => {
  const { user, updateProfile, logout } = useAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCollege, setEditCollege] = useState(user?.college || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Selected registration for payment modal
  const [selectedRegForPayment, setSelectedRegForPayment] = useState<Registration | null>(null);

  // Pass preview modal
  const [viewingPass, setViewingPass] = useState<Registration | null>(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.getMyRegistrations();
      setRegistrations(res.registrations);
    } catch (err: any) {
      setError(err.message || 'Failed to load your registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      await updateProfile({ name: editName, phone: editPhone, college: editCollege });
      setIsEditingProfile(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Confirmed
          </span>
        );
      case 'under_verification':
        return (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Under Verification
          </span>
        );
      case 'submitted':
        return (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Submitted
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
            Rejected
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Verified & Paid
          </span>
        );
      case 'pending_verification':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Action Required
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Profile Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c132c] via-[#091026] to-[#050713] border border-cyan-500/25 p-6 sm:p-8 mb-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                  PARTICIPANT PROFILE
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Email Verified
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white mt-0.5">
                {user?.name}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <span>{user?.college}</span>
                <span aria-hidden="true">&bull;</span>
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-900/60 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Editing Drawer */}
        {isEditingProfile && (
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">College / Institute</label>
              <input
                type="text"
                value={editCollege}
                onChange={(e) => setEditCollege(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="px-5 py-2 rounded-lg text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: MY REGISTRATIONS */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white uppercase tracking-tight">
              My Registrations ({registrations.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track team roster, payment review status, delegation badges, and WhatsApp community links.
            </p>
          </div>
          <button
            onClick={() => onNavigate('zones')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-md"
          >
            + Register New Competition
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
            Loading your delegations from the database...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#0b1126] border border-slate-800/80 text-center">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
              NO ACTIVE REGISTRATIONS FOUND
            </span>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-5">
              You haven't registered for any competitions yet. Explore CODE-ZONE, FUN-ZONE, and FIN-TECH to join the tournament.
            </p>
            <button
              onClick={() => onNavigate('zones')}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
            >
              Explore Competitions Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="rounded-2xl bg-[#0b1126] border border-slate-800/90 hover:border-slate-700 p-6 transition-all"
              >
                {/* Registration Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black font-mono text-cyan-300 tracking-wider">
                      {reg.id}
                    </span>
                    <span className="text-xs font-bold text-white uppercase tracking-tight">
                      {reg.eventName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      ({reg.zoneId.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(reg.registrationStatus)}
                    {getPaymentBadge(reg.paymentStatus)}
                  </div>
                </div>

                {/* Team & Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs mb-4">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Team Details
                    </span>
                    <p className="font-semibold text-white text-sm">{reg.teamName}</p>
                    <p className="text-slate-400 mt-1">Leader: {reg.teamLeaderName}</p>
                    <p className="text-slate-400">{reg.college}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Squad Roster ({reg.teamMembers.length + 1})
                    </span>
                    <ul className="space-y-1 text-slate-300">
                      <li className="truncate">
                        &bull; <strong>{reg.teamLeaderName}</strong> (Leader)
                      </li>
                      {reg.teamMembers.map((m, idx) => (
                        <li key={idx} className="truncate text-slate-400">
                          &bull; {m.name} ({m.email})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">
                      Payment & Submission
                    </span>
                    <div className="space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fee:</span>
                        <span className="font-semibold text-cyan-300">₹{reg.registrationFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">UTR / Ref:</span>
                        <code className="text-slate-200 font-mono text-[11px]">
                          {reg.paymentReference || 'Not provided yet'}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Logged:</span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(reg.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection Alert notice if applicable */}
                {reg.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span><strong>Committee Note:</strong> {reg.rejectionReason}</span>
                  </div>
                )}

                {/* Registration Action Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Payment Proof Button */}
                    <button
                      onClick={() => setSelectedRegForPayment(reg)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{reg.paymentProofUrl ? 'Re-upload Payment Proof' : 'Upload Payment Proof'}</span>
                    </button>

                    {/* View Delegation Pass */}
                    <button
                      onClick={() => setViewingPass(reg)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>Delegation Pass</span>
                    </button>
                  </div>

                  {/* WhatsApp Group Link based on Admin Visibility rule */}
                  {reg.whatsappLink ? (
                    <a
                      href={reg.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] transition-colors flex items-center gap-1.5 shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Join {reg.eventName} WhatsApp Group</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>WhatsApp group link will unlock upon payment confirmation</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: BROWSE OTHER AVAILABLE COMPETITIONS */}
      <div>
        <h2 className="text-lg font-bold font-display text-white uppercase tracking-tight mb-4">
          All Available Competitions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-[#0b1126] border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">
                  {ev.zoneName}
                </span>
                <h3 className="text-sm font-bold text-white">{ev.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {ev.shortDescription}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300">₹{ev.registrationFee}</span>
                <button
                  onClick={() => onRegisterEvent(ev)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <span>Register</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Proof Upload Modal */}
      {selectedRegForPayment && (
        <PaymentProofModal
          registration={selectedRegForPayment}
          settings={settings}
          onClose={() => setSelectedRegForPayment(null)}
          onSuccess={(updated) => {
            setRegistrations(registrations.map(r => r.id === updated.id ? updated : r));
            setSelectedRegForPayment(null);
          }}
        />
      )}

      {/* Delegation Pass Ticket Modal */}
      {viewingPass && (
        <DelegationTicketModal
          registration={viewingPass}
          events={events}
          settings={settings}
          isAdmin={false}
          onClose={() => setViewingPass(null)}
          onUpdated={fetchRegistrations}
        />
      )}
    </div>
  );
};
