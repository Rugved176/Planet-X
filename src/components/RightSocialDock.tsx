import React from 'react';
import { 
  Instagram, 
  Linkedin, 
  Youtube, 
  MessageSquare, 
  Share2,
  ExternalLink
} from 'lucide-react';

export const RightSocialDock: React.FC = () => {
  const socials = [
    { name: 'X', label: '𝕏', href: 'https://twitter.com', isText: true },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
    { name: 'Discord', icon: MessageSquare, href: 'https://discord.com' },
  ];

  return (
    <aside className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl">
      {socials.map((s, idx) => {
        const Icon = s.icon;
        return (
          <a
            key={idx}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-all duration-200"
            title={s.name}
          >
            {s.isText ? (
              <span className="font-bold text-sm">{s.label}</span>
            ) : (
              Icon && <Icon className="w-4 h-4" />
            )}

            {/* Hover Tooltip */}
            <span className="absolute right-full mr-3 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
              {s.name}
            </span>
          </a>
        );
      })}
    </aside>
  );
};
