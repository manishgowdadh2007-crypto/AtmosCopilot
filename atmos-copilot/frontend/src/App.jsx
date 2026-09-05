import React, { useState } from 'react';
import { Sun, MapPin, Satellite, Bell, History, Settings, Menu, X, ShieldCheck } from 'lucide-react';

export default function Header({ weather, coords, user, currentPage, setCurrentPage, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const locationLabel =
    weather?.resolved_city ||
    (coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring GPS...");

  const handleNav = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Observatory', icon: null },
    { id: 'satellite', label: 'Satellite', icon: Satellite },
    { id: 'copilot', label: 'Sun Copilot', icon: Sun },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#070a13]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-40 text-white select-none relative">
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
              <span className="truncate max-w-[150px] sm:max-w-[260px] text-slate-300 font-medium">
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View: Comprehensive Navigation Pill Bar */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0d1322]/80 p-1 rounded-2xl border border-slate-700/60 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                  isActive
                    ? item.id === 'satellite'
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : item.id === 'copilot'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : item.id === 'alerts'
                      ? 'bg-rose-500 text-white font-bold shadow-md'
                      : 'bg-slate-800 text-white shadow-md font-semibold border border-slate-700/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
                {item.id === 'alerts' && weather?.current?.precipitation > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile View: Hamburger Button (Visible only < 1024px) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation drawer"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
        >
          {menuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#070a13]/98 backdrop-blur-2xl p-5 flex flex-col space-y-4 border-t border-slate-800 overflow-y-auto">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Navigation Suite
          </span>
          <div className="grid grid-cols-1 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border transition ${
                    isActive
                      ? item.id === 'alerts'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg'
                        : item.id === 'copilot'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg'
                        : 'bg-slate-800 text-white border-slate-700 shadow-md'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs opacity-60 font-mono">View</span>
                </button>
              );
            })}
          </div>

          {/* Profile & Logout Section */}
          <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="truncate max-w-[180px]">{user?.name || "Operator Terminal"}</span>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
