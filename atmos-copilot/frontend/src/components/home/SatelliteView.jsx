import React, { useState, useEffect } from "react";
import { CloudRain, Satellite, Wind } from "lucide-react";

export default function SatelliteView({ coords, weather }) {
  const [activeLayer, setActiveLayer] = useState("radar"); // "radar" | "satellite" | "wind"
  const [currentTimeStr, setCurrentTimeStr] = useState("");

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
    return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%25&height=100%25&zoom=7&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C`;
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-0 bg-[#05070e] overflow-hidden select-none font-sans">
      {/* Absolute Full-Screen Map Frame */}
      <iframe
        key={activeLayer}
        title="Atmospheric Telemetry Radar"
        src={getStreamUrl()}
        className="absolute inset-0 w-full h-full border-0 filter contrast-110 saturate-125"
        allow="geolocation"
      />

      {/* Layer Switcher HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-[#0c101c]/90 backdrop-blur-xl border border-slate-700/60 p-2.5 sm:p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Observation Surface
          </span>
        </div>

        <div className="flex flex-col gap-1.5 mt-1">
          <button
            onClick={() => setActiveLayer("radar")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "radar"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Live Doppler Radar</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 ml-2">HD</span>
          </button>

          <button
            onClick={() => setActiveLayer("satellite")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "satellite"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <Satellite className="w-3.5 h-3.5" />
              <span>INSAT / Cloud Infrared</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 ml-2">IR</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "wind"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5" />
              <span>Wind Stream Vectors</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 ml-2">Surface</span>
          </button>
        </div>
      </div>

      {/* Ephemeris & Live Station Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0c101c]/90 backdrop-blur-xl border border-slate-700/60 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200 whitespace-nowrap">
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
