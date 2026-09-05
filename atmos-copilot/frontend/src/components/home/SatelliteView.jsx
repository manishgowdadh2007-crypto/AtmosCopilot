import React, { useState, useEffect } from "react";

export default function SatelliteView({ coords, weather }) {
  // Available views: "radar" (Live Doppler Radar), "satellite" (IR/Visible Sat), "wind" (Kinetic Vector Stream)
  const [activeLayer, setActiveLayer] = useState("radar");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#05070e] overflow-hidden select-none font-sans flex flex-col">
      {/* High-Resolution Dynamic Radar/Satellite Feed */}
      <iframe
        key={activeLayer}
        title="Atmospheric Telemetry Stream"
        src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=8&overlay=${
          activeLayer === "radar" ? "radar" : activeLayer === "satellite" ? "satellite" : "wind"
        }&product=${activeLayer === "satellite" ? "satellite" : "radar"}&level=surface&lat=${lat}&lon=${lon}`}
        className="absolute -top-[52px] -left-2 w-[calc(100%+16px)] h-[calc(100%+100px)] border-0 filter saturate-[1.15] contrast-[1.05]"
      />

      {/* Layer Switcher HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 p-2.5 sm:p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Telemetry Surface
          </span>
        </div>

        <div className="flex flex-col gap-1.5 mt-1.5">
          <button
            onClick={() => setActiveLayer("radar")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "radar"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>🌧️ Bengaluru Doppler Radar</span>
            <span className="text-[10px] font-mono opacity-80 ml-2">Live</span>
          </button>

          <button
            onClick={() => setActiveLayer("satellite")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "satellite"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>🛰️ INSAT / Cloud Satellite</span>
            <span className="text-[10px] font-mono opacity-80 ml-2">IR</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "wind"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>💨 Wind Vector Stream</span>
            <span className="text-[10px] font-mono opacity-80 ml-2">Surface</span>
          </button>
        </div>
      </div>

      {/* Ephemeris & Live Station Status Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200">
        <span className="font-mono text-amber-300 font-semibold">{currentTimeStr}</span>
        <div className="h-4 w-px bg-slate-700" />
        <span className="font-mono text-[11px] text-slate-400">
          🌅 {weather?.current?.sunrise || "06:09"} | 🌇 {weather?.current?.sunset || "18:28"} IST
        </span>
        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
        <span className="font-mono text-[11px] text-emerald-400 hidden sm:inline">
          Station: {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Bengaluru"}
        </span>
      </div>
    </div>
  );
}
