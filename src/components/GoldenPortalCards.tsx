import React from 'react';
import { Award, Sparkles, Compass, ArrowRight } from 'lucide-react';

interface GoldenPortalCardsProps {
  onNavigate: (page: string, param?: string) => void;
}

export const GoldenPortalCards: React.FC<GoldenPortalCardsProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'ca-program',
      tag: 'DELEGATE INITIATIVE',
      title: 'Campus Ambassador Program',
      description: 'Become the official college ambassador for PLANET-X 2026 at your institution. Lead student delegations, earn exclusive coordinator certification, and win festival merchandise.',
      buttonText: 'Join Program',
      action: () => onNavigate('contact'),
      icon: Award
    },
    {
      id: 'about-planetx',
      tag: 'THE RENAISSANCE',
      title: 'About PLANET-X 2026',
      description: "Welcome to the official portal of SVKM's NMIMS Global University Dhule's flagship tech festival. 3 Zones, 8 Competitions, and a ₹50,000 prize pool uniting tomorrow's leaders.",
      buttonText: 'Read Mission',
      action: () => onNavigate('about'),
      icon: Sparkles
    },
    {
      id: 'more-events',
      tag: 'THE TOURNAMENT',
      title: 'Explore All Arenas',
      description: 'From Webathon and Gemini AI Vibeathon to Battle-tested Bugverse, AI Quiz, Competitive Gaming, and Startup Pitching. Registrations are open now.',
      buttonText: 'Browse 8 Events',
      action: () => onNavigate('zones'),
      icon: Compass
    }
  ];

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#050713] via-[#090b1c] to-[#050713]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative rounded-2xl bg-[#090e24]/90 border-2 border-yellow-500/50 hover:border-yellow-400 p-7 sm:p-8 flex flex-col justify-between shadow-[0_0_25px_rgba(234,179,8,0.18)] hover:shadow-[0_0_40px_rgba(234,179,8,0.35)] transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-xl"
              >
                {/* Decorative corner notch glyphs */}
                <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-400" />
                <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-400" />
                <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-400" />
                <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-400" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-yellow-400 uppercase">
                      {card.tag}
                    </span>
                    <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold font-display text-white mb-3 group-hover:text-yellow-300 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>

                <button
                  onClick={card.action}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-white shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
