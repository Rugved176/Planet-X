import React, { useState } from 'react';
import { Registration, CompetitionEvent, GlobalSettings } from '../types.ts';
import { api } from '../lib/api.ts';
import { generateTeamDossierPdf, getZoneLabel } from '../lib/pdfGenerator.ts';
import { 
  X, 
  Ticket, 
  Download, 
  Send, 
  Edit3, 
  Save, 
  Users, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  QrCode, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface DelegationTicketModalProps {
  registration: Registration;
  events?: CompetitionEvent[];
  settings?: GlobalSettings;
  isAdmin?: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const DelegationTicketModal: React.FC<DelegationTicketModalProps> = ({
  registration: initialReg,
  events = [],
  settings,
  isAdmin = false,
  onClose,
  onUpdated
}) => {
  const [reg, setReg] = useState<Registration>(initialReg);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    teamName: initialReg.teamName,
    teamLeaderName: initialReg.teamLeaderName,
    teamLeaderEmail: initialReg.teamLeaderEmail,
    teamLeaderPhone: initialReg.teamLeaderPhone,
    college: initialReg.college,
    registrationFee: initialReg.registrationFee,
    paymentStatus: initialReg.paymentStatus,
    registrationStatus: initialReg.registrationStatus,
    paymentReference: initialReg.paymentReference || '',
    rejectionReason: initialReg.rejectionReason || '',
    teamMembers: [...(initialReg.teamMembers || [])],
    resendTicketEmail: true
  });

  const matchedEvent = events.find(e => e.id === reg.eventId || e.slug === reg.eventId);

  const handleDownloadPdf = async () => {
    try {
      await generateTeamDossierPdf(reg, matchedEvent, [], settings);
    } catch (err: any) {
      alert(err.message || 'Failed to generate PDF pass');
    }
  };

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      setActionNotice('Dispatching official ticket pass email to leader and squad members...');
      if (isAdmin) {
        await api.resendRegistrationTicketAdmin(reg.id);
      } else {
        await api.resendRegistrationTicket(reg.id);
      }
      setActionNotice('Official Delegation Pass Email successfully sent to team leader and squad members!');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch ticket pass email');
      setActionNotice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTicketEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.updateRegistrationTicketPass(reg.id, editForm);
      if (res.success && res.registration) {
        setReg(res.registration);
        setIsEditing(false);
        setActionNotice('Ticket pass details updated & persisted successfully!');
        setTimeout(() => setActionNotice(null), 3000);
        if (onUpdated) onUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update registration ticket pass');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...editForm.teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, teamMembers: updated });
  };

  const handleAddMember = () => {
    setEditForm({
      ...editForm,
      teamMembers: [
        ...editForm.teamMembers,
        { name: '', email: '', phone: '', college: editForm.college, role: 'Member' }
      ]
    });
  };

  const handleRemoveMember = (index: number) => {
    const updated = editForm.teamMembers.filter((_, idx) => idx !== index);
    setEditForm({ ...editForm, teamMembers: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-[#080d20] border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-slate-100 overflow-hidden">
        
        {/* Top Cyber Banner Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-6 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  PLANET-X 2026 DELEGATION PASS
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  reg.registrationStatus === 'confirmed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : reg.registrationStatus === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {reg.registrationStatus.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight mt-0.5">
                {reg.eventName} Pass
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Ticket</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="px-6 py-3 bg-cyan-950/80 border-b border-cyan-800/60 text-cyan-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 animate-pulse" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* ADMIN EDIT TICKET FORM */}
        {isAdmin && isEditing ? (
          <form onSubmit={handleSaveTicketEdits} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>Edit Delegation Ticket Pass Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Cancel Editing
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Team / Delegation Name
                </label>
                <input
                  type="text"
                  value={editForm.teamName}
                  onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  College / Institute
                </label>
                <input
                  type="text"
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Team Leader Name
                </label>
                <input
                  type="text"
                  value={editForm.teamLeaderName}
                  onChange={(e) => setEditForm({ ...editForm, teamLeaderName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Team Leader Email
                </label>
                <input
                  type="email"
                  value={editForm.teamLeaderEmail}
                  onChange={(e) => setEditForm({ ...editForm, teamLeaderEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Team Leader Phone
                </label>
                <input
                  type="text"
                  value={editForm.teamLeaderPhone}
                  onChange={(e) => setEditForm({ ...editForm, teamLeaderPhone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Registration Fee (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.registrationFee}
                  onChange={(e) => setEditForm({ ...editForm, registrationFee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Payment Verification Status
                </label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="verified">Verified (Approved)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Registration Overall Status
                </label>
                <select
                  value={editForm.registrationStatus}
                  onChange={(e) => setEditForm({ ...editForm, registrationStatus: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_verification">Under Verification</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Payment Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={editForm.paymentReference}
                  onChange={(e) => setEditForm({ ...editForm, paymentReference: e.target.value })}
                  placeholder="e.g. 997595257912 or UTR-12345678"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              {editForm.paymentStatus === 'rejected' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-rose-400 mb-1">
                    Rejection / Correction Reason
                  </label>
                  <input
                    type="text"
                    value={editForm.rejectionReason}
                    onChange={(e) => setEditForm({ ...editForm, rejectionReason: e.target.value })}
                    placeholder="e.g. Transaction receipt illegible or incorrect UTR reference"
                    className="w-full px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs outline-none"
                  />
                </div>
              )}
            </div>

            {/* Squad Members Editor */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Squad Members ({editForm.teamMembers.length})</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="space-y-3">
                {editForm.teamMembers.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={m.name}
                      onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Member Email"
                      value={m.email || ''}
                      onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Member Phone"
                      value={m.phone || ''}
                      onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Role"
                        value={m.role || 'Member'}
                        onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="resendTicketEmail"
                checked={editForm.resendTicketEmail}
                onChange={(e) => setEditForm({ ...editForm, resendTicketEmail: e.target.checked })}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="resendTicketEmail" className="text-xs text-slate-300">
                Send/Resend updated Delegation Pass email to Team Leader & Squad Members automatically
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-yellow-300 hover:to-amber-300 flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving Ticket...' : 'Save & Publish Ticket Updates'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* DIGITAL PASS DISPLAY CARD */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Visual Futuristic Delegation Pass Card */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#0e1738] via-[#090e24] to-[#040614] border-2 border-cyan-500/50 p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                    OFFICIAL ENTRY PASS
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-wider">
                    {reg.id}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 flex flex-col items-center">
                    <QrCode className="w-10 h-10" />
                    <span className="text-[8px] font-mono text-slate-500 mt-1">VERIFIED REG</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Competition Track</span>
                  <span className="font-bold text-white text-sm">{reg.eventName}</span>
                  <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">{getZoneLabel(reg.zoneId)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Team / Squad Name</span>
                  <span className="font-bold text-amber-300 text-sm">{reg.teamName}</span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{reg.college}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Team Leader</span>
                  <span className="font-bold text-white block">{reg.teamLeaderName}</span>
                  <span className="text-[11px] text-cyan-300 font-mono block">{reg.teamLeaderEmail}</span>
                  <span className="text-[11px] text-slate-400 font-mono block">{reg.teamLeaderPhone}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Fee & Payment UTR</span>
                  <span className="font-bold text-emerald-400 text-sm block">₹{reg.registrationFee}</span>
                  <span className="text-[10px] font-mono text-slate-300 block truncate">
                    Ref: {reg.paymentReference || 'Receipt Uploaded'}
                  </span>
                </div>
              </div>

              {/* Roster Squad List */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-2">
                  Registered Squad Roster ({reg.teamMembers.length + 1} Total)
                </span>
                <div className="space-y-1.5">
                  <div className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{reg.teamLeaderName}</span>
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded">Leader</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{reg.teamLeaderEmail}</span>
                  </div>

                  {reg.teamMembers.map((m, idx) => (
                    <div key={idx} className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{m.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">({m.role || 'Member'})</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{m.email || m.phone || 'Registered'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pass Actions: Download PDF, Resend Email, View Slip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Pass</span>
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 border border-slate-700 hover:border-cyan-400 flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>{loading ? 'Sending...' : 'Resend Ticket Email to Squad'}</span>
                </button>
              </div>

              {reg.paymentProofUrl && (
                <a
                  href={reg.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Attached Receipt</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
