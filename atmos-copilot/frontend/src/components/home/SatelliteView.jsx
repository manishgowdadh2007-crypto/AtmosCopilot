import React, { useState, useEffect } from "react";

export default function SatelliteView({ coords, weather }) {
  const [activeLayer, setActiveLayer] = useState("satellite"); // "satellite" | "radar" | "wind"
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [isNightTime, setIsNightTime] = useState(false);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;

  // Real-time AM/PM clock calculation and solar terminator state
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
      const hour = now.getHours();
      setIsNightTime(hour < 6 || hour >= 18);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Native real-time Zoom Earth telemetry engine
  const zoomEarthUrl = `https://zoom.earth/maps/satellite/#view=${lat.toFixed(6)},${lon.toFixed(6)},6z/overlays=${
    activeLayer === "radar"
      ? "radar"
      : activeLayer === "wind"
      ? "wind"
      : "radar,wind"
  }`;

  return (
    <div className="relative w-full h-full bg-[#05070e] overflow-hidden select-none font-sans">
      {/* 1. Zoom Earth Real-Time Canvas: Precision offset eliminates all external banners & watermarks */}
      <iframe
        title="Zoom Earth Live Satellite Telemetry"
        src={zoomEarthUrl}
        className="absolute -top-[54px] -left-2 w-[calc(100%+16px)] h-[calc(100%+98px)] border-0"
        allow="geolocation"
      />

      {/* 2. Floating Left Layers Menu */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {isNightTime ? "Night-IR Satellite" : "Daylight True-Color"}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          EUMETSAT / HIMAWARI / NOAA
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <button
            onClick={() => setActiveLayer("satellite")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "satellite"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>🛰️ Cloud Imagery</span>
            <span className="text-[10px] font-mono opacity-80">
              {isNightTime ? "Infrared" : "Visible"}
            </span>
          </button>

          <button
            onClick={() => setActiveLayer("radar")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "radar"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>📡 Doppler Radar</span>
            <span className="text-[10px] font-mono opacity-80">HD</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "wind"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>💨 Wind Vectors</span>
            <span className="text-[10px] font-mono opacity-80">Surface</span>
          </button>
        </div>
      </div>

      {/* 3. Target Coordinates Telemetry Card (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col bg-[#0c101c]/95 backdrop-blur-md border border-slate-700/70 p-4 rounded-2xl shadow-2xl w-64">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-2">
          <span>Target Coordinates</span>
          <span className="text-emerald-400 font-mono text-[10px] tracking-wider font-semibold">
            LIVE SYNC
          </span>
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

      {/* 4. Real-Time AM/PM Indicator & Solar Terminator Loop */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm">{isNightTime ? "🌙" : "☀️"}</span>
          <span className="font-mono text-amber-300 font-semibold text-xs sm:text-sm">
            {currentTimeStr || "Syncing..."}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <span className="font-mono text-[11px] text-slate-300">
          {isNightTime ? "Night-time City Lights Active" : "Daylight Solar Cycle"}
        </span>
      </div>
    </div>
  );
}
