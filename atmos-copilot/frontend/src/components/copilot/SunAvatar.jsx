import React from 'react';
import { Sun } from 'lucide-react';

export default function SunAvatar({ isListening }) {
  return (
    <div className="flex flex-col items-center justify-center my-auto">
      <div className="relative flex items-center justify-center">
        {/* Glow Corona Waves */}
        <div className="absolute w-48 h-48 rounded-full bg-amber-500/20 blur-2xl animate-ping duration-1000"></div>
        <div className="absolute w-36 h-36 rounded-full bg-amber-400/30 blur-lg animate-pulse"></div>

        {/* Sun Core Avatar */}
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-orange-400 to-yellow-200 shadow-[0_0_50px_rgba(245,158,11,0.6)] flex items-center justify-center z-10 transition-transform duration-300 hover:scale-105">
          <Sun className={`w-14 h-14 text-slate-950 ${isListening ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>
      </div>
      <h2 className="mt-6 font-bold text-lg text-amber-200">Sun Copilot Intelligence</h2>
      <p className="text-xs text-slate-400">Strictly streaming live, verified atmospheric telemetry.</p>
    </div>
  );
}