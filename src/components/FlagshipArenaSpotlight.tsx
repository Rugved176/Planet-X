import React, { useState } from 'react';
import { Trophy, Calendar, Users, ArrowRight, ShieldCheck, Flame, Bot, Code2, Cpu, Rocket } from 'lucide-react';
import { CompetitionEvent } from '../types.ts';

interface FlagshipArenaSpotlightProps {
  flagshipEvent?: CompetitionEvent;
  prizePool: string;
  onExplore: () => void;
  onRegister: () => void;
}

export const FlagshipArenaSpotlight: React.FC<FlagshipArenaSpotlightProps> = ({
  flagshipEvent,
  prizePool,
  onExplore,
  onRegister
}) => {
  const [activePodIdx, setActivePodIdx] = useState(0);

  const arenaPods = [
    {
      name: 'Autonomous Robotics Arena',
      team: 'Robotics & Hardware Division',
      icon: Bot,
      metric: 'National Match Brackets',
      gradient: 'from-red-600/30 via-orange-600/20 to-transparent',
      borderColor: 'border-red-500/40'
    },
    {
      name: 'Full-Stack Webathon Pod',
      team: 'Web Engineering Pod',
      icon: Code2,
      metric: 'Live Production Deployments',
      gradient: 'from-cyan-600/30 via-blue-600/20 to-transparent',
      borderColor: 'border-cyan-500/40'
    },
    {
      name: 'Gemini Vibeathon Stage',
      team: 'Multimodal AI Builders',
      icon: Cpu,
      metric: 'Multimodal Prompt Engines',
      gradient: 'from-violet-600/30 via-fuchsia-600/20 to-transparent',
      borderColor: 'border-violet-500/40'
    },
    {
      name: 'FinTech & Startup Conclave',
      team: 'Venture Pitch Cohort',
      icon: Rocket,
      metric: 'Angel & VC Jury Evaluation',
      gradient: 'from-amber-600/30 via-yellow-600/20 to-transparent',
      borderColor: 'border-amber-500/40'
    },
  ];

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Clean Ambient Radial Glow (No screenshot images) */}
      <div className="absolute inset-0 bg-radial from-red-950/25 via-slate-950/80 to-black pointer-events-none" />

      <div className="relative max-w-6xl mx-auto z-10 text-center">
        {/* Mecha Emblem & Laser Wings Header */}
        <div className="flex justify-center mb-4">
          <div className="relative flex items-center justify-center">
            {/* Left glowing wing */}
            <div className="w-16 sm:w-28 h-2 bg-gradient-to-r from-transparent via-red-500 to-amber-500 blur-sm rotate-12" />
            
            {/* Center Mecha Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-red-600 via-amber-600 to-black p-0.5 shadow-[0_0_35px_rgba(239,68,68,0.6)] mx-2 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                <Flame className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            {/* Right glowing wing */}
            <div className="w-16 sm:w-28 h-2 bg-gradient-to-l from-transparent via-red-500 to-amber-500 blur-sm -rotate-12" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white uppercase tracking-wider drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
          FLAGSHIP ARENA: ROBOWARS & WEBATHON
        </h2>
        <p className="text-xs sm:text-sm font-mono text-amber-400 tracking-widest uppercase mt-2">
          THE ULTIMATE TECH & MECHA SHOWDOWN AT SVKM'S NMIMS DHULE
        </p>

        {/* Floating Pills (About Robowars / Deadline) */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 my-8">
          <div className="px-5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-200 backdrop-blur-md">
            <span>Official Rules & Battleground Briefing</span>
          </div>

          {/* Central Glowing Prize Pool HUD Box */}
          <div className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-950 via-slate-950 to-amber-950 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <span className="text-[10px] font-mono text-amber-400 tracking-widest uppercase block">
              GRAND PRIZE POOL
            </span>
            <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-wider">
              {prizePool || 'INR 50,000'}
            </span>
          </div>

          <div className="px-5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-semibold text-slate-200 backdrop-blur-md">
            <span>Registration Deadline: 21 November</span>
          </div>
        </div>

        {/* Action Buttons: PROBLEM STATEMENT & REGISTER NOW */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={onExplore}
            className="px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/60 transition-all"
          >
            Problem Statement & Rules
          </button>
          <button
            onClick={onRegister}
            className="px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 hover:from-amber-300 hover:to-white shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all flex items-center gap-2"
          >
            <span>Register Squad Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* "OUR REACH" Metric Badges */}
        <div className="mb-14">
          <div className="inline-block px-4 py-1 rounded-full bg-red-950/60 border border-red-800 text-[11px] font-mono uppercase tracking-widest text-red-400 mb-6">
            OUR REACH & FOOTPRINT
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-red-500/30 text-center shadow-lg">
              <span className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight block">
                1.5M+
              </span>
              <span className="text-xs font-mono uppercase text-slate-400 mt-1 block">
                Global Livestream Views
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 text-center shadow-lg">
              <span className="text-3xl sm:text-4xl font-black font-display text-amber-300 tracking-tight block">
                25+
              </span>
              <span className="text-xs font-mono uppercase text-slate-400 mt-1 block">
                Inter-Collegiate Delegations
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-red-500/30 text-center shadow-lg">
              <span className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight block">
                10K+
              </span>
              <span className="text-xs font-mono uppercase text-slate-400 mt-1 block">
                Fest Audience & Participants
              </span>
            </div>
          </div>
        </div>

        {/* Festival Division Arena Cards (Clean Procedural Cards - No screenshot overlays) */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <span className="text-xs font-mono uppercase text-slate-400">
              FESTIVAL MOMENTS & DELEGATIONS
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-widest">
              COMPETITION ARENAS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {arenaPods.map((pod, idx) => {
              const Icon = pod.icon;
              const isActive = activePodIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActivePodIdx(idx)}
                  className={`group relative rounded-xl p-5 bg-gradient-to-b from-slate-900 to-slate-950 border text-left cursor-pointer transition-all ${
                    isActive 
                      ? `${pod.borderColor} shadow-[0_0_20px_rgba(245,158,11,0.3)] -translate-y-1` 
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pod.gradient} border border-white/10 flex items-center justify-center mb-3 text-amber-400`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {pod.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-3">{pod.team}</p>
                  <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    {pod.metric}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
