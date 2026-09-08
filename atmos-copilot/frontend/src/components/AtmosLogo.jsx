import React, { useRef } from 'react';

export default function AtmosLogo({ className = "w-full max-w-xl", onComplete }) {
  const containerRef = useRef(null);

  const playAtmosphericBoom = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Sub-bass sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.85);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);

      // Shimmering harmonic accent
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(580, ctx.currentTime);
      shimmer.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      shimmer.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.7);

      shimmerGain.gain.setValueAtTime(0.001, ctx.currentTime);
      shimmerGain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.08);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      osc.start();
      shimmer.start();
      osc.stop(ctx.currentTime + 0.95);
      shimmer.stop(ctx.currentTime + 0.75);
    } catch (err) {
      console.warn("Audio autoplay prevented or unsupported:", err);
    }
  };

  const handleReplay = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Reset animations
    const clone = svg.cloneNode(true);
    svg.parentNode.replaceChild(clone, svg);

    // Audio cue synced with the 1.5s sun burst
    setTimeout(() => {
      playAtmosphericBoom();
      if (onComplete) onComplete();
    }, 1500);
  };

  return (
    <div 
      ref={containerRef} 
      onClick={handleReplay} 
      className={`cursor-pointer select-none transition-transform hover:scale-[1.01] active:scale-[0.99] ${className}`}
      title="Click to replay animation with audio"
    >
      <style>{`
        .anim-text-atmos {
          opacity: 0;
          transform: translateX(-16px);
          animation: revealText 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
        .anim-badge-copilot {
          opacity: 0;
          transform: scale(0.85) translateX(10px);
          animation: revealBadge 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s forwards;
        }
        .anim-subtitle {
          opacity: 0;
          animation: fadeIn 0.8s ease 1.0s forwards;
        }
        .anim-container-box {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: drawFrame 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        .anim-logo-orbit {
          opacity: 0;
          transform-origin: 68px 60px;
          animation: spinIn 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards, spinLoop 14s linear 2.0s infinite;
        }
        .anim-logo-core {
          opacity: 0;
          transform-origin: 68px 60px;
          animation: logoBurst 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards;
        }
        @keyframes revealText { to { opacity: 1; transform: translateX(0); } }
        @keyframes revealBadge { to { opacity: 1; transform: scale(1) translateX(0); } }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes drawFrame { to { stroke-dashoffset: 0; } }
        @keyframes spinIn {
          from { opacity: 0; transform: scale(0.3) rotate(-90deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes spinLoop { to { transform: rotate(360deg); } }
        @keyframes logoBurst {
          0% { opacity: 0; transform: scale(0.2); }
          60% { opacity: 1; transform: scale(1.45); }
          80% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>

      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 540 120" 
        className="w-full h-auto block drop-shadow-[0_15px_30px_rgba(2,132,199,0.3)]"
      >
        <defs>
          <linearGradient id="blockBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1120" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="solarGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>

          <linearGradient id="streamlineGlow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="badgeFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect className="anim-container-box" x="3" y="3" width="534" height="114" rx="22" ry="22" fill="url(#blockBg)" stroke="url(#borderGlow)" strokeWidth="2" />
        <text className="anim-text-atmos" x="146" y="73" fontFamily="system-ui, -apple-system, sans-serif" fontSize="40" fontWeight="900" letterSpacing="4" fill="#f8fafc">ATMOS</text>

        <g className="anim-badge-copilot" transform="translate(348, 41)">
          <rect x="0" y="0" width="168" height="38" rx="10" ry="10" fill="url(#badgeFill)" />
          <text x="14" y="24" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" letterSpacing="3" fill="#ffffff">COPILOT</text>
          <circle cx="146" cy="19" r="4.5" fill="#38bdf8" filter="url(#glow)" />
          <circle cx="146" cy="19" r="3.5" fill="#e0f2fe" />
        </g>

        <text className="anim-subtitle" x="148" y="93" fontFamily="monospace" fontSize="9" fontWeight="600" letterSpacing="2.8" fill="#64748b">HYPER-LOCAL ATMOSPHERIC INTELLIGENCE</text>
        <line className="anim-subtitle" x1="126" y1="28" x2="126" y2="92" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />

        <g className="anim-subtitle">
          <circle cx="68" cy="60" r="42" fill="none" stroke="#38bdf8" strokeOpacity="0.08" strokeWidth="1" />
          <circle cx="68" cy="60" r="32" fill="none" stroke="#38bdf8" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="3 3" />
        </g>

        <g className="anim-logo-orbit">
          <path d="M 40 60 A 28 28 0 1 1 84 78" fill="none" stroke="url(#streamlineGlow)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 88 52 A 22 22 0 0 1 68 82" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
          <circle cx="96" cy="60" r="3.5" fill="#f59e0b" />
        </g>

        <g className="anim-logo-core">
          <circle cx="68" cy="60" r="14" fill="url(#solarGlow)" filter="url(#glow)" />
          <circle cx="68" cy="60" r="14" fill="url(#solarGlow)" />
          <circle cx="68" cy="60" r="7" fill="#fef08a" />
        </g>
      </svg>
    </div>
  );
}
