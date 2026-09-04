import React from 'react';
import { Sun, MapPin } from 'lucide-react';

export default function Header({ coords, currentPage, setCurrentPage }) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
          <Sun className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide">AtmosCopilot</h1>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            {coords ? `${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E` : "Locating coordinates..."}
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${
            currentPage === 'home' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Observatory
        </button>
        <button 
          onClick={() => setCurrentPage('copilot')}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
            currentPage === 'copilot' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          Sun Copilot
        </button>
      </nav>
    </header>
  );
}