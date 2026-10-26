import React, { useState } from 'react';
import { CompetitionEvent, GlobalSettings } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  FileText, 
  Scale, 
  Cpu, 
  MessageCircle, 
  ArrowLeft, 
  HelpCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface EventDetailPageProps {
  event: CompetitionEvent;
  settings: GlobalSettings;
  onBack: () => void;
  onRegister: () => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  event,
  settings,
  onBack,
  onRegister
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'judging'>('overview');

  const formattedDeadline = new Date(event.registrationDeadline).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Competitions</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0c132c] via-[#091026] to-[#050713] border border-cyan-500/25 p-6 sm:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
          <span>{event.zoneName}</span>
          <span aria-hidden="true">&bull;</span>
          <span>PLANET-X 2026</span>
          <span aria-hidden="true">&bull;</span>
          <span className={event.isOpen ? 'text-emerald-400' : 'text-rose-400'}>
            {event.isOpen ? 'Registration Open' : 'Registration Closed'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-display text-white uppercase tracking-tight mb-3">
          {event.name}
        </h1>

        <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl mb-8">
          {event.fullDescription}
        </p>

        {/* Quick Spec Pills / Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Squad Limit</span>
            </span>
            <span className="text-sm font-bold text-white font-display">
              {event.minTeamSize === event.maxTeamSize ? `${event.minTeamSize} Member` : `${event.minTeamSize} to ${event.maxTeamSize} Members`}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Entry Fee</span>
            </span>
            <span className="text-sm font-bold text-cyan-300 font-display">
              ₹{event.registrationFee}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deadline</span>
            </span>
            <span className="text-xs font-semibold text-white truncate block">
              {formattedDeadline}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center">
            <button
              onClick={onRegister}
              disabled={!event.isOpen}
              className="w-full h-full py-2 px-3 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-40 transition-all text-center"
            >
              Register Squad
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Content Tabs + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details Tabs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Segmented Tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Objectives & Tech
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rules' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rules & Eligibility
            </button>
            <button
              onClick={() => setActiveTab('judging')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'judging' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Judging Criteria
            </button>
          </div>

          {/* TAB 1: OBJECTIVES & TECH */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Competition Objectives</span>
                </h3>
                <ul className="space-y-2.5">
                  {event.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {event.allowedTech && event.allowedTech.length > 0 && (
                <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4">
                  <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-violet-400" />
                    <span>Permitted Stacks & Tooling</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {event.allowedTech.map((tech, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RULES & ELIGIBILITY */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Official Rules & Conduct</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {event.rules.map((rule, i) => (
                    <li key={i} className="pl-1">
                      <span>{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-3">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Eligibility Criteria</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {event.eligibility}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: JUDGING CRITERIA */}
          {activeTab === 'judging' && (
            <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span>Evaluation Rubric</span>
              </h3>
              <p className="text-xs text-slate-400">
                Submissions are graded independently by our panel of academic jury and industry technical experts.
              </p>
              <div className="space-y-3 pt-2">
                {event.judgingCriteria.map((crit, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-200"
                  >
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: WhatsApp Group Access & Payment Instructions */}
        <div className="lg:col-span-4 space-y-6">
          {/* WhatsApp Group Section (Prompt Section 9) */}
          <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase">
              <MessageCircle className="w-4 h-4" />
              <span>Official WhatsApp Access</span>
            </div>
            <h3 className="text-base font-bold font-display text-white">
              Competition Community
            </h3>

            {event.whatsappGroupLink ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  {event.whatsappVisibility === 'after_submission'
                    ? 'Join the official coordination group for announcements, mentors, and round alerts:'
                    : 'Group link is visible after registration submission and payment confirmation.'}
                </p>
                <a
                  href={event.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Join WhatsApp Group</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-center">
                <span className="text-xs font-mono font-semibold text-slate-400 block">
                  WHATSAPP GROUP LINK WILL BE SHARED SOON.
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  The event coordinators are setting up the official channel. Registered participants will receive the link in their dashboard and confirmation email.
                </p>
              </div>
            )}
          </div>

          {/* Payment Instructions Box */}
          <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-3">
            <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-300">
              Payment Instructions
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {settings.paymentInstructions}
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 block">Official UPI ID:</span>
              <code className="text-cyan-300 font-mono font-semibold">{settings.upiId}</code>
            </div>
          </div>

          {/* Registration CTA card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 text-center space-y-3">
            <h4 className="text-base font-bold font-display text-white">
              Ready to Compete?
            </h4>
            <p className="text-xs text-slate-300">
              {user ? 'Click below to register your team roster.' : 'Sign in to your participant account to register.'}
            </p>
            <button
              onClick={onRegister}
              disabled={!event.isOpen}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-40 transition-all shadow-lg"
            >
              {event.isOpen ? 'Register for This Competition' : 'Registrations Closed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
