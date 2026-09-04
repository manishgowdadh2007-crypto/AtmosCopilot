import React from 'react';

export default function SunAvatar({ isListening, className = "w-16 h-16" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className={`absolute inset-0 rounded-full bg-amber-500/20 blur-xl ${isListening ? 'animate-ping' : 'animate-pulse'}`} />
      <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-1/2 h-1/2 text-slate-950"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </div>
    </div>
  );
}
