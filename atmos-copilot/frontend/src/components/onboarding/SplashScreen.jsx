import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1. Normal transition timer (vanishes after 3.2 seconds)
    const normalTimer = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 500);
    }, 3200);

    // 2. Hard Fail-safe Timeout: Forces screen to vanish guaranteed within 5 seconds maximum
    const safetyTimer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      clearTimeout(normalTimer);
      clearTimeout(safetyTimer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080A0E] text-slate-200 overflow-hidden transition-opacity duration-500 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Ambient Celestial Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(43,67,110,0.35)_0%,rgba(8,10,14,0)_70%)] pointer-events-none" />

      {/* Brand Stage */}
      <div className="relative z-10 flex flex-col items-center select-none">
        
        {/* SVG Luxury Emblem */}
        <div className="w-36 h-36 flex items-center justify-center drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]">
          <svg className="w-full h-full" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="splashGoldSheen" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF5DF" />
                <stop offset="35%" stopColor="#DFC184" />
                <stop offset="70%" stopColor="#AA8440" />
                <stop offset="100%" stopColor="#EED6A5" />
              </linearGradient>

              <radialGradient id="splashGlassFill" cx="80" cy="80" r="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#141923" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#090B0F" stopOpacity="0.95" />
              </radialGradient>
            </defs>

            {/* Glass Capsule Outer Container */}
            <rect 
              x="12" y="12" width="136" height="136" rx="36" 
              fill="url(#splashGlassFill)" 
              stroke="url(#splashGoldSheen)" 
              strokeWidth="1.5" 
            />

            {/* Concentric Isobar Waves */}
            <circle cx="80" cy="80" r="48" stroke="url(#splashGoldSheen)" strokeWidth="1.2" strokeOpacity="0.35" />
            <circle cx="80" cy="80" r="34" stroke="url(#splashGoldSheen)" strokeWidth="1.6" strokeOpacity="0.65" strokeDasharray="6 3" />
            <circle cx="80" cy="80" r="20" stroke="url(#splashGoldSheen)" strokeWidth="1.8" />

            {/* Compass Diamond Apex */}
            <g>
              <polygon points="80,48 85,80 80,75 75,80" fill="url(#splashGoldSheen)" />
              <polygon points="80,112 85,80 80,85 75,80" fill="#88682D" />
              <circle cx="80" cy="80" r="3.2" fill="#FFF9ED" />
            </g>
          </svg>
        </div>

        {/* Typography Block */}
        <div className="mt-8 text-center">
          <div className="text-2xl font-bold tracking-[0.28em] bg-gradient-to-r from-[#FFF6DD] via-[#DFC184] to-[#9E7B3A] bg-clip-text text-transparent uppercase font-serif">
            AtmosCopilot
          </div>
          <div className="text-[10px] tracking-[0.25em] text-slate-400 uppercase mt-2 font-mono">
            Voice-First Hyper-Local Intelligence
          </div>
        </div>

        {/* Tactical Loading Beacons */}
        <div className="flex gap-2 mt-7">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>

      </div>
    </div>
  );
}
