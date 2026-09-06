import React, { useState } from 'react';
import { 
  Sun, 
  MapPin, 
  Satellite, 
  Compass, 
  AlertTriangle, 
  Sprout, 
  Navigation, 
  AlertOctagon, 
  History, 
  Settings, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { translations } from '../../utils/translations';

export default function Header({ weather, coords, user, currentPage, setCurrentPage, onLogout, lang = 'en' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  const locationLabel =
    weather?.resolved_city ||
    (coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring GPS...");

  const handleNav = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: t.observatory, icon: Compass },
    { id: 'satellite', label: t.satellite, icon: Satellite },
    { id: 'copilot', label: t.sunCopilot, icon: Sun },
    { id: 'agri', label: t.agri, icon: Sprout },
    { id: 'routes', label: t.routePlanner, icon: Navigation },
    { id: 'disaster', label: t.disaster, icon: AlertOctagon },
    { id: 'climate', label: t.climate, icon: History },
    { id: 'alerts', label: t.alerts, icon: AlertTriangle },
    { id: 'history', label: t.history, icon: History },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#070a13]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-40 text-white select-none relative">
        {/* Brand & Micro-Locality */}
        <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs sm:text-sm tracking-wide text-slate-100 leading-none">
              AtmosCopilot
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 min-w-0">
              <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[200px] text-slate-300 font-medium">
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View: Horizontal Scrollable Suite for all 10 Navigation Modules */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#0d1322]/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-inner overflow-x-auto max-w-[70vw] scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition flex-shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'alerts' && weather?.current?.precipitation > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile View: Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation drawer"
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
        >
          {menuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#070a13]/98 backdrop-blur-2xl p-5 flex flex-col space-y-4 border-t border-slate-800 overflow-y-auto">
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
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg"
                      : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs opacity-60 font-mono">View</span>
                </button>
              );
            })}
          </div>

          {/* User Profile & Logout Teleport in Drawer */}
          <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="truncate max-w-[180px]">{user?.name || "Operator Terminal"}</span>
            </div>
            {onLogout && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
