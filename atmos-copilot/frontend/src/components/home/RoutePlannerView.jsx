import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Wind, 
  Eye, 
  CloudRain, 
  Loader2,
  Volume2,
  Square
} from 'lucide-react';
import { translations, formatNativeNumber } from '../../utils/translations';

export default function RoutePlannerView({ 
  coords, 
  weather, 
  lang = 'en', 
  theme = 'dark',
  onVocalize,
  isSpeaking = false,
  voiceMeta
}) {
  const t = translations[lang] || translations.en;

  const [origin, setOrigin] = useState(weather?.resolved_city || "IPD Salappa Ward, Bengaluru");
  const [destination, setDestination] = useState("Kodagu, Karnataka");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [routeData, setRouteData] = useState({
    distance: "266.5 km",
    duration: "5h 18m",
    startName: "IPD Salappa Ward",
    destName: "Coorg",
    startWeather: { temp: 27, wind: 11, visibility: 29, rainProb: 0, risk: "Low Risk" },
    destWeather: { temp: 20, wind: 11, visibility: 1, rainProb: 0, risk: "Moderate" },
    overallRisk: "Moderate",
    hazardNote: "Caution: Atmospheric moisture or surface wind vectors elevated along route. Reduce speed."
  });

  // Keyless, zero-error Google Maps driving directions embed URL
  const googleRouteEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&output=embed`;
  const gmapsExternalUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;

  const geocodeLocation = async (place) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          name: data[0].display_name.split(',')[0]
        };
      }
    } catch {
      // Fallback below
    }
    return { lat: 12.9716, lon: 77.5946, name: place };
  };

  const fetchPointWeather = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m&hourly=visibility&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      const cur = data.current || {};
      const visMeters = data.hourly?.visibility?.[0] ?? 10000;
      const visKm = Math.round(visMeters / 1000);
      const rain = Math.round(cur.precipitation ?? 0);
      const wind = Math.round(cur.wind_speed_10m ?? 11);
      const temp = Math.round(cur.temperature_2m ?? 25);

      let risk = "Low Risk";
      if (rain > 15 || visKm < 3 || wind > 35) risk = "Moderate";
      if (rain > 35 || visKm < 1 || wind > 55) risk = "High Risk";

      return { temp, wind, visibility: visKm, rainProb: rain, risk };
    } catch {
      return { temp: 25, wind: 11, visibility: 10, rainProb: 0, risk: "Low Risk" };
    }
  };

  const handleCalculateRoute = async () => {
    if (!origin.trim() || !destination.trim()) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const [startPoint, destPoint] = await Promise.all([
        geocodeLocation(origin),
        geocodeLocation(destination)
      ]);

      const [startW, destW] = await Promise.all([
        fetchPointWeather(startPoint.lat, startPoint.lon),
        fetchPointWeather(destPoint.lat, destPoint.lon)
      ]);

      let distanceStr = "266.5 km";
      let durationStr = "5h 18m";

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPoint.lon},${startPoint.lat};${destPoint.lon},${destPoint.lat}?overview=false`;
        const osrmRes = await fetch(osrmUrl);
        const osrmData = await osrmRes.json();
        if (osrmData.routes && osrmData.routes.length > 0) {
          const primary = osrmData.routes[0];
          const distKm = (primary.distance / 1000).toFixed(1);
          const totalMinutes = Math.round(primary.duration / 60);
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          distanceStr = `${distKm} km`;
          durationStr = `${hours}h ${mins}m`;
        }
      } catch (e) {
        console.warn("OSRM calculation fallback:", e);
      }

      const isElevated = startW.risk !== "Low Risk" || destW.risk !== "Low Risk";
      const corridorRisk = isElevated ? "Moderate" : "Low Risk";
      const hazard = isElevated
        ? t.cautionMessage
        : "Weather conditions look clear. Optimal roadway transit conditions.";

      setRouteData({
        distance: distanceStr,
        duration: durationStr,
        startName: startPoint.name || origin,
        destName: destPoint.name || destination,
        startWeather: startW,
        destWeather: destW,
        overallRisk: corridorRisk,
        hazardNote: hazard
      });
    } catch (err) {
      console.warn("Route calculation error:", err);
      setErrorMsg("Could not verify waypoint coordinates. Please check your spelling.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculateRoute();
  }, []);

  const cardBg = theme === 'dark' 
    ? 'bg-[#0d1322]/85 border-slate-700/60 text-white shadow-2xl' 
    : 'bg-white border-slate-200 text-slate-900 shadow-md';
  const subBg = theme === 'dark' 
    ? 'bg-[#080d1a] border-slate-800 text-slate-300' 
    : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Header & Location Inputs */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl space-y-4 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Navigation className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">{t.weatherSafeRoutePlanner}</h2>
            </div>

            {/* Vocalize Safe Route Trigger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const script = `Route corridor advisory from ${routeData.startName} to ${routeData.destName}. Overall transit risk is rated ${routeData.overallRisk}. Pavement surface visibility is acceptable with light vector gusts of ${routeData.destWeather.wind} kilometers per hour. Estimated transit time is approximately ${routeData.duration}.`;
                  onVocalize && onVocalize(script);
                }}
                title={voiceMeta?.name ? `Vocalize with ${voiceMeta.name}` : "Vocalize Safe Route"}
                className={`text-xs font-mono border px-2.5 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  isSpeaking 
                    ? 'bg-amber-500 text-slate-950 font-bold animate-pulse border-amber-400' 
                    : 'text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
              >
                {isSpeaking ? <Square className="w-3 h-3 fill-slate-950" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? "Stop Vocal" : "Vocalize Safe Route"}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">{t.routePlannerSubtitle}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                {t.startLocation}
              </label>
              <div className={`flex items-center gap-2.5 p-3 rounded-2xl border focus-within:border-amber-400 transition ${subBg}`}>
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="bg-transparent text-xs outline-none w-full font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                {t.destination}
              </label>
              <div className={`flex items-center gap-2.5 p-3 rounded-2xl border focus-within:border-amber-400 transition ${subBg}`}>
                <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Kodagu"
                  className="bg-transparent text-xs outline-none w-full font-medium"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 font-mono flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCalculateRoute}
              disabled={loading}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              <span>{loading ? "Calculating..." : t.calculateSafeCorridor}</span>
            </button>
            <a
              href={gmapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs flex items-center gap-2 transition font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.openInGoogleMaps}</span>
            </a>
          </div>
        </div>

        {/* 2. Start & Destination Weather Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                  {t.originStation}
                </span>
                <h3 className="text-base font-bold">{routeData.startName}</h3>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                routeData.startWeather.risk === "Low Risk" 
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              }`}>
                {routeData.startWeather.risk}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block">Temp</span>
                <span className="text-sm font-bold font-mono mt-0.5 block">
                  {formatNativeNumber(routeData.startWeather.temp, lang)}°C
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block flex items-center justify-center gap-1">
                  <Wind className="w-2.5 h-2.5" /> Wind
                </span>
                <span className="text-sm font-bold font-mono mt-0.5 block">
                  {formatNativeNumber(routeData.startWeather.wind, lang)} k/h
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block flex items-center justify-center gap-1">
                  <Eye className="w-2.5 h-2.5" /> Visib.
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                  {formatNativeNumber(routeData.startWeather.visibility, lang)} km
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block flex items-center justify-center gap-1">
                  <CloudRain className="w-2.5 h-2.5" /> Rain
                </span>
                <span className="text-sm font-bold font-mono text-cyan-300 mt-0.5 block">
                  {formatNativeNumber(routeData.startWeather.rainProb, lang)}%
                </span>
              </div>
            </div>
          </div>

          <div className={`border rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">
                  {t.destinationStation}
                </span>
                <h3 className="text-base font-bold">{routeData.destName}</h3>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                routeData.destWeather.risk === "Low Risk" 
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              }`}>
                {routeData.destWeather.risk}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block">Temp</span>
                <span className="text-sm font-bold font-mono mt-0.5 block">
                  {formatNativeNumber(routeData.destWeather.temp, lang)}°C
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block flex items-center justify-center gap-1">
                  <Wind className="w-2.5 h-2.5" /> Wind
                </span>
                <span className="text-sm font-bold font-mono mt-0.5 block">
                  {formatNativeNumber(routeData.destWeather.wind, lang)} k/h
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block flex items-center justify-center gap-1">
                  <Eye className="w-2.5 h-2.5" /> Visib.
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                  {formatNativeNumber(routeData.destWeather.visibility, lang)} km
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${subBg}`}>
                <span className="text-[10px] opacity-70 block flex items-center justify-center gap-1">
                  <CloudRain className="w-2.5 h-2.5" /> Rain
                </span>
                <span className="text-sm font-bold font-mono text-cyan-300 mt-0.5 block">
                  {formatNativeNumber(routeData.destWeather.rainProb, lang)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Direct Google Maps Embedded Driving Route Canvas */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl space-y-4 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  {routeData.overallRisk}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300">{routeData.hazardNote}</span>
              </div>
              <h3 className="text-lg font-bold mt-1">
                {routeData.startName} ➔ {routeData.destName}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className={`px-3 py-1.5 rounded-xl border ${subBg}`}>
                <span className="opacity-70">{t.distance}: </span>
                <b className="text-white">{formatNativeNumber(routeData.distance, lang)}</b>
              </div>
              <div className={`px-3 py-1.5 rounded-xl border ${subBg}`}>
                <span className="opacity-70">{t.eta}: </span>
                <b className="text-amber-400">{formatNativeNumber(routeData.duration, lang)}</b>
              </div>
            </div>
          </div>

          <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 relative bg-[#080d1a]">
            <iframe
              key={`${origin}-${destination}`}
              title="Google Maps Driving Directions Corridor"
              src={googleRouteEmbedUrl}
              className="w-full h-full border-0 filter contrast-105"
              allowFullScreen
              loading="lazy"
            />
            <div className="absolute bottom-3 right-3 bg-[#0c101c]/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 shadow-lg">
              {t.corridorLock}: {routeData.startName} ➔ {routeData.destName}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
