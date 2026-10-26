import React, { useState } from 'react';
import { ThreePlanet } from '../components/ThreePlanet.tsx';
import { CountdownTimer } from '../components/CountdownTimer.tsx';
import { CompetitionZone, CompetitionEvent, OrganizingTeamMember, GlobalSettings } from '../types.ts';
import { Code, Gamepad2, TrendingUp, Trophy, MapPin, Calendar, Users, ChevronDown, ArrowRight, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';

interface HomePageProps {
  settings: GlobalSettings;
  zones: CompetitionZone[];
  events: CompetitionEvent[];
  teamMembers: OrganizingTeamMember[];
  onNavigate: (page: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  zones,
  events,
  teamMembers,
  onNavigate
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const getZoneIcon = (code: string) => {
    if (code.includes('A') || code.includes('CODE')) return <Code className="w-5 h-5 text-cyan-400" />;
    if (code.includes('B') || code.includes('FUN')) return <Gamepad2 className="w-5 h-5 text-fuchsia-400" />;
    return <TrendingUp className="w-5 h-5 text-amber-400" />;
  };

  const faqs = [
    {
      q: 'Who is eligible to participate in PLANET-X 2026?',
      a: 'All undergraduate and postgraduate students from any recognized college or university across India are eligible. Valid student identity cards are verified during registration and on-ground reporting.'
    },
    {
      q: 'Can a team register for multiple competition zones?',
      a: 'Yes! Teams may register for events across Code-Zone, Fun-Zone, and Fin-Tech as long as tournament match times do not directly conflict. Check individual event rules for squad size limits.'
    },
    {
      q: 'How does team registration and verification work?',
      a: 'The squad leader creates an account, names the squad, and adds member details. Payment verification is handled through the official UPI QR code, with immediate receipt review by the finance committee.'
    },
    {
      q: 'When do we receive the official event WhatsApp community link?',
      a: 'WhatsApp group invite links are displayed inside your Participant Dashboard upon submission or after payment verification (depending on the competition setting configured by the coordinators).'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-transparent">
      {/* 1. CINEMATIC HERO VIEWPORT WITH THREE.JS PLANET */}
      <section className="relative w-full overflow-hidden min-h-[580px] md:min-h-[720px] flex items-center justify-center">
        {/* Neon Nebula Cityscape Hero Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/assets/aistudio/Neon_Nebula_Cityscape_fcfb5c7c.png')`
          }}
        />

        {/* Futuristic Cosmic Ambience Layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.22),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(139,92,246,0.2),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(236,72,153,0.18),transparent_50%)] pointer-events-none" />
        
        {/* Subtle Cyber Grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
        {/* Vignette Gradients for Legibility and Smooth Bottom Blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/75 via-transparent to-[#02040a] pointer-events-none" />
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />

        <div className="relative z-10 w-full">
          <ThreePlanet
            onExploreZones={() => onNavigate('zones')}
            onEnterPlanetX={() => onNavigate('auth')}
          />
        </div>

        {/* Scroll indicator (As seen in Techfest video: SCROLL TO EXPLORE) */}
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5 opacity-80">
          <span className="text-[10px] font-mono tracking-[0.25em] text-yellow-400 uppercase font-bold">
            SCROLL TO EXPLORE
          </span>
          <div className="w-4 h-7 rounded-full border-2 border-yellow-400/60 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-yellow-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. LIVE MISSION COUNTDOWN STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <CountdownTimer
          targetDate={settings.eventDate || '2026-11-21'}
          isProvisional={settings.isProvisionalDate}
        />
      </section>

      {/* 6. THE THREE COMPETITION ZONES (CODE-ZONE, FUN-ZONE, FIN-TECH) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 block mb-2 font-bold">
            THREE DOMAINS OF COMBAT & MASTERY
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-white uppercase tracking-tight">
            The Competition Zones
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300">
            Eight tournaments configured across software engineering, artificial intelligence, competitive gaming, and venture pitching.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {zones.map((zone) => {
            const zoneEvents = events.filter((e) => e.zoneId === zone.id);
            return (
              <div
                key={zone.id}
                className="group relative rounded-2xl bg-[#091129]/90 border-2 border-yellow-500/50 hover:border-yellow-400 p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(234,179,8,0.25)] backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold tracking-wider text-yellow-400 uppercase">
                      {zone.code}
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      {getZoneIcon(zone.code)}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black font-display text-white uppercase tracking-tight mb-2 group-hover:text-yellow-300 transition-colors">
                    {zone.name}
                  </h3>
                  <p className="text-xs font-semibold text-cyan-300 mb-3">
                    {zone.tagline}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {zone.description}
                  </p>

                  <div className="border-t border-slate-800/80 pt-4 mb-6">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2.5">
                      Pod Tournaments ({zoneEvents.length}):
                    </span>
                    <ul className="space-y-2">
                      {zoneEvents.map((ev) => (
                        <li key={ev.id}>
                          <button
                            onClick={() => onNavigate('event-detail', ev.slug)}
                            className="w-full text-left flex items-center justify-between text-xs text-slate-200 hover:text-yellow-300 transition-colors py-1"
                          >
                            <span className="font-semibold truncate pr-2">{ev.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono shrink-0">
                              ₹{ev.registrationFee} &bull; Team {ev.minTeamSize}-{ev.maxTeamSize}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('zones', zone.id)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-white transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Enter {zone.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. MEET THE TEAM PREVIEW (As seen at 00:53 in Techfest Video) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-yellow-400 block mb-1 font-bold">
              ORGANIZING COMMITTEE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-tight">
              Meet the Minds Behind PLANET-X
            </h2>
          </div>
          <button
            onClick={() => onNavigate('about')}
            className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 transition-colors uppercase font-mono"
          >
            <span>Full Leadership Roster & Contacts &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {teamMembers.slice(0, 6).map((member) => (
            <div
              key={member.id}
              className="group p-4 rounded-2xl bg-gradient-to-b from-[#0a1433] to-[#040717] border border-yellow-500/40 hover:border-yellow-400 text-center transition-all hover:-translate-y-1 shadow-lg"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 mx-auto mb-3 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg border border-yellow-300/40">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              <h3 className="text-sm font-bold text-white truncate">{member.name}</h3>
              <p className="text-[10px] font-mono text-yellow-400 mt-0.5 line-clamp-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-yellow-400 block mb-1 font-bold">
            PARTICIPANT BRIEFING
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#091129] border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-white hover:text-yellow-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-yellow-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. FINAL LIFTOFF CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-red-950 via-slate-950 to-amber-950 border-2 border-yellow-500/60 p-8 sm:p-14 text-center shadow-[0_0_40px_rgba(234,179,8,0.2)]">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-yellow-400 block mb-2 font-bold">
            SVKM'S NMIMS GLOBAL UNIVERSITY, DHULE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-white uppercase tracking-tight max-w-2xl mx-auto">
            Ready to Compete at PLANET-X 2026?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xl mx-auto">
            Create your account, register your squad roster, complete payment verification, and join the official competition WhatsApp groups.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('auth')}
              className="px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-white shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all"
            >
              Sign In to Register
            </button>
            <button
              onClick={() => onNavigate('zones')}
              className="px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              Explore 3 Zones
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
