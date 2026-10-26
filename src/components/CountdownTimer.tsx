import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string; // '2026-11-21'
  isProvisional?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, isProvisional = true }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    const calculateTime = () => {
      // Event date target
      const target = new Date(`${targetDate}T09:00:00`).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400">MISSION COUNTDOWN</span>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">T-Minus to PLANET-X Liftoff</h2>
        </div>
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Target Date: {targetDate}</span>
          {isProvisional && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Provisional
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Days */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white tabular-nums">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-cyan-400/80 mt-1">Days</span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white tabular-nums">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-cyan-400/80 mt-1">Hours</span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <span className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white tabular-nums">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-cyan-400/80 mt-1">Minutes</span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-cyan-500/20">
          <span className="text-3xl sm:text-5xl font-black font-display tracking-tight text-cyan-300 tabular-nums">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-cyan-400 mt-1">Seconds</span>
        </div>
      </div>
    </div>
  );
};
