import React, { useState, useEffect } from "react";
import { CloudRain, Satellite, Wind, RefreshCw } from "lucide-react";

export default function SatelliteView({ coords, weather }) {
  const [activeLayer, setActiveLayer] = useState("radar");
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-IN", {
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

  const getStreamUrl = () => {
    // 1. Live Doppler Precipitation Radar (RainViewer)
    if (activeLayer === "radar") {
      return `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&oFa=0&oc=1&layer=radar&sm=1&sn=1`;
    }
    // 2. Global Infrared Cloud Coverage (RainViewer Satellite - Frame-safe)
    if (activeLayer === "satellite") {
      return `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&oFa=0&oc=1&layer=satellite&sm=1&sn=1`;
    }
    // 3. OpenStreetMap Wind Vector Surface Layer (Frame-safe)
    return `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=7&overlay=wind&product=ecmwf&level=surface&lat=${lat}&lon=${lon}`;
  };

  return (
    <div 
      className="relative w-full bg-[#05070e] overflow-hidden select-none font-sans"
      style={{ height: "calc(100vh - 64px)", minHeight: "calc(100vh - 64px)" }}
    >
      {/* Interactive Telemetry Stream */}
      <iframe
        key={`${activeLayer}-${reloadKey}`}
        title="Atmospheric Telemetry Surface"
        src={getStreamUrl()}
        className="w-full h-full border-0 filter contrast-105 saturate-115"
        style={{ width: "100%", height: "100%", display: "block" }}
        allow="geolocation; fullscreen"
        loading="eager"
      />

      {/* Observation Surface Selector HUD */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 bg-[#0c101c]/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Observation Surface
            </span>
          </div>
          <button
            onClick={() => setReloadKey((prev) => prev + 1)}
            title="Reload Frame"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <button
            onClick={() => setActiveLayer("radar")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeLayer === "radar"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold"
                : "text-slate-300 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Live Doppler Radar</span>
            </div>
            <span className="text-[10px] font-mono ml-3 px-1.5 py-0.5 rounded bg-black/30">HD</span>
          </button>

          <button
            onClick={() => setActiveLayer("satellite")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeLayer === "satellite"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold"
                : "text-slate-300 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <Satellite className="w-3.5 h-3.5" />
              <span>INSAT / Cloud Infrared</span>
            </div>
            <span className="text-[10px] font-mono ml-3 px-1.5 py-0.5 rounded bg-black/30">IR</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeLayer === "wind"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold"
                : "text-slate-300 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5" />
              <span>Wind Stream Vectors</span>
            </div>
            <span className="text-[10px] font-mono ml-3 px-1.5 py-0.5 rounded bg-black/30">SFC</span>
          </button>
        </div>
      </div>

      {/* Station Ephemeris Footer Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#0c101c]/95 backdrop-blur-xl border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200 whitespace-nowrap">
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
