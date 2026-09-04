import React, { useEffect } from 'react';
import { Sun, Sparkles } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
      <div className="z-10 flex flex-col items-center text-center px-4">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-amber-400 p-0.5 shadow-2xl shadow-blue-500/50 animate-bounce">
            <div className="w-full h-full bg-slate-950 rounded-3xl flex items-center justify-center">
              <Sun className="w-12 h-12 text-amber-400 animate-[spin_8s_linear_infinite]" />
            </div>
          </div>
          <Sparkles className="absolute -top-2 -right-2 text-blue-400 animate-pulse w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-amber-200 to-indigo-300">
          AtmosCopilot
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-md tracking-wide leading-relaxed">
          Voice-First Multilingual Assistant for Hyper-Local Weather Intelligence
        </p>
        <div className="mt-8 flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping delay-100"></div>
        </div>
      </div>
    </div>
  );
}