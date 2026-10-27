import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Menu, X, LayoutDashboard, Shield, LogOut, Home, Layers, Calendar, Phone, Users, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (page: string, param?: string) => {
    onNavigate(page, param);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/60 backdrop-blur-md border-b border-white/[0.06] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Top-Left: Monogram & Brand Logo (Matches screenshot pixel-for-pixel) */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 group text-left whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-[2px] shadow-[0_0_20px_rgba(234,179,8,0.5)] group-hover:shadow-[0_0_28px_rgba(234,179,8,0.8)] transition-all">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-display font-black text-lg text-white">
                PX
              </div>
            </div>
            <div>
              <span className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight block leading-tight">
                PLANET-X
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#facc15] block font-bold leading-none mt-0.5">
                2026 EDITION
              </span>
            </div>
          </button>

          {/* Top-Right: Chamfered SIGN IN button + Hamburger Menu Icon */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {user ? (
              <button
                onClick={() => handleNavClick('dashboard')}
                className="hud-clip-btn bg-[#facc15] hover:bg-[#eab308] text-slate-950 font-black text-xs sm:text-sm tracking-wider px-5 py-2.5 flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.7)] cursor-pointer"
              >
                <span>DASHBOARD</span>
                <span className="font-bold">&gt;</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="hud-clip-btn bg-[#facc15] hover:bg-[#eab308] text-slate-950 font-black text-xs sm:text-sm tracking-wider px-5 py-2.5 flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.7)] cursor-pointer"
              >
                <span>SIGN IN</span>
                <span className="font-bold">&gt;</span>
              </button>
            )}

            {/* Hamburger Menu Toggle Icon */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-white hover:text-[#facc15] transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              {menuOpen ? (
                <X className="w-7 h-7 sm:w-8 sm:h-8" />
              ) : (
                <Menu className="w-7 h-7 sm:w-8 sm:h-8" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Cyber Navigation Drawer (Accessible via hamburger menu) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-sm sm:max-w-md h-full bg-[#050818]/95 border-l border-cyan-500/30 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl backdrop-blur-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1.5px]">
                    <div className="w-full h-full rounded-[6px] bg-slate-950 flex items-center justify-center font-display font-black text-sm text-white">
                      PX
                    </div>
                  </div>
                  <span className="font-display font-black text-lg text-white">NAVIGATION</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User quick status if logged in */}
              {user && (
                <div className="my-5 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-xs">
                  <p className="font-semibold text-white truncate">{user.name}</p>
                  <p className="text-slate-400 truncate text-[11px]">{user.email}</p>
                  {isAdmin && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-950 text-amber-300 rounded border border-amber-800">
                      Administrator
                    </span>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <div className="mt-6 space-y-2">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'zones', label: 'Competition Zones', icon: Layers },
                  { id: 'events', label: 'All 8 Competitions', icon: Calendar },
                  { id: 'about', label: 'Meet the Team', icon: Users },
                  { id: 'contact', label: 'Contact Us', icon: Phone },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 shadow-lg font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    </button>
                  );
                })}

                {user && (
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                      currentPage === 'dashboard'
                        ? 'bg-cyan-500 text-slate-950 shadow-lg font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                      <span>Participant Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                      currentPage === 'admin'
                        ? 'bg-amber-500 text-slate-950 shadow-lg font-bold'
                        : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-amber-400" />
                      <span>Admin Console</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-900/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNavClick('auth')}
                  className="w-full py-3 px-4 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-slate-950 text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <span>SIGN IN TO PLANET-X &gt;</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
