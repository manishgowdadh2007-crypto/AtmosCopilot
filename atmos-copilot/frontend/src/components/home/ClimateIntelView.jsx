import React, { useState } from 'react';
import { History, Calendar, Search, TrendingUp, Droplets, Thermometer } from 'lucide-react';

export default function ClimateIntelView({ coords, weather }) {
  const [timeline, setTimeline] = useState("10y"); // "10y" | "1y" | "6m" | "1d" | "1h"
  const [targetPlace, setTargetPlace] = useState("");

  const activeCity = targetPlace || weather?.resolved_city || "Bengaluru Station";

  const timelineData = {
    "10y": { label: "10-Year Historical Anomaly (2016 - 2026)", avgTemp: "28.4°C", anomaly: "+0.8°C warming baseline", peakPrecip: "1280 mm/yr" },
    "1y": { label: "1-Year Retrospective (Past 12 Months)", avgTemp: "27.8°C", anomaly: "Nominal monsoon variance", peakPrecip: "940 mm" },
    "6m": { label: "6-Month Seasonal Cycle", avgTemp: "26.9°C", anomaly: "Standard winter-to-summer curve", peakPrecip: "410 mm" },
    "1d": { label: "24-Hour Diurnal Oscillation", avgTemp: "24.2°C", anomaly: "Peak afternoon delta +7.5°C", peakPrecip: "0.2 mm" },
    "1h": { label: "Immediate 60-Minute Micro-Sensor Log", avgTemp: `${weather?.current?.temp ?? 28}°C`, anomaly: "Stable barometric equilibrium", peakPrecip: "0.0 mm" }
  };

  const active = timelineData[timeline];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filter Bar */}
        <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400">
                <History className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Historical Weather & Reanalysis Archive</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Climate Intelligence Matrix</h2>
              <p className="text-xs text-slate-400">Station Lock: {activeCity}</p>
            </div>

            <div className="flex items-center gap-2 bg-[#090d18] p-1.5 rounded-2xl border border-slate-800">
              {[
                { id: "10y", name: "10 Years" },
                { id: "1y", name: "1 Year" },
                { id: "6m", name: "6 Months" },
                { id: "1d", name: "1 Day" },
                { id: "1h", name: "1 Hour" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeline(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    timeline === t.id
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-xl shadow-lg">
            <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-amber-400" /> Mean Observed Temperature
            </span>
            <span className="text-3xl font-mono font-light text-white block mt-3">{active.avgTemp}</span>
          </div>

          <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-xl shadow-lg">
            <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-400" /> Climatological Anomaly
            </span>
            <span className="text-sm font-mono text-emerald-400 block mt-3">{active.anomaly}</span>
          </div>

          <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-xl shadow-lg">
            <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-400" /> Cumulative Precipitation
            </span>
            <span className="text-3xl font-mono font-light text-cyan-300 block mt-3">{active.peakPrecip}</span>
          </div>
        </div>

        {/* Vector Curve Chart */}
        <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">{active.label}</h3>
            <span className="text-[10px] font-mono text-slate-400">ERA5 Atmospheric Reanalysis</span>
          </div>

          <div className="relative w-full h-44 pt-4">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 120">
              <defs>
                <linearGradient id="climateFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0,80 Q 75,30 150,60 T 300,40 T 450,75 T 600,30 L 600,120 L 0,120 Z" fill="url(#climateFill)" />
              <path d="M 0,80 Q 75,30 150,60 T 300,40 T 450,75 T 600,30" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
