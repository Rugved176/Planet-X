import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CompetitionEvent, Registration } from '../types.ts';
import { api } from '../lib/api.ts';
import confetti from 'canvas-confetti';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface RegistrationModalProps {
  event: CompetitionEvent;
  onClose: () => void;
  onSuccess: (reg: Registration) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ event, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [teamName, setTeamName] = useState('');
  const [teamLeaderName, setTeamLeaderName] = useState(user?.name || '');
  const [teamLeaderPhone, setTeamLeaderPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  
  // Team members list (Leader is always member 1, so additional members array can have up to maxTeamSize - 1)
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; email: string; phone: string; role: string }>>([]);
  const [additionalInfo, setAdditionalInfo] = useState<Record<string, string>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedReg, setCompletedReg] = useState<Registration | null>(null);

  const totalSquadCount = teamMembers.length + 1;
  const canAddMoreMembers = totalSquadCount < event.maxTeamSize;
  const meetsMinRequirement = totalSquadCount >= event.minTeamSize;

  const handleAddMember = () => {
    if (!canAddMoreMembers) return;
    setTeamMembers([
      ...teamMembers,
      { name: '', email: '', phone: '', role: `Squad Member ${teamMembers.length + 1}` }
    ]);
  };

  const handleRemoveMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setAdditionalInfo({
      ...additionalInfo,
      [fieldId]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamName.trim()) {
      setError('Please provide a Team Name.');
      return;
    }

    if (!teamLeaderPhone.trim()) {
      setError('Please provide a valid contact phone number.');
      return;
    }

    if (!college.trim()) {
      setError('Please provide your College or Institution name.');
      return;
    }

    if (!meetsMinRequirement) {
      setError(`This competition requires at least ${event.minTeamSize} team member(s) (including leader). Please add more members.`);
      return;
    }

    // Validate members if added
    for (let i = 0; i < teamMembers.length; i++) {
      if (!teamMembers[i].name.trim() || !teamMembers[i].email.trim()) {
        setError(`Please fill in Name and Email for Team Member #${i + 1}.`);
        return;
      }
    }

    // Validate required custom fields
    if (event.customFields) {
      for (const f of event.customFields) {
        if (f.required && !additionalInfo[f.id]?.trim()) {
          setError(`Please provide: ${f.label}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await api.submitRegistration({
        eventId: event.id,
        teamName,
        teamLeaderName,
        teamLeaderPhone,
        college,
        teamMembers,
        additionalInfo
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      setCompletedReg(res.registration);
      onSuccess(res.registration);
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0b1126] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {completedReg ? (
          /* SUCCESS CONFIRMATION STATE */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">REGISTRATION SUCCESSFUL</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">
              Welcome to {event.name}!
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
              Your registration has been securely logged into the database. A confirmation email has been dispatched.
            </p>

            {/* Registration ID Banner */}
            <div className="my-6 p-4 rounded-xl bg-slate-950 border border-cyan-500/30 max-w-md mx-auto">
              <span className="text-xs text-slate-400 uppercase font-mono block">Your Unique Registration ID</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-wider">
                {completedReg.id}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 max-w-md mx-auto text-left space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Team:</span>
                <span className="font-semibold text-white">{completedReg.teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Squad:</span>
                <span className="font-semibold text-white">{completedReg.teamMembers.length + 1} Members</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fee:</span>
                <span className="font-semibold text-cyan-300">₹{completedReg.registrationFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-amber-300 capitalize">{completedReg.registrationStatus}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-lg"
            >
              Go to Participant Dashboard &rarr;
            </button>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div>
            <div className="mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <span>{event.zoneName}</span>
                <span>/</span>
                <span>Team Size: {event.minTeamSize}-{event.maxTeamSize}</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-white mt-1">
                Register for {event.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your delegation details. You can add up to {event.maxTeamSize - 1} additional squad members.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Team Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberVanguard, QuantumBytes"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                />
              </div>

              {/* Team Leader Details (Auto-filled) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                  Team Leader (Primary Contact)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={teamLeaderName}
                      onChange={(e) => setTeamLeaderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Registered Email</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={teamLeaderPhone}
                      onChange={(e) => setTeamLeaderPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">College / Institute *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SVKM's NMIMS Dhule"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Team Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Squad Members ({totalSquadCount} / {event.maxTeamSize})
                    </span>
                    {!meetsMinRequirement && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/80">
                        Min {event.minTeamSize} required
                      </span>
                    )}
                  </div>
                  {canAddMoreMembers && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Member</span>
                    </button>
                  )}
                </div>

                {teamMembers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    Solo leader configuration. {event.maxTeamSize > 1 ? `Click "+ Add Member" to add up to ${event.maxTeamSize - 1} squad members.` : 'This is an individual competition.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-cyan-300">Member #{idx + 2}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Full Name *"
                            value={member.name}
                            onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="email"
                            required
                            placeholder="Email Address *"
                            value={member.email}
                            onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Event Fields */}
              {event.customFields && event.customFields.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                    Event-Specific Requirements
                  </span>
                  {event.customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {field.label} {field.required && '*'}
                      </label>
                      <input
                        type="text"
                        required={field.required}
                        placeholder={field.placeholder}
                        value={additionalInfo[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Fee & Submission Summary */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Registration Fee</span>
                  <span className="text-xl font-bold font-display text-cyan-300">₹{event.registrationFee}</span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Payment verification available</span>
                  <span className="block text-slate-500">via UPI & QR in next step</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-lg"
                >
                  {submitting ? 'Submitting Registration...' : 'Complete Registration'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
