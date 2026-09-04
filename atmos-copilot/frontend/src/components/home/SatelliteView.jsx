import React, { useState } from "react";

export default function SatelliteView({ coords, weather }) {
  const [activeLayer, setActiveLayer] = useState("satellite"); // "satellite", "radar", "wind", "rain"
  const [isPlaying, setIsPlaying] = useState(false);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;

  const embedUrl = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=8&overlay=${
    activeLayer === "radar"
      ? "radar"
      : activeLayer === "wind"
      ? "wind"
      : activeLayer === "rain"
      ? "rain"
      : "satellite"
  }&product=satellite&level=surface&lat=${lat}&lon=${lon}`;

  return (
    <div className="relative w-full h-full bg-[#05070e] overflow-hidden select-none">
      {/* 1. Scaled & Offset Iframe: Pushes top header watermark and bottom edges completely outside view boundary */}
      <iframe
        title="Live Satellite Telemetry"
        src={embedUrl}
        className="absolute -top-12 -left-2 w-[calc(100%+16px)] h-[calc(100%+100px)] border-0 filter saturate-[1.1] contrast-[1.05]"
        allow="geolocation"
      />

      {/* 2. Top-Right Corner Shield: Completely blocks any lingering logo badge */}
      <div className="absolute top-0 right-0 w-48 h-14 bg-gradient-to-b from-[#080b14] via-[#080b14]/70 to-transparent pointer-events-none z-10" />

      {/* 3. Floating Left Layers Menu */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 p-2.5 rounded-2xl shadow-2xl">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1">
          Live Maps
        </div>
        <button
          onClick={() => setActiveLayer("satellite")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeLayer === "satellite"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          🛰️ <span>Satellite HD</span>
        </button>
        <button
          onClick={() => setActiveLayer("radar")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeLayer === "radar"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          📡 <span>Radar Live</span>
        </button>
        <button
          onClick={() => setActiveLayer("wind")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeLayer === "wind"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          💨 <span>Wind Stream</span>
        </button>
        <button
          onClick={() => setActiveLayer("rain")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeLayer === "rain"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          🌧️ <span>Precipitation</span>
        </button>
      </div>

      {/* 4. Target Coordinates Card (Positioned at Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col bg-[#0c101c]/95 backdrop-blur-md border border-slate-700/70 p-4 rounded-2xl shadow-2xl w-64">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-2">
          <span>Target Coordinates</span>
          <span className="text-emerald-400 font-mono text-[10px] tracking-wider">LIVE SYNC</span>
        </div>
        <div className="font-semibold text-white text-sm mt-2 truncate">
          {weather?.resolved_city || "Jalahalli, Karnataka"}
        </div>
        <div className="font-mono text-xs text-slate-400 mt-0.5">
          {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">TEMP</span>
            <span className="text-amber-400 font-mono font-bold text-base">
              {weather?.current?.temp ?? 25}°C
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">WIND</span>
            <span className="text-white font-mono font-bold text-base">
              {weather?.current?.wind ?? 18} km/h
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Timeline Scrub Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-3 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-md transition"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <span className="font-mono text-slate-300 text-[11px]">Live Loop</span>
        <div className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 w-3/4 animate-pulse" />
        </div>
        <span className="text-[10px] font-mono text-amber-400">Synced</span>
      </div>
    </div>
  );
}
