import React, { useState } from 'react';
import { MessageCircle, X, Send, HelpCircle } from 'lucide-react';
import { api } from '../lib/api.ts';

export const HelpDeskTrigger: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    try {
      await api.submitContact({
        name,
        email,
        subject: 'Quick Help Desk Inquiry',
        message
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
        setName('');
        setEmail('');
        setMessage('');
      }, 2500);
    } catch {
      alert('Unable to submit inquiry. Please use the Contact page.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Trigger Button (As seen in Techfest video) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all hover:scale-105"
        >
          <span className="hidden sm:inline">Have a question?</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold">
            ?
          </div>
        </button>
      </div>

      {/* Slide-Up Help Desk Modal */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[92vw] max-w-sm rounded-2xl bg-[#0b1126] border border-cyan-500/30 p-5 shadow-2xl text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold font-display text-white">PLANET-X Helpdesk</h4>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {sent ? (
            <div className="p-4 text-center text-xs text-emerald-300">
              Your inquiry has been received! An organizer will email you shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Your Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500"
              />
              <input
                type="email"
                required
                placeholder="Your Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500"
              />
              <textarea
                required
                rows={3}
                placeholder="Ask about events, rules, fees, dates..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending...' : 'Submit Question'}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
