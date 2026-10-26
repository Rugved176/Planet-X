import React, { useState } from 'react';
import { OrganizingTeamMember } from '../types.ts';
import { Mail, Phone, ExternalLink, Linkedin, Sparkles, Check, Copy } from 'lucide-react';

interface AboutTeamPageProps {
  teamMembers: OrganizingTeamMember[];
}

export const AboutTeamPage: React.FC<AboutTeamPageProps> = ({ teamMembers }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Leadership' },
    { id: 'Overall Coordinators', label: 'Overall Coordinators' },
    { id: 'Competitions', label: 'Competitions' },
    { id: 'Web & Creatives', label: 'Web & Platform' },
    { id: 'Operations', label: 'Operations & Logistics' },
    { id: 'Publicity', label: 'PR & Outreach' },
    { id: 'Finance', label: 'Finance & Sponsors' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Map the 6 core organizers to appropriate departments if needed
  const mappedMembers = teamMembers.map((m) => {
    let dept = 'Competitions';
    const roleLower = m.role.toLowerCase();
    if (roleLower.includes('lead') || roleLower.includes('director')) dept = 'Overall Coordinators';
    else if (roleLower.includes('platform') || roleLower.includes('web')) dept = 'Web & Creatives';
    else if (roleLower.includes('logistics') || roleLower.includes('operations')) dept = 'Operations';
    else if (roleLower.includes('pr') || roleLower.includes('outreach')) dept = 'Publicity';
    else if (roleLower.includes('finance') || roleLower.includes('sponsor')) dept = 'Finance';

    return {
      ...m,
      dept
    };
  });

  const filteredMembers = activeCategory === 'all'
    ? mappedMembers
    : mappedMembers.filter(m => m.dept === activeCategory);

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Clean Subtle Ambient Glow (No foreign screenshot background images) */}
      <div className="absolute inset-0 bg-radial from-blue-950/20 via-slate-950/80 to-black pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Title & Kicker */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 block mb-2">
            THE ARCHITECTS OF PLANET-X
          </span>
          <h1 className="text-4xl sm:text-6xl font-black font-display text-white uppercase tracking-wider drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            Meet the Team
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-300">
            Dedicated student leadership, event directors, and technical coordinators organizing PLANET-X 2026 at SVKM's NMIMS Global University, Dhule.
          </p>
        </div>

        {/* Category Pills Selector (As seen at 00:53 in reference video) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-14 max-w-4xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cyber-Framed Team Cards Grid (Exact Techfest Layout from 00:54) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="group relative rounded-2xl bg-gradient-to-b from-[#091538] via-[#060c24] to-[#040614] border-2 border-yellow-500/70 shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2"
            >
              {/* Outer Golden Cyber-Frame Inset Lines */}
              <div className="absolute inset-1.5 rounded-xl border border-yellow-500/30 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-yellow-400 shadow-[0_0_10px_#eab308]" />

              <div>
                {/* Photo Container with Blue Geometric Armor Shape */}
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4 bg-slate-950 border border-blue-500/40 shadow-inner flex items-center justify-center">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-blue-900/60 to-slate-950 flex flex-col items-center justify-center p-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-4xl shadow-xl">
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest mt-3">
                        LEADERSHIP DELEGATION
                      </span>
                    </div>
                  )}

                  {/* Golden Bottom Armor Notch */}
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-yellow-500/20 to-transparent" />
                </div>

                {/* Name & Role */}
                <div className="text-center my-3">
                  <h3 className="text-2xl font-black font-display text-white uppercase tracking-wide group-hover:text-yellow-300 transition-colors">
                    {member.name}
                  </h3>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block mt-1">
                    {member.role}
                  </span>
                </div>

                {/* Short Bio */}
                <p className="text-xs text-slate-300 text-center leading-relaxed px-2 mb-4 line-clamp-3">
                  {member.bio}
                </p>
              </div>

              {/* Action Buttons: Email & Phone Contact (Matching Techfest Card Footer) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => handleCopy(`${member.name.toLowerCase()}@planetx.nmims.edu`, `email-${member.id}`)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-cyan-300 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{member.name.toLowerCase()}@planetx.nmims.edu</span>
                  </span>
                  {copiedId === `email-${member.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-500" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy('+91 9876543210', `phone-${member.id}`)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-cyan-300 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-yellow-400" />
                      <span>+91 98765 43210</span>
                    </span>
                    {copiedId === `phone-${member.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500" />
                    )}
                  </button>

                  {member.socialLink && (
                    <a
                      href={member.socialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
