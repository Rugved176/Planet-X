import React, { useState } from 'react';
import { CompetitionZone, CompetitionEvent } from '../types.ts';
import { Code, Gamepad2, TrendingUp, Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ZonesPageProps {
  zones: CompetitionZone[];
  events: CompetitionEvent[];
  initialZoneId?: string;
  onSelectEvent: (slug: string) => void;
  onRegisterEvent: (event: CompetitionEvent) => void;
}

export const ZonesPage: React.FC<ZonesPageProps> = ({
  zones,
  events,
  initialZoneId,
  onSelectEvent,
  onRegisterEvent
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId || 'all');

  const filteredEvents = selectedZoneId === 'all'
    ? events
    : events.filter(e => e.zoneId === selectedZoneId);

  const getZoneIcon = (code: string) => {
    if (code.includes('A') || code.includes('CODE')) return <Code className="w-5 h-5 text-cyan-400" />;
    if (code.includes('B') || code.includes('FUN')) return <Gamepad2 className="w-5 h-5 text-fuchsia-400" />;
    return <TrendingUp className="w-5 h-5 text-violet-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 block mb-2">
          EXPLORE THE MULTIVERSE OF TALENT
        </span>
        <h1 className="text-3xl sm:text-5xl font-black font-display text-white uppercase tracking-tight">
          Competition Zones
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Discover all 8 competitions structured across CODE-ZONE, FUN-ZONE, and FIN-TECH. Form your squad, check requirements, and lock in your delegation.
        </p>

        {/* Filter Tabs (Functional segmented buttons) */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center p-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setSelectedZoneId('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedZoneId === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Zones (8)
          </button>
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedZoneId === zone.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const zone = zones.find(z => z.id === event.zoneId);
          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event.slug)}
              className="rounded-2xl bg-[#0b1126] border border-slate-800/90 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
            >
              <div>
                {/* Zone & Fee Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 uppercase">
                    {zone && getZoneIcon(zone.code)}
                    <span>{event.zoneName}</span>
                  </div>
                  <span className="text-sm font-bold font-display text-cyan-300">
                    ₹{event.registrationFee}
                  </span>
                </div>

                {/* Event Title */}
                <h3 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(event.slug);
                  }}
                  className="text-xl font-bold font-display text-white uppercase tracking-tight mb-2 group-hover:text-cyan-400 transition-colors"
                >
                  {event.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                  {event.shortDescription}
                </p>

                {/* Key Spec Badges */}
                <div className="space-y-1.5 py-3 border-y border-slate-800/80 mb-4 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Squad Limits</span>
                    </span>
                    <span className="font-semibold text-white">
                      {event.minTeamSize === event.maxTeamSize ? `${event.minTeamSize} Member` : `${event.minTeamSize} to ${event.maxTeamSize} Members`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Registration</span>
                    </span>
                    <span className={`font-semibold ${event.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {event.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Core Objective Preview */}
                <div className="mb-6">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                    Key Highlight:
                  </span>
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    "{event.objectives[0] || event.shortDescription}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(event.slug);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-colors text-center"
                >
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegisterEvent(event);
                  }}
                  disabled={!event.isOpen}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white disabled:opacity-40 transition-all text-center flex items-center justify-center gap-1"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
