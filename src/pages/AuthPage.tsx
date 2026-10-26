import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import { AlertCircle, CheckCircle2, ArrowRight, Shield, User, Lock, Mail, Phone, School } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState("SVKM's NMIMS Global University, Dhule");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onSuccess();
      } else if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        await register({ email, password, name, phone, college });
        onSuccess();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setSuccessMessage(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick one-click testing credentials
  const fillQuickDemo = (role: 'admin' | 'participant') => {
    setError(null);
    setSuccessMessage(null);
    if (role === 'admin') {
      setMode('login');
      setEmail('admin@planetx.nmims.edu');
      setPassword('Admin@PlanetX2026');
    } else {
      setMode('login');
      setEmail('participant@example.com');
      setPassword('Participant@2026');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[#0b1126] border border-slate-700/80 shadow-2xl p-6 sm:p-8 text-slate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 block mb-1">
            PORTAL ACCESS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-tight">
            {mode === 'login' && 'Enter Planet-X'}
            {mode === 'signup' && 'Create Participant Account'}
            {mode === 'forgot' && 'Reset Security Credentials'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Sign in to access your registered competitions and delegation passes.'}
            {mode === 'signup' && 'Register your collegiate profile to join teams and competitions.'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Quick Demo Credentials Pill Bar for Testing */}
        <div className="mb-6 p-3 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2 text-center">
            Quick Test Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('participant')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-cyan-300 flex items-center justify-center gap-1 transition-colors"
            >
              <User className="w-3 h-3" />
              <span>Participant Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin')}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-amber-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-800/80 text-cyan-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  College / Institute
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="SVKM's NMIMS Global University, Dhule"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-lg"
          >
            <span>
              {loading
                ? 'Authenticating...'
                : mode === 'login'
                ? 'Sign In to Dashboard'
                : mode === 'signup'
                ? 'Complete Account Creation'
                : 'Send Password Reset Code'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              &larr; Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
