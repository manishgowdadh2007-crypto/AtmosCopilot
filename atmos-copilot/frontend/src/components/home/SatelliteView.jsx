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
  Compass,
  Globe
} from 'lucide-react';

export default function SatelliteView({ coords, weather, theme = 'dark' }) {
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelineIndex, setTimelineIndex] = useState(3);
  const [stationTime, setStationTime] = useState('');
  const [zoomLevel, setZoomLevel] = useState(12);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;
  const placeName = weather?.resolved_city || "IPD Salappa Ward, Bengaluru";

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

  // Keyless Google Maps Photorealistic Satellite View (No billing or API key required)
  const googleMapsKeylessSatUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=k&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;

  // Meteorological Fluid Layers (Windy Embed)
  const getWindyOverlayUrl = (overlayType) => {
    return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%&height=100%&zoom=${Math.max(4, zoomLevel - 4)}&level=surface&overlay=${overlayType}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=${overlayType === 'pressure' ? 'true' : 'false'}&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C`;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050811] font-sans">
      
      {/* 1. MAP VIEWPORT */}

      {/* SATELLITE LAYER (Google Maps Keyless Embed) */}
      {activeLayer === 'satellite' && (
        <iframe
          key={`google-sat-${lat}-${lon}-${zoomLevel}`}
          title="Google True Satellite View"
          src={googleMapsKeylessSatUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 filter contrast-105 brightness-95"
          allowFullScreen
          loading="lazy"
        />
      )}

      {/* METEOROLOGICAL TELEMETRY LAYERS */}
      {activeLayer !== 'satellite' && (
        <iframe
          key={`met-${activeLayer}-${zoomLevel}`}
          title={`Atmospheric ${activeLayer} Telemetry`}
          src={getWindyOverlayUrl(
            activeLayer === 'temp' ? 'temp' :
            activeLayer === 'clouds' ? 'clouds' :
            activeLayer === 'pressure' ? 'pressure' :
            activeLayer === 'radar' ? 'radar' : 'wind'
          )}
          className="w-full h-full border-0 absolute inset-0 z-0 filter brightness-95 contrast-105"
          allow="geolocation"
        />
      )}

      {/* 2. Layer Controls Panel */}
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
              onClick={() => setActiveLayer('satellite')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeLayer === 'satellite'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Google True Satellite</span>
              </div>
              <span className="text-[9px] font-mono uppercase opacity-75">IMG</span>
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
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Source: {activeLayer === 'satellite' ? 'Google Maps Engine' : 'ECMWF Stream Sync'}</span>
            <span className="text-emerald-400">Lock: 100%</span>
          </div>
        </div>
      </div>

      {/* 3. Zoom Controls */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(prev + 1, 19))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition shadow-xl font-bold text-base"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((prev) => Math.max(prev - 1, 3))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition shadow-xl font-bold text-base"
        >
          -
        </button>
      </div>

      {/* 4. Bottom Status Bar */}
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
          <span>Layer: <strong className="text-amber-400 uppercase">{activeLayer}</strong></span>
          <span>Station: <strong className="text-white">{placeName}</strong></span>
          <span>Lock: <strong className="text-amber-400">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</strong></span>
        </div>
      </div>

    </div>
  );
}
