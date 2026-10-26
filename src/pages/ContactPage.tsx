import React, { useState } from 'react';
import { GlobalSettings } from '../types.ts';
import { api } from '../lib/api.ts';
import { Mail, Phone, MapPin, Calendar, Send, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface ContactPageProps {
  settings: GlobalSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message inquiry.');
      return;
    }

    setLoading(true);
    try {
      await api.submitContact({ name, email, subject, message });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactFaqs = [
    {
      q: 'How do I reach the NMIMS Dhule campus?',
      a: "SVKM's NMIMS Dhule is conveniently situated on the Mumbai-Agra National Highway. It is well-connected by road, rail (Dhule / Chalisgaon junction), and regional transit."
    },
    {
      q: 'Will accommodation or food be provided during the event?',
      a: 'Registered outstation participants receive accommodation assistance and meals on the event day. Details will be communicated through the official event WhatsApp channels.'
    },
    {
      q: 'Can I change my team members after registration?',
      a: 'Team roster edits are allowed until the registration deadline through the support desk or by contacting the event coordinator for your competition.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 block mb-2">
          GET IN TOUCH
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-display text-white uppercase tracking-tight">
          Contact Desk
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Have inquiries regarding registration, event rules, delegations, or sponsorship? Reach out to the PLANET-X organizing committee directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Campus Info & Venue Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-5">
            <h3 className="text-lg font-bold font-display text-white">
              Official Headquarters
            </h3>

            <div className="flex items-start gap-3 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block font-medium">Institution & Venue</span>
                <p className="font-semibold text-white mt-0.5">{settings.institution}</p>
                <p className="text-slate-400 mt-0.5">{settings.venue}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
              <Calendar className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block font-medium">Event Date</span>
                <p className="font-semibold text-white mt-0.5">
                  {settings.eventDate} {settings.isProvisionalDate ? '(Provisional Schedule)' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block font-medium">Official Email</span>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="font-mono text-cyan-300 hover:underline mt-0.5 block"
                >
                  {settings.contactEmail}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block font-medium">Helpdesk Hotline</span>
                <p className="font-mono text-slate-200 mt-0.5">{settings.contactPhone}</p>
              </div>
            </div>
          </div>

          {/* Quick FAQs */}
          <div className="p-6 rounded-2xl bg-[#0b1126] border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold font-display text-white uppercase tracking-wider">
              Travel & Logistics FAQ
            </h4>
            <div className="space-y-2">
              {contactFaqs.map((faq, idx) => (
                <div key={idx} className="border-b border-slate-800/80 pb-2">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full text-left flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-cyan-300 py-1"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFaq === idx && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0b1126] border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold font-display text-white mb-1">
              Send an Inquiry
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Our organizers review incoming communications and reply to your registered email address.
            </p>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-800/80 text-cyan-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Thank you! Your message has been safely delivered to the organizing team.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquiry regarding Webathon Team Roster"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type your question or delegation inquiry here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Dispatching...' : 'Send Message to Organizers'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
