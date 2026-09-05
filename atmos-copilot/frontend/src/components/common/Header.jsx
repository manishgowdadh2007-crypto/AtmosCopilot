import React, { useState } from 'react';
import { Sun, MapPin, Satellite, Menu, X, User, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function Header({ weather, coords, user, currentPage, setCurrentPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locationLabel =
    weather?.resolved_city ||
    (coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring GPS...");

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#070a13]/95 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between z-40 text-white select-none relative">
        {/* Left Side: Brand Logo & Compact Location Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-xs sm:text-sm tracking-wide leading-none text-slate-100">
              AtmosCopilot
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 min-w-0">
              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate max-w-[170px] sm:max-w-[280px] text-slate-300 font-medium">
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Desktop Navigation (Hidden on Mobile) */}
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

        {/* Right Side - Mobile Hamburger Toggle Button (Visible ONLY on Mobile) */}
        <div className="md:hidden flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Full-Screen Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-[#070a13]/98 backdrop-blur-2xl flex flex-col p-4 border-t border-slate-800 space-y-5 overflow-y-auto">
          {/* Navigation Controls */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1">
              Navigation Menu
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                  currentPage === 'home'
                    ? 'bg-slate-800 text-white border-slate-700 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800'
                }`}
              >
                <span>Observatory Deck</span>
                <span className="text-xs text-slate-400 font-mono">Live Feed</span>
              </button>

              <button
                onClick={() => handleNavClick('satellite')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                  currentPage === 'satellite'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" />
                  <span>Satellite Live</span>
                </div>
                <span className="text-xs text-blue-200 font-mono">HD Map</span>
              </button>

              <button
                onClick={() => handleNavClick('copilot')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold border transition ${
                  currentPage === 'copilot'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span>Sun Copilot AI</span>
                </div>
                <span className="text-xs opacity-75 font-mono">Assistant</span>
              </button>
            </div>
          </div>

          {/* User Session Credentials Card */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                User Session Profile
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ACTIVE</span>
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

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex justify-between">
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
