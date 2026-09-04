import React from 'react';
import { Sun, MapPin, Satellite } from 'lucide-react';

export default function Header({ weather, coords, currentPage, setCurrentPage }) {
  const locationLabel = weather?.resolved_city || (coords ? `${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E` : "Locating area...");

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-50 text-white select-none">
      {/* Location Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
          <Sun className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="font-bold text-sm tracking-wide leading-tight">AtmosCopilot</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
            <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[240px] text-slate-300">
              {locationLabel}
            </span>
          </p>
        </div>
      </div>

      {/* Navigation Switcher: Observatory | Satellite | Sun Copilot */}
      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 shadow-inner">
        <button 
          onClick={() => setCurrentPage('home')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium transition ${
            currentPage === 'home' 
              ? 'bg-slate-800 text-white shadow-md font-semibold border border-slate-700/50' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Observatory
        </button>

        <button 
          onClick={() => setCurrentPage('satellite')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
            currentPage === 'satellite' 
              ? 'bg-blue-600 text-white font-bold shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button 
          onClick={() => setCurrentPage('copilot')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
            currentPage === 'copilot' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sun</span> Copilot
        </button>
      </nav>
    </header>
  );
}
