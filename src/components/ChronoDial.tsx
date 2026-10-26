import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Sparkles, Award, Trophy, Bot, Cpu, Rocket } from 'lucide-react';

interface Milestone {
  year: string;
  title: string;
  description: string;
  highlight: string;
  icon: any;
  accentColor: string;
  rotation: number;
}

const MILESTONES: Milestone[] = [
  {
    year: '2022-23',
    title: 'The Inception & Robotics Trophy',
    description: 'NMIMS Dhule initiated inter-collegiate technological symposiums, hosting teams from 15+ institutions competing in autonomous robotics and code sprints.',
    highlight: 'Foundation of inter-collegiate tech delegation',
    icon: Bot,
    accentColor: 'from-blue-600 to-cyan-500',
    rotation: 0
  },
  {
    year: '2023-24',
    title: 'The AI & Quantum Innovation Conclave',
    description: 'Expanded into Machine Learning and Algorithmic problem-solving, introducing first-edition speed hackathons and inter-state technical debates.',
    highlight: 'Over 40+ engineering college delegations',
    icon: Cpu,
    accentColor: 'from-violet-600 to-indigo-500',
    rotation: 72
  },
  {
    year: '2024-25',
    title: 'The National Mecha & FinTech Summit',
    description: 'Pioneered combat robotics challenges, multi-agent AI development, and competitive startup venture pitching with real angel jury evaluation.',
    highlight: 'INR 25,000 prize pool milestone achieved',
    icon: Trophy,
    accentColor: 'from-amber-500 to-yellow-400',
    rotation: 144
  },
  {
    year: '2025',
    title: 'Drone Arena & Multimodal Conclave',
    description: 'Featured cutting-edge generative AI models, campus-wide drone light showcases, and established the SVKM Technology Excellence standard.',
    highlight: '10,000+ livestream viewers and participants',
    icon: Rocket,
    accentColor: 'from-fuchsia-600 to-pink-500',
    rotation: 216
  },
  {
    year: '2026',
    title: 'PLANET-X 2026: Beyond Limits',
    description: 'The monumental renaissance: 3 Zones, 8 Competitions, ₹50,000 Prize Pool, real-time participant authentication, and full-stack event infrastructure.',
    highlight: 'Flagship Edition at SVKM NMIMS Dhule',
    icon: Sparkles,
    accentColor: 'from-cyan-400 via-violet-500 to-fuchsia-500',
    rotation: 288
  }
];

export const ChronoDial: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(4); // Default to 2026 PLANET-X

  const activeMilestone = MILESTONES[selectedIndex];
  const ActiveIcon = activeMilestone.icon;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : MILESTONES.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < MILESTONES.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-radial from-[#120826] via-[#080514] to-[#04020a]">
      {/* Clean Subtle Ambient Glow (No foreign screenshot background images) */}
      <div className="absolute inset-0 bg-radial from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Section Title */}
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 block mb-2 font-bold">
            THE CHRONICLES OF EXCELLENCE
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display text-white uppercase tracking-wider drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            Milestones & Legacy
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-2">
            Trace the evolutionary milestones leading to the monumental PLANET-X 2026 festival.
          </p>
        </div>

        {/* 3-Column Interactive Layout: Left Card | Center Dial | Right Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Clean Holographic Milestone Card (No screenshot) */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="rounded-2xl bg-slate-950/90 border-2 border-yellow-500/40 p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] backdrop-blur-xl transition-all duration-500">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest font-bold">
                  ARCHIVAL RECORD
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  {activeMilestone.year}
                </span>
              </div>

              {/* Holographic Icon Badge */}
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${activeMilestone.accentColor} p-0.5 shadow-xl mb-4`}>
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                    <ActiveIcon className="w-10 h-10 text-yellow-300" />
                  </div>
                </div>

                <h4 className="text-lg font-bold font-display text-white mb-2">
                  {activeMilestone.title}
                </h4>
                <p className="text-xs font-medium text-amber-300">
                  {activeMilestone.highlight}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>NMIMS Dhule Campus</span>
                <span className="text-emerald-400">&check; Verified Record</span>
              </div>
            </div>
          </div>

          {/* Center Column: The Astrolabe / Celestial Dial */}
          <div className="lg:col-span-4 order-1 lg:order-2 flex flex-col items-center justify-center my-6 lg:my-0">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Outer Golden/Violet Runes Ring */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.3)] transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${activeMilestone.rotation}deg)` }}
              >
                {/* Orbital Rune Markers */}
                {MILESTONES.map((m, idx) => {
                  const angle = (idx * (360 / MILESTONES.length)) * (Math.PI / 180);
                  const x = 50 + 44 * Math.cos(angle);
                  const y = 50 + 44 * Math.sin(angle);
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-yellow-400 text-slate-950 scale-125 shadow-[0_0_20px_#eab308]'
                          : 'bg-purple-950/80 text-purple-300 border border-purple-500/50 hover:border-yellow-400'
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Inner Glowing Gear Dial */}
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-purple-950 via-slate-950 to-indigo-950 border border-purple-400/40 flex flex-col items-center justify-center text-center p-4 shadow-[inset_0_0_30px_rgba(168,85,247,0.4)]">
                <RotateCw 
                  className="w-6 h-6 text-yellow-400 mb-2 transition-transform duration-700" 
                  style={{ transform: `rotate(${-activeMilestone.rotation}deg)` }}
                />
                <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-wider">
                  {activeMilestone.year}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest mt-1">
                  EDITION {selectedIndex + 1}
                </span>
              </div>
            </div>

            {/* Dial Stepper Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-300 hover:text-white transition-colors"
                title="Previous Milestone"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono text-slate-400">
                Phase {selectedIndex + 1} / {MILESTONES.length}
              </span>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 text-slate-300 hover:text-white transition-colors"
                title="Next Milestone"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Column: Historical Narrative */}
          <div className="lg:col-span-4 order-3">
            <div className="p-6 rounded-2xl bg-slate-950/80 border-2 border-yellow-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)] backdrop-blur-xl">
              <span className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-wider block mb-1">
                YEAR {activeMilestone.year}
              </span>
              <h3 className="text-2xl font-bold font-display text-white mb-3">
                {activeMilestone.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {activeMilestone.description}
              </p>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs text-purple-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>{activeMilestone.highlight}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
