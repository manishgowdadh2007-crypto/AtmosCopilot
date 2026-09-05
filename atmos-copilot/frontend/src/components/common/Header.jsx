import React, { useState } from 'react';
import { Sun, MapPin, Satellite, Menu, X, User, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function Header({ weather, coords, user, currentPage, setCurrentPage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const locationLabel =
    weather?.resolved_city ||
    (coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring GPS...");

  const handleNavigation = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#070a13] px-4 sm:px-6 flex items-center justify-between z-40 text-white select-none relative">
        {/* Brand & Micro-Locality */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs sm:text-sm tracking-wide text-slate-100 leading-none">
              AtmosCopilot
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 min-w-0">
              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate max-w-[170px] sm:max-w-[280px] text-slate-300 font-medium">
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View: Horizontal Navigation Pill (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setCurrentPage('home')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              currentPage === 'home'
                ? 'bg-slate-800 text-white shadow-md font-semibold border border-slate-700/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Observatory
          </button>

          <button
            onClick={() => setCurrentPage('satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              currentPage === 'copilot'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Sun Copilot</span>
          </button>
        </nav>

        {/* Mobile View: Hamburger Button (Visible only on screens below 768px) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation drawer"
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
        >
          {menuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#070a13] p-5 flex flex-col space-y-5 border-t border-slate-800 overflow-y-auto">
          {/* Navigation Controls */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Navigation
            </span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => handleNavigation('home')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                  currentPage === 'home'
                    ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <span>Observatory</span>
                <span className="text-xs text-slate-500">Live Deck</span>
              </button>

              <button
                onClick={() => handleNavigation('satellite')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                  currentPage === 'satellite'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" />
                  <span>Satellite</span>
                </div>
                <span className="text-xs text-blue-200">Radar HD</span>
              </button>

              <button
                onClick={() => handleNavigation('copilot')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold border transition ${
                  currentPage === 'copilot'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span>Sun Copilot</span>
                </div>
                <span className="text-xs opacity-75">AI Telemetry</span>
              </button>
            </div>
          </div>

          {/* User Session Credentials */}
          <div className="bg-[#0c101c] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                User Credentials
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACTIVE SESSION</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <User className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate font-medium">{user?.name || "Operator"}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="truncate font-mono">{user?.email || "operator@domain.in"}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono">{user?.phone || "+91 9876543210"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex justify-between">
              <span>Device GPS:</span>
              <span className="text-slate-400">
                {coords ? `${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}°` : "Syncing..."}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
