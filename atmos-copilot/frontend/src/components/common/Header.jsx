import React, { useState } from 'react';
import { Sun, MapPin, Satellite, Menu, X, User, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function Header({ weather, coords, user, currentPage, setCurrentPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locationLabel =
    weather?.resolved_city ||
    (coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring location...");

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 text-white select-none relative">
        {/* Brand & GPS Locality */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-sm tracking-wide leading-tight">AtmosCopilot</h1>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 font-medium truncate">
              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[260px] text-slate-300">
                {locationLabel}
              </span>
            </p>
          </div>
        </div>

        {/* Desktop View: Horizontal Pill Navigation (Hidden on Mobile) */}
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

        {/* Mobile View: Hamburger Button (Visible ONLY on Mobile) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none transition active:scale-95"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-[#05070e]/95 backdrop-blur-2xl flex flex-col p-5 border-t border-slate-800 animate-fadeIn space-y-6 overflow-y-auto">
          {/* Navigation Links */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Navigation Menu
            </span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                  currentPage === 'home'
                    ? 'bg-slate-800 text-white border-slate-700 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <span>Observatory Deck</span>
                <span className="text-xs text-slate-400">Telemetry</span>
              </button>

              <button
                onClick={() => handleNavClick('satellite')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                  currentPage === 'satellite'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" />
                  <span>Satellite Live</span>
                </div>
                <span className="text-xs text-blue-200">Radar HD</span>
              </button>

              <button
                onClick={() => handleNavClick('copilot')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold border transition ${
                  currentPage === 'copilot'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span>Sun Copilot AI</span>
                </div>
                <span className="text-xs opacity-75">Intelligence</span>
              </button>
            </div>
          </div>

          {/* User Registration Credentials Card */}
          <div className="bg-[#0c101c] border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Active User Credentials
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AUTHENTICATED</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <User className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate font-medium">{user?.name || "Operator Terminal"}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="truncate font-mono">{user?.email || "operator@atmos.io"}</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-mono">{user?.phone || "+91 98765 43210"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex justify-between">
              <span>Hardware GPS:</span>
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
