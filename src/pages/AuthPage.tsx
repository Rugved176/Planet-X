import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import { AlertCircle, CheckCircle2, ArrowRight, Shield, User, Lock, Mail, Phone, School } from 'lucide-react';

interface AuthPageProps {
  onSuccess: (targetPage?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, register, loginWithGoogle, loginWithGoogleRedirect } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState("SVKM's NMIMS Global University, Dhule");
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setPopupBlocked(false);
    setGoogleLoading(true);

    try {
      // Direct call so browser's click activation token is preserved
      await loginWithGoogle();
      onSuccess('dashboard');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setPopupBlocked(true);
        setError('Pop-up window was blocked by your browser. You can click "Continue with Redirect" below, or allow popups in your browser address bar.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.');
      } else {
        setError(err?.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error('Redirect sign in error:', err);
      setError(err?.message || 'Google redirect failed.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const u = await login(email, password);
        if (u.role === 'admin' || email.trim().toLowerCase() === 'planetx.event@gmail.com') {
          onSuccess('admin');
        } else {
          onSuccess('dashboard');
        }
      } else if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        const u = await register({ email, password, name, phone, college });
        if (u.role === 'admin' || email.trim().toLowerCase() === 'planetx.event@gmail.com') {
          onSuccess('admin');
        } else {
          onSuccess('dashboard');
        }
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

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            {popupBlocked && (
              <button
                type="button"
                onClick={handleGoogleRedirect}
                disabled={googleLoading}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <span>Continue with Google Redirect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-800/80 text-cyan-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google Sign-In Button (One-Click Real Google Auth) */}
        {mode !== 'forgot' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-cyan-500/10 border border-slate-200 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Note: Google sign-in is reserved for <strong className="text-cyan-300">Participants</strong>. Administrators must sign in using email & password.
            </p>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0b1126] px-3 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                or sign in with password
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>
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
