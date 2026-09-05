import React, { useState, useEffect } from "react";
import { CloudRain, Satellite, Wind, RefreshCw } from "lucide-react";

export default function SatelliteView({ coords, weather }) {
  const [activeLayer, setActiveLayer] = useState("radar"); // "radar" | "satellite" | "wind"
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [keyCounter, setKeyCounter] = useState(0);

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
    if (activeLayer === "radar") {
      return `https://www.rainviewer.com/map.html?loc=${lat},${lon},8&oFa=0&oc=1&layer=radar&sm=1&sn=1`;
    }
    if (activeLayer === "satellite") {
      return `https://www.rainviewer.com/map.html?loc=${lat},${lon},7&oFa=0&oc=1&layer=satellite&sm=1&sn=1`;
    }
    // Cross-origin safe OpenStreetMap Wind / Surface stream
    return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%25&height=100%25&zoom=7&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C`;
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#05070e] overflow-hidden select-none font-sans z-10">
      {/* 1. Hardware-Pushed Full Viewport Iframe */}
      <iframe
        key={`${activeLayer}-${keyCounter}`}
        title="Atmospheric Telemetry Radar"
        src={getStreamUrl()}
        className="absolute inset-0 w-full h-full border-0 filter contrast-110 saturate-125"
        style={{ width: "100%", height: "100%", border: "none" }}
        loading="eager"
      />

      {/* 2. Layer Selector Pill HUD */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 bg-[#0c101c]/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Observation Surface
            </span>
          </div>
          <button
            onClick={() => setKeyCounter((prev) => prev + 1)}
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

      {/* 3. Station Ephemeris Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#0c101c]/95 backdrop-blur-xl border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200 whitespace-nowrap">
        <span className="font-mono text-amber-300 font-semibold">{currentTimeStr}</span>
        <div className="h-4 w-px bg-slate-700" />
        <span className="font-mono text-[11px] text-slate-400">
          🌅 {weather?.current?.sunrise || "06:09"} | 🌇 {weather?.current?.sunset || "18:28"} IST
        </span>
        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
        <span className="font-mono text-[11px] text-emerald-400 hidden sm:inline">
          Telemetry Station: {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "12.9716°N, 77.5946°E"}
        </span>
      </div>
    </div>
  );
}
