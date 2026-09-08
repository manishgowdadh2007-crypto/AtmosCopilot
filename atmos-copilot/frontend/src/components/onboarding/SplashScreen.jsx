import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Guarantees dismissal after 1.5s regardless of network or device state
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050811] text-white p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
          <span className="text-3xl animate-pulse">☀️</span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-amber-300 to-amber-500">
          AtmosCopilot
        </h1>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-mono">
          Voice-First Multilingual Assistant for Hyper-Local Weather Intelligence
        </p>

        {/* Loading indicator */}
        <div className="flex gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    </div>
  );
}
