import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Play the full luxury reveal animation (approx 3.2 seconds)
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 600);
    }, 3200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080A0E] text-slate-200 overflow-hidden transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Ambient Celestial Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(43,67,110,0.35)_0%,rgba(8,10,14,0)_70%)] pointer-events-none" />

      {/* Brand Stage */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* SVG Luxury Emblem */}
        <svg className="w-36 h-36 drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="splashGoldSheen" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF5DF" />
              <stop offset="35%" stopColor="#DFC184" />
              <stop offset="70%" stopColor="#AA8440" />
              <stop offset="100%" stopColor="#EED6A5" />
            </linearGradient>

            <linearGradient id="splashGlintGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <radialGradient id="splashGlassFill" cx="80" cy="80" r="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#141923" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#090B0F" stopOpacity="0.95" />
            </radialGradient>

            <clipPath id="splashClip">
              <rect x="12" y="12" width="136" height="136" rx="36" />
            </clipPath>
          </defs>

          {/* Glass Capsule Outer Container */}
          <rect 
            x="12" y="12" width="136" height="136" rx="36" 
            fill="url(#splashGlassFill)" 
            stroke="url(#splashGoldSheen)" 
            strokeWidth="1.5" 
            className="animate-[drawOutline_2.2s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            style={{ strokeDasharray: 450, strokeDashoffset: 450 }}
          />

          <g clipPath="url(#splashClip)">
            {/* Concentric Isobar Waves */}
            <circle 
              cx="80" cy="80" r="48" 
              stroke="url(#splashGoldSheen)" strokeWidth="1.2" strokeOpacity="0.35" 
              className="animate-[drawOutline_2.2s_cubic-bezier(0.16,1,0.3,1)_forwards]"
              style={{ strokeDasharray: 450, strokeDashoffset: 450 }}
            />
            <circle 
              cx="80" cy="80" r="34" 
              stroke="url(#splashGoldSheen)" strokeWidth="1.6" strokeOpacity="0.65" strokeDasharray="6 3" 
              className="animate-[drawOutline_1.8s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards]"
              style={{ strokeDasharray: 200, strokeDashoffset: 200 }}
            />
            <circle 
              cx="80" cy="80" r="20" 
              stroke="url(#splashGoldSheen)" strokeWidth="1.8" 
              className="animate-[drawOutline_1.8s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards]"
              style={{ strokeDasharray: 200, strokeDashoffset: 200 }}
            />

            {/* Compass Diamond Apex */}
            <g className="animate-[fadeNeedle_1.4s_cubic-bezier(0.16,1,0.3,1)_0.9s_forwards] opacity-0">
              <polygon points="80,48 85,80 80,75 75,80" fill="url(#splashGoldSheen)" />
              <polygon points="80,112 85,80 80,85 75,80" fill="#88682D" />
              <circle cx="80" cy="80" r="3.2" fill="#FFF9ED" />
            </g>

            {/* Specular Shimmer Ray */}
            <rect 
              x="0" y="0" width="160" height="160" 
              fill="url(#splashGlintGradient)" 
              className="animate-[shimmerSweep_1.4s_cubic-bezier(0.4,0,0.2,1)_1.6s_forwards] -translate-x-[150%]"
              opacity="0.6" 
              style={{ mixBlendMode: 'overlay' }} 
            />
          </g>
        </svg>

        {/* Typography Block */}
        <div className="mt-8 text-center animate-[fadeUpText_1.2s_cubic-bezier(0.16,1,0.3,1)_1.4s_forwards] opacity-0">
          <div className="text-2xl font-bold tracking-[0.28em] bg-gradient-to-r from-[#FFF6DD] via-[#DFC184] to-[#9E7B3A] bg-clip-text text-transparent uppercase font-serif">
            AtmosCopilot
          </div>
          <div className="text-[10px] tracking-[0.25em] text-slate-400 uppercase mt-2 font-mono">
            Voice-First Hyper-Local Intelligence
          </div>
        </div>

        {/* Tactical Loading Beacons */}
        <div className="flex gap-2 mt-7">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping delay-150" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping delay-300" />
        </div>

      </div>

      <style>{`
        @keyframes drawOutline {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeNeedle {
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmerSweep {
          to { transform: translateX(150%); }
        }
        @keyframes fadeUpText {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
