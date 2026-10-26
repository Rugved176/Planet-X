import React from 'react';
import { Home, Calendar, Phone, Users, Shield, Layers } from 'lucide-react';
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
    { id: 'about', label: 'About Us', icon: Users },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <aside className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-60 hidden md:flex flex-col gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`group relative p-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center ${
              isActive
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
            title={item.label}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px] font-mono tracking-tight mt-1 hidden lg:block uppercase font-bold">
              {item.label.split(' ')[0]}
            </span>

            {/* Hover Tooltip for narrower screens */}
            <span className="lg:hidden absolute left-full ml-3 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
};
