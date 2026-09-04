import React, { useMemo } from 'react';

export default function AmbientBg({ children }) {
  const currentGradient = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return 'from-amber-950/40 via-blue-950/80 to-slate-950'; // Morning
    } else if (hour >= 11 && hour < 16) {
      return 'from-sky-900/50 via-slate-900 to-slate-950';     // Noon
    } else if (hour >= 16 && hour < 19) {
      return 'from-orange-950/60 via-purple-950/40 to-slate-950'; // Sunset
    } else {
      return 'from-slate-950 via-indigo-950/40 to-black';      // Night
    }
  }, []);

  return (
    <div className={`h-screen w-screen bg-gradient-to-b ${currentGradient} text-slate-100 font-sans flex flex-col relative overflow-hidden transition-colors duration-1000`}>
      {/* Dynamic Animated Particles (Wind/Rain Streaks) */}
      <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{
              left: `${(i * 8.5) + 2}%`,
              top: `${(i % 3) * 20}%`,
              animationDelay: `${(i * 0.4)}s`,
              animationDuration: `${2.5 + (i % 3)}s`
            }} 
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col h-full w-full">
        {children}
      </div>
    </div>
  );
}