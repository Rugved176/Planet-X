import React from 'react';

interface FooterProps {
  onNavigate: (page: string) => void;
  eventDate?: string;
  isProvisional?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavigate, 
  eventDate = '21 November 2026', 
  isProvisional = true 
}) => {
  return (
    <footer className="w-full bg-[#02040a] border-t border-yellow-500/40 text-slate-300 text-xs mt-12 relative z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.95)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xl font-black font-display text-white uppercase tracking-tight">
              PLANET-X 2026
            </h3>
            <p className="text-slate-300 font-medium text-sm">
              SVKM's NMIMS Global University, Dhule
            </p>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              BEYOND INNOVATION. BEYOND LIMITS. The premier multi-zone inter-collegiate tech, robotics, debate, and fin-tech arena empowering student builders to shape tomorrow.
            </p>
            <div className="text-xs font-mono text-cyan-400 pt-1">
              Event Date: {eventDate} {isProvisional ? '— provisional' : ''}
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3">
              Event Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-cyan-300 transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('zones')}
                  className="hover:text-cyan-300 transition-colors text-left"
                >
                  Explore Zones
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('events')}
                  className="hover:text-cyan-300 transition-colors text-left"
                >
                  All Competitions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-cyan-300 transition-colors text-left"
                >
                  Organizing Team
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-cyan-300 transition-colors text-left"
                >
                  Contact Desk
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Campus & Host Venue */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 mb-3">
              Venue Location
            </h4>
            <address className="not-italic space-y-1.5 text-slate-400 leading-relaxed">
              <p className="text-slate-200 font-medium">SVKM's NMIMS Dhule Campus</p>
              <p>Mumbai-Agra Highway</p>
              <p>Dhule, Maharashtra 424001</p>
              <a href="mailto:planetx.event@gmail.com" className="pt-2 text-cyan-400 hover:underline hover:text-cyan-300 font-mono block">
                planetx.event@gmail.com
              </a>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} PLANET-X 2026 &bull; SVKM's NMIMS Global University, Dhule. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>Fair Play Code</span>
            <span aria-hidden="true">&bull;</span>
            <span>Participant Guidelines</span>
            <span aria-hidden="true">&bull;</span>
            <span>Terms of Registration</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
