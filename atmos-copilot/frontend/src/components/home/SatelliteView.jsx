import React, { useState, useEffect, useRef } from 'react';
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
  Layers, 
  Eye, 
  Maximize2 
} from 'lucide-react';

export default function SatelliteView({ coords, weather, theme = 'dark' }) {
  // Active layer selection
  const [activeLayer, setActiveLayer] = useState('radar'); // 'radar' | 'temp' | 'clouds' | 'pressure' | 'humidity' | 'wind'
  const [isPlaying, setIsPlaying] = useState(true);
  const [timelineIndex, setTimelineIndex] = useState(3);import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Compass, 
  Radio, 
  Eye, 
  RotateCcw, 
  MapPin, 
  Maximize2 
} from 'lucide-react';

export default function SatelliteView({ coords, weather, theme = 'dark' }) {
  const [stationTime, setStationTime] = useState('');
  const [zoomLevel, setZoomLevel] = useState(6);

  const lat = coords?.lat || 12.9716;
  const lon = coords?.lon || 77.5946;
  const placeName = weather?.resolved_city || "Jagajeevanram Nagara, Bengaluru";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setStationTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Authentic live wind stream vector URL
  const windStreamUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%&height=100%&zoom=${zoomLevel}&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C`;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050811] font-sans">
      
      {/* 1. Live Animated Wind Stream Canvas */}
      <iframe
        title="Live Surface Wind Stream Vectors"
        src={windStreamUrl}
        className="w-full h-full border-0 absolute inset-0 z-0 filter brightness-95 contrast-105"
        allow="geolocation"
      />

      {/* 2. Top-Left Observation Surface Badge */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#090e1a]/90 border border-slate-700/80 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl min-w-[240px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Observation Surface
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-slate-950" />
              <span>Wind Stream Vectors</span>
            </div>
            <span className="text-[9px] font-mono uppercase opacity-80">SFC</span>
          </div>

          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-[#050811] border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Model: ECMWF 9km</span>
            <span className="text-emerald-400">Stream Sync</span>
          </div>
        </div>
      </div>

      {/* 3. Top-Right Zoom Controls */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(prev + 1, 11))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition shadow-xl"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((prev) => Math.max(prev - 1, 4))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition shadow-xl"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* 4. Bottom Wind Speed Color Scale */}
      <div className="absolute bottom-16 left-5 z-20 hidden sm:flex flex-col bg-[#0b101e]/90 border border-slate-800 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl shadow-xl">
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
      </div>

      {/* 5. Bottom Telemetry Status Bar */}
      <div className="absolute bottom-5 inset-x-5 z-20 flex items-center justify-between bg-[#0b101e]/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE</span>
          <span className="text-xs font-mono text-amber-400 ml-1.5">{stationTime}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="hidden md:inline">Station: <strong className="text-white">{placeName}</strong></span>
          <span>Coordinates: <strong className="text-amber-400">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</strong></span>
        </div>
      </div>

    </div>
  );
}
  
  const [radarTimestamp, setRadarTimestamp] = useState('');
  const [zoomLevel, setZoomLevel] = useState(7);

  const centerLat = coords?.lat || 12.9716;
  const centerLon = coords?.lon || 77.5946;

  // OpenWeather / RainViewer dynamic tile endpoints
  const layerEndpoints = {
    radar: `https://tilecache.rainviewer.com/v2/radar/nowcast_10/512/{z}/{x}/{y}/2/1_1.png`,
    temp: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=9aaeda92fc69f24d5f44ea861270f054`,
    clouds: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=9aaeda92fc69f24d5f44ea861270f054`,
    pressure: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=9aaeda92fc69f24d5f44ea861270f054`,
    humidity: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=9aaeda92fc69f24d5f44ea861270f054`,
    wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=9aaeda92fc69f24d5f44ea861270f054`
  };

  // Timeline intervals
  const timelineSteps = ["-45m", "-30m", "-15m", "LIVE", "+15m", "+30m"];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setRadarTimestamp(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animation cycle
  useEffect(() => {
    let anim;
    if (isPlaying) {
      anim = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % timelineSteps.length);
      }, 2200);
    }
    return () => clearInterval(anim);
  }, [isPlaying]);

  // Layer Legend Configurations
  const getLegend = () => {
    switch (activeLayer) {
      case 'temp':
        return {
          title: "Surface Temperature Range (°C)",
          gradient: "from-blue-600 via-emerald-400 via-amber-400 to-rose-600",
          labels: ["< 10°C", "20°C", "30°C", "35°C", "> 42°C"]
        };
      case 'clouds':
        return {
          title: "Satellite Cloud Density (%)",
          gradient: "from-transparent via-slate-400/50 to-white",
          labels: ["Clear", "25%", "50%", "75%", "Overcast 100%"]
        };
      case 'pressure':
        return {
          title: "Mean Sea-Level Pressure (hPa)",
          gradient: "from-purple-600 via-blue-500 via-cyan-400 to-emerald-400",
          labels: ["990 hPa", "1000 hPa", "1008 hPa", "1016 hPa", "> 1024 hPa"]
        };
      case 'humidity':
        return {
          title: "Relative Atmospheric Moisture (%)",
          gradient: "from-amber-200 via-teal-400 to-blue-700",
          labels: ["Dry < 30%", "50%", "70%", "85%", "Saturated 100%"]
        };
      case 'wind':
        return {
          title: "Surface Wind Velocity (km/h)",
          gradient: "from-cyan-300 via-amber-400 to-rose-600",
          labels: ["Calm 0", "15 km/h", "30 km/h", "50 km/h", "> 75 km/h"]
        };
      default:
        return {
          title: "Doppler Reflectivity (dBZ)",
          gradient: "from-blue-500 via-emerald-400 via-amber-400 to-rose-600",
          labels: ["Light (15)", "Moderate (30)", "Heavy (45)", "Severe (60+)"]
        };
    }
  };

  const legend = getLegend();

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#030712] font-sans">
      
      {/* 1. Base Map Tile Canvas */}
      <iframe
        title="Atmospheric Observational Surface"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLon - 2.8}%2C${centerLat - 2.2}%2C${centerLon + 2.8}%2C${centerLat + 2.2}&layer=mapnik&marker=${centerLat}%2C${centerLon}`}
        className="absolute inset-0 w-full h-full border-0 pointer-events-auto filter invert hue-rotate-180 brightness-75 contrast-125"
      />

      {/* 2. Meteorological Tile Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.12), transparent 70%)`
        }}
      >
        {/* Dynamic Weather Simulation Mesh matching the active filter */}
        {activeLayer === 'temp' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-amber-500/25 to-rose-600/30 mix-blend-color animate-pulse" />
        )}
        {activeLayer === 'clouds' && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-slate-300/30 to-white/10 mix-blend-screen opacity-70" />
        )}
        {activeLayer === 'pressure' && (
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        )}
        {activeLayer === 'humidity' && (
          <div className="absolute inset-0 bg-cyan-900/30 mix-blend-overlay" />
        )}
      </div>

      {/* 3. Station Position Lock Marker */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping" />
          <span className="relative w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg shadow-amber-400/50" />
        </div>
        <span className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-amber-400/40 text-[10px] font-mono text-amber-300 backdrop-blur-md whitespace-nowrap shadow-md">
          {weather?.resolved_city || "Station Coordinates Lock"}
        </span>
      </div>

      {/* 4. Left Control Panel: Atmospheric Surface Filters */}
      <div className="absolute top-5 left-5 z-20 w-64 flex flex-col gap-2">
        <div className="bg-[#0b101e]/90 border border-slate-700/80 rounded-2xl p-3 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              Observation Surface
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1">
            {/* Doppler Radar */}
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

            {/* Temperature View */}
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

            {/* Cloud View */}
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

            {/* Pressure View */}
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

            {/* Humidity View */}
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

            {/* Wind Vector View */}
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
        </div>
      </div>

      {/* 5. Right Map Tools: Zoom & Eye */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(prev + 1, 14))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 transition shadow-xl"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((prev) => Math.max(prev - 1, 4))}
          className="w-9 h-9 rounded-xl bg-[#0b101e]/90 border border-slate-700/80 text-white flex items-center justify-center hover:bg-slate-800 transition shadow-xl"
        >
          -
        </button>
      </div>

      {/* 6. Dynamic Color Scale Legend */}
      <div className="absolute bottom-16 left-5 z-20 hidden sm:flex flex-col bg-[#0b101e]/85 border border-slate-800 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl shadow-xl max-w-sm">
        <span className="text-[10px] font-mono text-slate-400 mb-1.5">{legend.title}</span>
        <div className={`h-2 w-64 rounded-full bg-gradient-to-r ${legend.gradient} mb-1`} />
        <div className="flex justify-between text-[9px] font-mono text-slate-400">
          {legend.labels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>
      </div>

      {/* 7. Bottom Observation Controls & Animation Timeline Bar */}
      <div className="absolute bottom-5 inset-x-5 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b101e]/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl">
        {/* Play / Pause / Reset */}
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
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE</span>
            <span className="text-xs font-mono text-amber-400 ml-1">{radarTimestamp}</span>
          </div>
        </div>

        {/* Chronological Steps */}
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

        {/* Telemetry Footer Meta */}
        <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-slate-400">
          <span>Active Layer: <strong className="text-amber-400 uppercase">{activeLayer}</strong></span>
          <span>Lock: <strong className="text-white">{coords?.lat?.toFixed(4) || "12.9716"}°N, {coords?.lon?.toFixed(4) || "77.5946"}°E</strong></span>
        </div>
      </div>
    </div>
  );
}
