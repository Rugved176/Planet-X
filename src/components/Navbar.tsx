import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Shield, LogOut, Menu, X, LayoutDashboard, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleNavClick = (page: string, param?: string) => {
    onNavigate(page, param);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Top-Left: Festival Monogram (As seen in Techfest video with stylized T/PX logo) */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 group text-left whitespace-nowrap shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-500 to-red-600 p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.4)] group-hover:shadow-[0_0_25px_rgba(234,179,8,0.7)] transition-all">
            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center font-display font-black text-lg text-white">
              PX
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-black text-lg text-white uppercase tracking-tight block">
              PLANET-X
            </span>
            <span className="text-[10px] font-mono tracking-widest text-yellow-400 block -mt-1 font-semibold">
              2026 EDITION
            </span>
          </div>
        </button>

        {/* Top-Center: Angular Polygonal Cyber HUD Container (Exact match to Techfest top-bar) */}
        <nav className="hidden lg:flex items-center justify-center">
          <div className="hud-clip-topbar bg-gradient-to-r from-slate-950/90 via-[#0e1738]/90 to-slate-950/90 border-x border-b-2 border-yellow-500/70 shadow-[0_0_25px_rgba(234,179,8,0.25)] px-8 py-2 flex items-center gap-7 text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-yellow-400 transition-colors whitespace-nowrap ${
                currentPage === 'home' ? 'text-yellow-400 drop-shadow-[0_0_10px_#eab308]' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('zones')}
              className={`hover:text-yellow-400 transition-colors whitespace-nowrap ${
                currentPage === 'zones' ? 'text-yellow-400 drop-shadow-[0_0_10px_#eab308]' : ''
              }`}
            >
              Zones
            </button>
            <button
              onClick={() => handleNavClick('events')}
              className={`hover:text-yellow-400 transition-colors whitespace-nowrap ${
                currentPage === 'events' ? 'text-yellow-400 drop-shadow-[0_0_10px_#eab308]' : ''
              }`}
            >
              Competitions
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`hover:text-yellow-400 transition-colors whitespace-nowrap ${
                currentPage === 'about' ? 'text-yellow-400 drop-shadow-[0_0_10px_#eab308]' : ''
              }`}
            >
              Meet the Team
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`hover:text-yellow-400 transition-colors whitespace-nowrap ${
                currentPage === 'contact' ? 'text-yellow-400 drop-shadow-[0_0_10px_#eab308]' : ''
              }`}
            >
              Contact
            </button>
          </div>
        </nav>

        {/* Top-Right: High-Tech SIGN IN Button (Exact Techfest Cut) */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-yellow-500/50 hover:border-yellow-400 text-xs font-semibold text-slate-200 transition-colors shadow-lg"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-mono text-amber-300 px-1 py-0.2 bg-amber-950/60 rounded border border-amber-800">
                    Admin
                  </span>
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-slate-400 truncate">{user.email}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.college}</p>
                  </div>

                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 text-left transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                    <span>Participant Dashboard</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 text-left transition-colors"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Administrator Console</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-800/80" />

                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      onNavigate('home');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('auth')}
              className="hud-clip-btn px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase text-slate-950 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-white shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>SIGN IN</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 px-5 py-4 space-y-3 font-mono text-xs">
          <button
            onClick={() => handleNavClick('home')}
            className="block w-full text-left py-2 font-bold text-slate-300 hover:text-yellow-400 uppercase"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('zones')}
            className="block w-full text-left py-2 font-bold text-slate-300 hover:text-yellow-400 uppercase"
          >
            Competition Zones
          </button>
          <button
            onClick={() => handleNavClick('events')}
            className="block w-full text-left py-2 font-bold text-slate-300 hover:text-yellow-400 uppercase"
          >
            All Competitions
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="block w-full text-left py-2 font-bold text-slate-300 hover:text-yellow-400 uppercase"
          >
            Meet the Team
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="block w-full text-left py-2 font-bold text-slate-300 hover:text-yellow-400 uppercase"
          >
            Contact
          </button>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg text-center"
                >
                  Participant Dashboard
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800 rounded-lg text-center"
                  >
                    Administrator Console
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    onNavigate('home');
                  }}
                  className="w-full py-2 px-4 text-xs font-medium text-rose-400 hover:text-rose-300 text-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg text-center shadow-lg uppercase"
              >
                Sign In to Portal
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
