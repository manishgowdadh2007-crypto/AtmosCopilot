import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
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

export default function Header({ 
  weather, 
  coords, 
  user, 
  currentPage, 
  setCurrentPage, 
  onLogout, 
  lang = 'en',
  theme = 'dark',
  setTheme
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = translations[lang] || translations.en;

  const locationLabel =
    weather?.resolved_city ||
    (coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring GPS...");

  const handleNav = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (setTheme) {
      setTheme(nextTheme);
      localStorage.setItem('atmos_theme', nextTheme);
    }
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
      <header className={`h-16 px-4 sm:px-6 flex items-center justify-between border-b backdrop-blur-xl transition-colors duration-300 z-40 select-none relative ${
        theme === 'dark'
          ? 'bg-[#070a13]/90 border-slate-800/80 text-white'
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        {/* Brand & Micro-Locality */}
        <div 
          className="flex items-center gap-2.5 min-w-0 flex-shrink-0 cursor-pointer"
          onClick={() => handleNav('home')}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-500">
            <Compass className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className={`font-bold text-xs sm:text-sm tracking-wide leading-none ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              AtmosCopilot
            </span>
            <div className="flex items-center gap-1 text-[11px] mt-1 min-w-0">
              <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span className={`truncate max-w-[120px] sm:max-w-[200px] font-medium ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View: Navigation Modules */}
        <nav className={`hidden md:flex items-center gap-1 p-1.5 rounded-2xl border shadow-inner overflow-x-auto max-w-[60vw] lg:max-w-[68vw] scrollbar-none transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-[#0d1322]/80 border-slate-700/60' 
            : 'bg-slate-100/90 border-slate-300/80'
        }`}>
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
                    : theme === 'dark'
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'alerts' && weather?.current?.precipitation > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Theme Toggle, Logout & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle display theme"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`p-2 rounded-xl border transition ${
              theme === 'dark'
                ? 'bg-[#0d1322] border-slate-700/60 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200 shadow-sm'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className={`hidden sm:flex p-2 rounded-xl border transition ${
                theme === 'dark'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                  : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation drawer"
            className={`md:hidden flex items-center justify-center w-9 h-9 rounded-xl border active:scale-95 transition ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950 shadow-sm'
            }`}
          >
            {menuOpen ? <X className="w-5 h-5 text-amber-500" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className={`md:hidden fixed inset-x-0 top-16 bottom-0 z-50 p-5 flex flex-col space-y-4 border-t overflow-y-auto backdrop-blur-2xl transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-[#070a13]/98 border-slate-800 text-white'
            : 'bg-white/98 border-slate-200 text-slate-900 shadow-2xl'
        }`}>
          <span className={`text-[10px] uppercase font-bold tracking-widest ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
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
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/20"
                      : theme === 'dark'
                      ? "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/40"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70"
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

          {/* User Session & Logout in Mobile Drawer */}
          <div className={`mt-auto pt-4 border-t flex items-center justify-between text-xs ${
            theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="truncate max-w-[180px] font-medium">{user?.name || "Operator Terminal"}</span>
            </div>
            {onLogout && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold"
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
