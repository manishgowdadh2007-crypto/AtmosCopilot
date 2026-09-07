import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Thermometer, 
  Cloud, 
  Gauge, 
  Droplets, 
  Wind, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass
} from 'lucide-react';

export default function SatelliteView({ coords, weather, theme = 'dark' }) {
  const [activeLayer, setActiveLayer] = useState('temp');
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelineIndex, setTimelineIndex] = useState(3);
  const [stationTime, setStationTime] = useState('');
  const [zoomLevel, setZoomLevel] = useState(5);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;
  const placeName = weather?.resolved_city || "Jagajeevanram Nagara, Bengaluru";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setStationTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const timelineSteps = ["-45m", "-30m", "-15m", "LIVE", "+15m", "+30m"];

  // Exact Zoom Earth Model Endpoints
  const zoomEarthCloudUrl = `https://zoom.earth/maps/precipitation/#view=${lat},${lon},${zoomLevel}z/model=icon`;
  const zoomEarthTempUrl = `https://zoom.earth/maps/temperature/#view=${lat},${lon},${zoomLevel}z/model=icon`;
  const zoomEarthPressureUrl = `https://zoom.earth/maps/pressure/#view=${lat},${lon},${zoomLevel}z/model=icon`;
  const windStreamUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%&height=100%&zoom=${zoomLevel}&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C`;

  // Fallback map for local Doppler and Relative Humidity
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 3.5}%2C${lat - 2.8}%2C${lon + 3.5}%2C${lat + 2.8}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050811] font-sans">
      
      {/* 1. LAYER RENDERING VIEWPORT */}

      {/* CLOUD COVERAGE (ZOOM EARTH LIVE PRECIPITATION & CLOUDS) */}
      {activeLayer === 'clouds' && (
        <iframe
          key="cloud-model"
          title="Zoom Earth Live Cloud & Precipitation Coverage"
          src={zoomEarthCloudUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 filter contrast-105"
          allow="geolocation"
        />
      )}

      {/* TEMPERATURE VIEW (ZOOM EARTH LIVE THERMAL HEATMAP) */}
      {activeLayer === 'temp' && (
        <iframe
          key="temp-model"
          title="Zoom Earth Real-Time Temperature Surface"
          src={zoomEarthTempUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 filter contrast-105"
          allow="geolocation"
        />
      )}

      {/* PRESSURE DYNAMICS (ZOOM EARTH ISOBARS) */}
      {activeLayer === 'pressure' && (
        <iframe
          key="pressure-model"
          title="Zoom Earth Atmospheric Pressure Isobars"
          src={zoomEarthPressureUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 filter contrast-105"
          allow="geolocation"
        />
      )}

      {/* WIND STREAM VECTORS (WINDY ECMWF FLUID DYNAMICS) */}
      {activeLayer === 'wind' && (
        <iframe
          key="wind-model"
          title="Live Surface Wind Stream Vectors"
          src={windStreamUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 filter brightness-95 contrast-105"
          allow="geolocation"
        />
      )}

      {/* RADAR & HUMIDITY PROXY TILES */}
      {activeLayer !== 'clouds' && activeLayer !== 'temp' && activeLayer !== 'pressure' && activeLayer !== 'wind' && (
        <div className="relative w-full h-full">
          <iframe
            key="osm-base"
            title="Observation Tile Surface"
            src={openStreetMapUrl}
            className="w-full h-full border-0 absolute inset-0 z-0 filter invert hue-rotate-180 brightness-75 contrast-125"
          />

          {activeLayer === 'radar' && (
            <div 
              className="absolute inset-0 z-10 pointer-events-none opacity-75"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.2), transparent 70%)`
              }}
            />
          )}

          {activeLayer === 'humidity' && (
            <div className="absolute inset-0 z-10 pointer-events-none bg-cyan-900/30 mix-blend-overlay" />
          )}

          {/* Coordinate Lock Marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping" />
              <span className="relative w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg shadow-amber-400/50" />
            </div>
            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-amber-400/40 text-[10px] font-mono text-amber-300 backdrop-blur-md whitespace-nowrap shadow-md">
              {placeName}
            </span>
          </div>
        </div>
      )}

      {/* 2. LAYER CONTROLS PANEL */}
      <div className="absolute top-5 left-5 z-20 w-64 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#090e1a]/92 border border-slate-700/80 rounded-2xl p-3 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Observation Surface
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveLayer('radar')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'radar'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5" />
                <span>Live Doppler Radar</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">RAD</span>
            </button>

            <button
              onClick={() => setActiveLayer('temp')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'temp'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5" />
                <span>Temperature View</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">TMP</span>
            </button>

            <button
              onClick={() => setActiveLayer('clouds')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'clouds'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Coverage View</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">SAT</span>
            </button>

            <button
              onClick={() => setActiveLayer('pressure')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'pressure'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" />
                <span>Pressure Dynamics (Isobars)</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">HPA</span>
            </button>

            <button
              onClick={() => setActiveLayer('humidity')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'humidity'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5" />
                <span>Relative Humidity View</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">RH</span>
            </button>

            <button
              onClick={() => setActiveLayer('wind')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'wind'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5" />
                <span>Wind Stream Vectors</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">SFC</span>
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>
              Model: {activeLayer === 'clouds' ? 'ICON Cloud/Precip' : activeLayer === 'temp' ? 'ICON 2m Temp' : activeLayer === 'pressure' ? 'ICON MSL Pressure' : 'ECMWF Stream'}
            </span>
            <span className="text-emerald-400">Stream Sync</span>
          </div>
        </div>
      </div>

      {/* 3. ZOOM LEVEL TOGGLES */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(prev + 1, 10))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition shadow-xl font-bold text-base"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((prev) => Math.max(prev - 1, 3))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition shadow-xl font-bold text-base"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* 4. DYNAMIC SCALE LEGEND */}
      <div className="absolute bottom-16 left-5 z-20 hidden sm:flex flex-col bg-[#0b101e]/90 border border-slate-800 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl shadow-xl">
        {activeLayer === 'temp' && (
          <>
            <span className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-amber-400" />
              Surface Temperature Scale (°C)
            </span>
            <div className="h-2 w-64 rounded-full bg-gradient-to-r from-blue-600 via-amber-400 via-orange-500 to-red-600 mb-1" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>&lt; 15°C</span>
              <span>22°C</span>
              <span>28°C</span>
              <span>34°C</span>
              <span>42°C+</span>
            </div>
          </>
        )}

        {activeLayer === 'clouds' && (
          <>
            <span className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Cloud className="w-3 h-3 text-cyan-400" />
              Precipitation Rate & Cloud Cover
            </span>
            <div className="h-2 w-64 rounded-full bg-gradient-to-r from-slate-600 via-blue-400 via-amber-400 to-rose-600 mb-1" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Rain</span>
              <span>Light</span>
              <span>Moderate</span>
              <span>Heavy</span>
              <span>Severe</span>
            </div>
          </>
        )}

        {activeLayer === 'pressure' && (
          <>
            <span className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3 h-3 text-cyan-400" />
              Mean Sea-Level Pressure (hPa)
            </span>
            <div className="h-2 w-64 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-teal-300 via-amber-300 to-rose-500 mb-1" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>970</span>
              <span>985</span>
              <span>1000</span>
              <span>1012</span>
              <span>1030</span>
              <span>1045+</span>
            </div>
          </>
        )}

        {activeLayer === 'wind' && (
          <>
            <span className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Wind className="w-3 h-3 text-cyan-400" />
              Surface Wind Velocity (km/h)
            </span>
            <div className="h-2 w-64 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-600 mb-1" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>0 km/h</span>
              <span>15 km/h</span>
              <span>35 km/h</span>
              <span>55 km/h</span>
              <span>75+ km/h</span>
            </div>
          </>
        )}
      </div>

      {/* 5. TELEMETRY STATUS BAR */}
      <div className="absolute bottom-5 inset-x-5 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b101e]/92 border border-slate-700/80 px-4 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:bg-amber-400 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => { setTimelineIndex(3); setIsPlaying(false); }}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE</span>
            <span className="text-xs font-mono text-amber-400 ml-1.5">{stationTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#060913] p-1 rounded-xl border border-slate-800">
          {timelineSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => { setTimelineIndex(idx); setIsPlaying(false); }}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition ${
                timelineIndex === idx
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-slate-400">
          <span>Active Layer: <strong className="text-amber-400 uppercase">{activeLayer}</strong></span>
          <span>Station: <strong className="text-white">{placeName}</strong></span>
          <span>Lock: <strong className="text-amber-400">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</strong></span>
        </div>
      </div>

    </div>
  );
}
