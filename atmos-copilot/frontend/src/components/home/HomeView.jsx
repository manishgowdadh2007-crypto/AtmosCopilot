import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Droplets, 
  CloudRain, 
  Sun, 
  Activity, 
  RefreshCw, 
  MapPin, 
  Compass 
} from 'lucide-react';

export default function HomeView({ coords, weather, theme = 'dark', onRefreshGPS }) {
  const [activeDiurnalTab, setActiveDiurnalTab] = useState('temp'); // 'temp' | 'precip' | 'wind'
  const [currentTime, setCurrentTime] = useState('');

  // Precise live minute-by-minute / second clock synchronization
  useEffect(() => {
    const syncTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    syncTime();
    const timer = setInterval(syncTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const cur = weather?.current || {
    temp: 28,
    condition: "Partly Cloudy",
    humidity: 50,
    wind: 9,
    precipitation: 0,
    dew_point: 18,
    aqi: 42,
    uv_index: 0
  };

  const lat = coords?.lat || 12.9642;
  const lon = coords?.lon || 77.5584;
  const cityName = weather?.resolved_city || "IPD Salappa Ward, Bengaluru";

  // Light Mode: Soft frosted card surfaces with deep slate contrast borders
  // Dark Mode: Deep aerospace obsidian cards
  const cardStyle = theme === 'dark'
    ? 'bg-[#0d1322]/85 border-slate-700/60 text-white shadow-2xl shadow-black/40'
    : 'bg-white/85 border-[#cbd5e1] text-slate-900 shadow-xl shadow-slate-300/60 backdrop-blur-md';

  const subCardStyle = theme === 'dark'
    ? 'bg-[#080d1a] border-slate-800/80 text-slate-200'
    : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800';

  const hourlyData = weather?.hourly || [
    { time: "6 pm", temp: 28, precip: 0, wind: 9 },
    { time: "9 pm", temp: 26, precip: 0, wind: 8 },
    { time: "12 am", temp: 24, precip: 0, wind: 7 },
    { time: "3 am", temp: 22, precip: 0, wind: 7 },
    { time: "6 am", temp: 22, precip: 0, wind: 8 },
    { time: "9 am", temp: 27, precip: 0, wind: 10 },
    { time: "12 pm", temp: 31, precip: 0, wind: 12 },
    { time: "3 pm", temp: 32, precip: 0, wind: 11 }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. TOP METEOROLOGICAL TELEMETRY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Station Hero Card */}
          <div className={`lg:col-span-2 border rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between ${cardStyle}`}>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">
                    Live Telemetry Feed
                  </span>
                  <button
                    onClick={onRefreshGPS}
                    className={`ml-2 px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1 border transition ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white'
                        : 'border-slate-300 bg-white/70 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Refresh GPS</span>
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-amber-500 font-bold block">{currentTime}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">{cityName}</h1>
              <p className="text-xs font-mono opacity-60 mt-0.5">
                Hardware GPS: {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
              </p>
            </div>

            <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-amber-500">
                  {cur.temp}°<span className="text-2xl font-bold font-sans">C</span>
                </span>
                <div>
                  <span className="text-base font-bold block leading-tight">{cur.condition}</span>
                  <span className="text-[11px] font-mono opacity-60">Precipitation: {cur.precipitation}%</span>
                </div>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Sun className="w-9 h-9 animate-spin-slow" />
              </div>
            </div>
          </div>

          {/* Auxiliary Atmospheric Vectors (2x2 Matrix) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Wind Velocity */}
            <div className={`border rounded-3xl p-4.5 flex flex-col justify-between ${cardStyle}`}>
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">Wind Velocity</span>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight block">
                  {cur.wind} <span className="text-xs font-normal">km/h</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-500 block mt-1">Surface Vector</span>
              </div>
            </div>

            {/* Relative Humidity */}
            <div className={`border rounded-3xl p-4.5 flex flex-col justify-between ${cardStyle}`}>
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">Relative Humidity</span>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight block">
                  {cur.humidity} <span className="text-xs font-normal">%</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-500 block mt-1">Atmospheric Moisture</span>
              </div>
            </div>

            {/* Precipitation Rate */}
            <div className={`border rounded-3xl p-4.5 flex flex-col justify-between ${cardStyle}`}>
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">Precipitation</span>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight block">
                  {cur.precipitation} <span className="text-xs font-normal">%</span>
                </span>
                <span className="text-[10px] font-mono text-blue-500 block mt-1">Model Probability</span>
              </div>
            </div>

            {/* Dew Point */}
            <div className={`border rounded-3xl p-4.5 flex flex-col justify-between ${cardStyle}`}>
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">Dew Point</span>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight block">
                  {cur.dew_point}°<span className="text-xs font-normal">C</span>
                </span>
                <span className="text-[10px] font-mono text-amber-500 block mt-1">Baseline</span>
              </div>
            </div>
          </div>

        </div>

        {/* 2. ENVIRONMENTAL TELEMETRY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Air Quality */}
          <div className={`border rounded-3xl p-5 ${cardStyle}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">Air Quality Index</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                Moderate
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono">{cur.aqi}</span>
              <span className="text-xs opacity-60 font-mono">EAQI</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800">
              <span>PM 2.5: 18 μg/m³</span>
              <span>PM 10: 24 μg/m³</span>
            </div>
          </div>

          {/* Solar & UV */}
          <div className={`border rounded-3xl p-5 ${cardStyle}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">Solar Exposure & UV</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                Low
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono">{cur.uv_index}</span>
              <span className="text-xs opacity-60 font-mono">UVI</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800">
              <span>Burn Window: &gt;60+ min</span>
              <span>Protection: Minimal</span>
            </div>
          </div>

          {/* Agro & Soil */}
          <div className={`border rounded-3xl p-5 ${cardStyle}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">Agro & Evapotranspiration</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold">
                Field Metrics
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">23.5%</span>
              <span className="text-xs opacity-60 font-mono">Saturation</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono opacity-70 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800">
              <span>VPD: 1.57 kPa</span>
              <span>Stress: Elevated</span>
            </div>
          </div>
        </div>

        {/* 3. DIURNAL TREND VECTOR CHART */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl space-y-4 ${cardStyle}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight">Diurnal Trend Vectors</h3>
              <p className="text-[11px] font-mono opacity-60">Continuous 24-hour meteorological projection</p>
            </div>

            <div className={`flex items-center p-1 rounded-xl border ${subCardStyle}`}>
              <button
                onClick={() => setActiveDiurnalTab('temp')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeDiurnalTab === 'temp'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Temperature
              </button>
              <button
                onClick={() => setActiveDiurnalTab('precip')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeDiurnalTab === 'precip'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Precipitation
              </button>
              <button
                onClick={() => setActiveDiurnalTab('wind')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeDiurnalTab === 'wind'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                Wind
              </button>
            </div>
          </div>

          {/* Responsive SVG Polyline Vector Curve */}
          <div className="w-full h-44 relative pt-6">
            <svg className="w-full h-28 overflow-visible" viewBox="0 0 700 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d="M 0 50 Q 100 80 200 85 T 400 85 T 600 20 T 700 15 L 700 100 L 0 100 Z"
                fill="url(#curveGradient)"
              />
              <path
                d="M 0 50 Q 100 80 200 85 T 400 85 T 600 20 T 700 15"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Node Markers with Accurate Labels */}
              {[
                { cx: 20, cy: 50, val: `${hourlyData[0]?.temp || 28}°` },
                { cx: 120, cy: 72, val: `${hourlyData[1]?.temp || 26}°` },
                { cx: 220, cy: 85, val: `${hourlyData[2]?.temp || 24}°` },
                { cx: 320, cy: 85, val: `${hourlyData[3]?.temp || 22}°` },
                { cx: 420, cy: 85, val: `${hourlyData[4]?.temp || 22}°` },
                { cx: 520, cy: 75, val: `${hourlyData[5]?.temp || 27}°` },
                { cx: 620, cy: 22, val: `${hourlyData[6]?.temp || 31}°` },
                { cx: 680, cy: 15, val: `${hourlyData[7]?.temp || 32}°` }
              ].map((dot, idx) => (
                <g key={idx}>
                  <circle cx={dot.cx} cy={dot.cy} r="4" fill="#f59e0b" stroke="#050811" strokeWidth="2" />
                  <text
                    x={dot.cx}
                    y={dot.cy - 9}
                    textAnchor="middle"
                    fill={theme === 'dark' ? '#f1f5f9' : '#0f172a'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {dot.val}
                  </text>
                </g>
              ))}
            </svg>

            {/* Time Axis Labels */}
            <div className="flex justify-between text-[10px] font-mono opacity-60 mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-800">
              {hourlyData.map((h, i) => (
                <span key={i}>{h.time}</span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
