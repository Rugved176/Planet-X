import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CompetitionEvent, Registration } from '../types.ts';
import { api } from '../lib/api.ts';
import confetti from 'canvas-confetti';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, ArrowRight, Upload, Image as ImageIcon, FileCheck, Download, Smartphone } from 'lucide-react';
import { generateTeamDossierPdf } from '../lib/pdfGenerator.ts';
import { generateUpiPaymentUrl, generateUpiQrCodeUrl } from '../lib/payment.ts';

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
  
  // Mandatory Payment Proof state
  const [paymentProofBase64, setPaymentProofBase64] = useState<string>('');
  const [paymentProofFileName, setPaymentProofFileName] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');

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

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('File is too large. Please upload an image under 8MB.');
      return;
    }

    setPaymentProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
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

    // Mandatory payment proof and UTR reference for paid events
    if (event.registrationFee > 0) {
      if (!paymentProofBase64) {
        setError('Payment slip / screenshot is mandatory. Please scan the QR code and upload your payment proof.');
        return;
      }
      if (!paymentReference.trim()) {
        setError('Please enter your 12-digit UPI UTR / Transaction Reference ID.');
        return;
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
        additionalInfo,
        paymentProofBase64: paymentProofBase64 || undefined,
        paymentProofFileName: paymentProofFileName || undefined,
        paymentReference: paymentReference.trim() || undefined
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
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">REGISTRATION & PAYMENT LOGGED</span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
              Welcome to {event.name}!
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
              Your registration has been securely recorded. An official confirmation email with your ID and full squad details has been sent to <strong className="text-cyan-300">{completedReg.teamLeaderEmail}</strong> from <span className="text-cyan-300 font-mono">planetx.event@gmail.com</span>.
            </p>

            {/* Registration ID Banner */}
            <div className="my-5 p-4 rounded-xl bg-slate-950 border border-cyan-500/40 max-w-lg mx-auto shadow-inner">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">Your Official Registration ID</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-wider">
                {completedReg.id}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Keep this ID handy for entry and event desk check-in</span>
            </div>

            {/* Team & Delegation Details Box */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 max-w-lg mx-auto text-left space-y-2 mb-4">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Team Name:</span>
                <span className="font-semibold text-white">{completedReg.teamName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">College / Institute:</span>
                <span className="font-medium text-slate-200">{completedReg.college || "SVKM's NMIMS Global University"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Team Leader:</span>
                <span className="font-semibold text-cyan-300">{completedReg.teamLeaderName} ({completedReg.teamLeaderPhone})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Registration Fee:</span>
                <span className="font-semibold text-emerald-400">₹{completedReg.registrationFee} (Paid)</span>
              </div>
              {completedReg.paymentReference && (
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Payment UTR / Ref ID:</span>
                  <span className="font-mono text-slate-200">{completedReg.paymentReference}</span>
                </div>
              )}
              
              {/* Full Squad Roster List */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Registered Squad Roster ({completedReg.teamMembers.length + 1} Members):
                </span>
                <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white font-medium">1. {completedReg.teamLeaderName} <span className="text-cyan-400 text-[10px]">(Leader)</span></span>
                    <span className="text-slate-400 font-mono">{completedReg.teamLeaderEmail}</span>
                  </div>
                  {completedReg.teamMembers.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] border-t border-slate-800/40 pt-1">
                      <span className="text-slate-200">{idx + 2}. {m.name}</span>
                      <span className="text-slate-400 font-mono">{m.email || m.phone || 'Member'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Helpdesk Contacts Note */}
            <div className="text-[11px] text-slate-400 mb-6 max-w-lg mx-auto bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-left">
              <span className="font-semibold text-slate-300 block mb-1">Committee Helpdesk Contacts:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                <div>Rugved: <a href="tel:+919975952579" className="text-cyan-400 hover:underline">+91 9975952579</a></div>
                <div>Ved: <a href="tel:+918262058180" className="text-cyan-400 hover:underline">+91 8262058180</a></div>
                <div>Dakshal: <a href="tel:+918412820178" className="text-cyan-400 hover:underline">+91 8412820178</a></div>
                <div>Yash: <a href="tel:+918080156469" className="text-cyan-400 hover:underline">+91 8080156469</a></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  generateTeamDossierPdf({
                    id: completedReg.id,
                    eventId: event.id,
                    teamName: completedReg.teamName,
                    leaderName: completedReg.teamLeaderName,
                    leaderEmail: completedReg.teamLeaderEmail,
                    leaderPhone: completedReg.teamLeaderPhone,
                    college: completedReg.college,
                    members: completedReg.teamMembers,
                    paymentSlip: completedReg.paymentProofUrl || paymentProofBase64,
                    utrNumber: completedReg.paymentReference,
                    amount: completedReg.registrationFee,
                    status: 'PENDING VERIFICATION'
                  }, event);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Download Entry Dossier (PDF)
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
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

              {/* Fee & Mandatory Payment Submission Section */}
              {event.registrationFee > 0 ? (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block">
                        Mandatory Payment Step
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        Scan Official QR Code & Attach Payment Slip
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60">
                      Fee: ₹{event.registrationFee}
                    </span>
                  </div>

                  {/* Dynamic Event-Specific UPI QR Code Calculation */}
                  {(() => {
                    const upiPaymentUrl = generateUpiPaymentUrl('9975952579@fam', 'Rugved Solanki', event.registrationFee, event.name);
                    const dynamicQrUrl = generateUpiQrCodeUrl(upiPaymentUrl, 300);

                    return (
                      <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
                        <div className="shrink-0 text-center">
                          <img 
                            src={dynamicQrUrl} 
                            alt={`PLANET-X UPI QR for ${event.name} (₹${event.registrationFee})`} 
                            className="w-36 h-36 object-contain rounded-xl border border-cyan-500/40 bg-white p-1 shadow-md shadow-cyan-500/20"
                          />
                          <span className="text-[10px] text-cyan-300 font-mono block mt-1 font-semibold">
                            Amount Locked: ₹{event.registrationFee}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-left flex-1 w-full">
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Target Competition:</span>
                              <span className="font-bold text-cyan-300 uppercase">{event.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Payee Name:</span>
                              <span className="font-semibold text-white">Rugved Solanki</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">UPI ID:</span>
                              <span className="font-mono font-bold text-cyan-300 select-all">9975952579@fam</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Exact Payable Amount:</span>
                              <span className="font-mono font-bold text-emerald-400 text-sm">₹{event.registrationFee}</span>
                            </div>
                          </div>

                          <a
                            href={upiPaymentUrl}
                            className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>Pay Exact ₹{event.registrationFee} via GPay / PhonePe / Paytm</span>
                          </a>

                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Scanning this QR code automatically pre-fills and locks the exact entry fee (₹{event.registrationFee}) for {event.name}. Neither more nor less can be charged.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Slip Upload & UTR Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Upload */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Upload Payment Slip / Screenshot *
                      </label>
                      {paymentProofBase64 ? (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={paymentProofBase64} 
                              alt="Proof preview" 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-emerald-300 block truncate">
                                {paymentProofFileName || 'Slip Attached'}
                              </span>
                              <span className="text-[10px] text-slate-400">Ready to submit</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentProofBase64('');
                              setPaymentProofFileName('');
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 text-xs shrink-0"
                            title="Remove attachment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all text-center">
                          <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                          <span className="text-xs font-semibold text-cyan-300">Choose Slip / Screenshot</span>
                          <span className="text-[10px] text-slate-500">PNG, JPG, WebP up to 8MB</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleProofFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* UTR / Transaction Ref */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        12-Digit UTR / Transaction ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 4239XXXXXXXX or UPI Ref"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder:text-slate-600 font-mono"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Found in your bank receipt or UPI transaction details.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Registration Fee</span>
                    <span className="text-xl font-bold font-display text-emerald-400">Free / Open Entry</span>
                  </div>
                  <div className="text-right text-[11px] text-emerald-300">
                    <span>No payment required</span>
                  </div>
                </div>
              )}

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
