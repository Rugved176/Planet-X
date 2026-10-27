import React from 'react';
import { Home, Layers, Calendar, Phone, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LeftNavDockProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
}

export const LeftNavDock: React.FC<LeftNavDockProps> = ({ currentPage, onNavigate }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'zones', label: 'Zones', icon: Layers },
    { id: 'events', label: 'Competitions', icon: Calendar },
    { id: 'contact', label: 'Contact Us', icon: Phone },
    { id: 'about', label: 'Meet the Team', icon: Users },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Administrator', icon: Shield });
  }

  return (
    <aside className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3.5 p-2 rounded-2xl bg-[#030919]/80 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_30px_rgba(0,0,0,0.85)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`group relative p-2.5 sm:p-3 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${
              isActive
                ? 'bg-[#00a6f4] text-slate-950 shadow-[0_0_22px_rgba(0,166,244,0.65)] scale-105'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={item.label}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950 stroke-[2.4]' : 'stroke-[1.8]'}`} />

            {/* Hover Tooltip */}
            <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-cyan-500/30 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
};
