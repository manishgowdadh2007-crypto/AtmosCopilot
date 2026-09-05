import React, { useState, useEffect } from "react";

export default function SatelliteView({ coords, weather }) {
  const [activeLayer, setActiveLayer] = useState("radar"); // "radar" | "satellite" | "imd"
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
    <div className="relative w-full h-full bg-[#05070e] overflow-hidden select-none font-sans">
      {/* Dynamic Tile Surface */}
      {activeLayer === "imd" ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#070b16]">
          <div className="max-w-4xl w-full bg-[#0d1424] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-300">IMD Bengaluru Doppler Weather Radar</h3>
                <p className="text-[11px] text-slate-400">Live PPI / MaxZ Reflectivity Feed • Regional Met Centre</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono">
                LIVE DWR FEED
              </span>
            </div>

            <div className="relative w-full h-[55vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              <img
                src="https://mausam.imd.gov.in/Radar/BLR_MAXZ.gif"
                alt="IMD Bengaluru Doppler Radar Loop"
                className="w-full h-full object-contain filter contrast-125"
                onError={(e) => {
                  e.target.src = "https://mausam.imd.gov.in/Radar/dist_bengaluru.gif";
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <span>Station: IMD Bengaluru (Lat: 12.97°N, Lon: 77.59°E)</span>
              <a
                href="https://mausam.imd.gov.in/bengaluru/"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline"
              >
                Official Portal ↗
              </a>
            </div>
          </div>
        </div>
      ) : (
        <iframe
          title="Satellite Stream"
          src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=7&overlay=${
            activeLayer === "radar" ? "radar" : "satellite"
          }&product=satellite&level=surface&lat=${lat}&lon=${lon}`}
          className="absolute -top-[52px] -left-2 w-[calc(100%+16px)] h-[calc(100%+100px)] border-0 filter saturate-[1.1]"
        />
      )}

      {/* Layer Selection Controller */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            IMD & Sat Telemetry
          </span>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <button
            onClick={() => setActiveLayer("imd")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "imd"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>📡 IMD Doppler Radar</span>
            <span className="text-[10px] font-mono opacity-80">Bengaluru</span>
          </button>

          <button
            onClick={() => setActiveLayer("radar")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "radar"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>🌧️ High-Res Doppler</span>
            <span className="text-[10px] font-mono opacity-80">HD</span>
          </button>

          <button
            onClick={() => setActiveLayer("satellite")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeLayer === "satellite"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            <span>🛰️ Cloud Satellite</span>
            <span className="text-[10px] font-mono opacity-80">IR / Vis</span>
          </button>
        </div>
      </div>

      {/* Ephemeris & Time Deck */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-2xl shadow-2xl text-xs text-slate-200">
        <span className="font-mono text-amber-300 font-semibold">{currentTimeStr}</span>
        <div className="h-4 w-px bg-slate-700" />
        <span className="font-mono text-[11px] text-slate-400">
          🌅 {weather?.current?.sunrise || "06:09"} | 🌇 {weather?.current?.sunset || "18:28"} IST
        </span>
      </div>
    </div>
  );
}
