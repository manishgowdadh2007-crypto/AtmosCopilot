import React, { useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      onClick={() => onFinish && onFinish()} 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050811] text-white p-4 cursor-pointer select-none"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
          <span className="text-3xl animate-pulse">☀️</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-amber-300 to-amber-500">
          AtmosCopilot
        </h1>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-mono">
          Voice-First Multilingual Assistant for Hyper-Local Weather Intelligence
        </p>

        <div className="flex gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
