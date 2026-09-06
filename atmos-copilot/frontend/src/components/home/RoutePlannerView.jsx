import React, { useState } from 'react';
import { Navigation, MapPin, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export default function RoutePlannerView({ coords }) {
  const [startQuery, setStartQuery] = useState("Bengaluru, Karnataka");
  const [destQuery, setDestQuery] = useState("Mysuru, Karnataka");
  const [routeInfo, setRouteInfo] = useState({
    distance: "144 km",
    duration: "2h 45m",
    risk: "Low Risk",
    hazard: "Clear roadway visibility, nominal atmospheric moisture"
  });

  const handlePlanRoute = () => {
    if (!startQuery || !destQuery) return;
    setRouteInfo({
      distance: "~150 km",
      duration: "~3h 10m",
      risk: "Low Risk",
      hazard: "Stable surface visibility along the expressway corridor"
    });
  };

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startQuery)}&destination=${encodeURIComponent(destQuery)}`;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-amber-400 mb-4">
            <Navigation className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">Weather-Safe Route Planner</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Start Location</label>
              <div className="flex items-center gap-2 bg-[#080d1a] border border-slate-700 p-2.5 rounded-xl">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  value={startQuery}
                  onChange={(e) => setStartQuery(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Destination</label>
              <div className="flex items-center gap-2 bg-[#080d1a] border border-slate-700 p-2.5 rounded-xl">
                <MapPin className="w-4 h-4 text-rose-400" />
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={handlePlanRoute}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition"
            >
              <span>Calculate Safe Corridor</span>
            </button>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>

        {/* Route Details Card */}
        <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{routeInfo.risk}</span>
              <h3 className="text-base font-bold text-white mt-0.5">{startQuery} ➔ {destQuery}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-300">Distance: <b className="text-white">{routeInfo.distance}</b></span>
              <span className="text-slate-300">ETA: <b className="text-amber-300">{routeInfo.duration}</b></span>
            </div>
          </div>

          {/* Interactive Routing Embed */}
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-800 relative bg-[#080d1a]">
            <iframe
              title="Routing Network"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=76.5,12.2,77.8,13.2&layer=mapnik`}
              className="w-full h-full border-0 filter contrast-110 saturate-120"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
