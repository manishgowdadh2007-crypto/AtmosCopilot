import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, CloudRain, Wind, History, Trash2, 
  Settings, LogOut, User, Mail, Phone, Clock, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import SatelliteView from './components/home/SatelliteView';
import Header from './components/common/Header';
import SplashScreen from './components/onboarding/SplashScreen';
import AuthModal from './components/onboarding/AuthModal';
import SunAvatar from './components/copilot/SunAvatar';
import ChatStream from './components/copilot/ChatStream';
import ChatInput from './components/copilot/ChatInput';
import { fetchWeatherTelemetry, reverseGeocodeCoordinates, sendAIChatQuery } from './services/api';

export default function App() {
  const savedUser = (() => {
    try {
      const saved = localStorage.getItem('atmos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState(savedUser);
  const [stage, setStage] = useState(savedUser ? 'app' : 'splash');
  const [currentPage, setCurrentPage] = useState('home');
  const [coords, setCoords] = useState({ lat: 12.9716, lon: 77.5946 });
  const [weather, setWeather] = useState(null);

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('atmos_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('temp');
  const [isLocating, setIsLocating] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your hyper-local meteorological intelligence core. How can I assist you with today’s atmosphere?' }
  ]);

  const syncTelemetryLocation = async (lat, lon) => {
    setIsLocating(true);
    try {
      const weatherData = await fetchWeatherTelemetry(lat, lon);
      setWeather(weatherData);

      reverseGeocodeCoordinates(lat, lon).then((cityName) => {
        if (cityName) {
          setWeather((prev) => (prev ? { ...prev, resolved_city: cityName } : prev));
        }
      });
    } catch (err) {
      console.error("Telemetry sync error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const acquireAccuratePosition = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      syncTelemetryLocation(12.9716, 77.5946);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accurate = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lon: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setCoords(accurate);
        syncTelemetryLocation(accurate.lat, accurate.lon);
      },
      (err) => {
        console.warn("GPS lock error, defaulting to station coords:", err);
        const fallback = { lat: 12.9716, lon: 77.5946 };
        setCoords(fallback);
        syncTelemetryLocation(fallback.lat, fallback.lon);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    syncTelemetryLocation(12.9716, 77.5946);
    acquireAccuratePosition();
  }, []);

  const handleAuthorized = (retrievedCoords, userData) => {
    const finalCoords = retrievedCoords || { lat: 12.9716, lon: 77.5946 };
    setCoords(finalCoords);
    if (userData) {
      setUser(userData);
      localStorage.setItem('atmos_user', JSON.stringify(userData));
    }
    setStage('app');
    syncTelemetryLocation(finalCoords.lat, finalCoords.lon);
  };

  const handleLogout = () => {
    localStorage.removeItem('atmos_user');
    setUser(null);
    setStage('onboarding');
    setCurrentPage('home');
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || !coords) return;
    const now = new Date();
    const historyItem = {
      query: queryText,
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      location: weather?.resolved_city || "Current Location"
    };

    const updated = [historyItem, ...searchHistory.slice(0, 49)];
    setSearchHistory(updated);
    localStorage.setItem('atmos_search_history', JSON.stringify(updated));

    setMessages((prev) => [...prev, { sender: 'user', text: queryText }]);
    setIsLoading(true);
    try {
      const response = await sendAIChatQuery(queryText, coords.lat, coords.lon, weather);
      setMessages((prev) => [...prev, { sender: 'ai', text: response.reply }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'ai', text: "Weather telemetry core offline. Re-establishing link..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('atmos_search_history');
  };

  if (stage === 'splash') {
    return <SplashScreen onFinish={() => setStage(user ? 'app' : 'onboarding')} />;
  }

  if (stage === 'onboarding') {
    return <AuthModal onAuthorized={handleAuthorized} />;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIdx = new Date().getDay();
  const getDayName = (offset) => (offset === 0 ? "Today" : dayNames[(todayIdx + offset) % 7]);

  const cur = {
    temp: weather?.current?.temp ?? 28,
    condition: weather?.current?.condition ?? "Partly Cloudy",
    precipitation: weather?.current?.precipitation ?? 0,
    humidity: weather?.current?.humidity ?? 55,
    wind: weather?.current?.wind ?? 14,
    dew_point: weather?.current?.dew_point ?? 17
  };

  const city = weather?.resolved_city || (isLocating ? "Acquiring coordinates..." : "Bengaluru, Karnataka");

  const hourly = weather?.hourly?.length
    ? weather.hourly
    : [
        { time: "12 pm", temp: 28, precip: 0, wind: 14 },
        { time: "3 pm", temp: 29, precip: 5, wind: 15 },
        { time: "6 pm", temp: 27, precip: 10, wind: 12 },
        { time: "9 pm", temp: 24, precip: 5, wind: 9 },
        { time: "12 am", temp: 21, precip: 0, wind: 8 },
        { time: "3 am", temp: 20, precip: 0, wind: 7 },
        { time: "6 am", temp: 20, precip: 5, wind: 7 },
        { time: "9 am", temp: 25, precip: 5, wind: 11 }
      ];

  const daily = weather?.daily?.length
    ? weather.daily
    : [0, 1, 2, 3, 4, 5, 6].map((offset) => ({
        day: getDayName(offset),
        max_temp: 29 + (offset % 2),
        min_temp: 21,
        condition: "Partly Cloudy",
        chance_of_rain: 10
      }));

  const renderWeatherSymbol = (cond = "") => {
    const c = String(cond).toLowerCase();
    if (c.includes("rain")) return "🌧️";
    if (c.includes("cloud") || c.includes("overcast")) return "⛅";
    if (c.includes("storm")) return "⛈️";
    return "☀️";
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#05070e] text-slate-100 overflow-hidden font-sans relative">
      <video
        autoPlay
        loop
        muted
        playsInline
        onError={(e) => (e.currentTarget.style.display = 'none')}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 filter brightness-90 contrast-105"
      >
        <source src="/earth-background.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#05070e]/85 via-[#05070e]/60 to-[#05070e]/90 pointer-events-none z-0" />

      <div className="flex-shrink-0 z-50">
        <Header 
          weather={weather}
          coords={coords}
          user={user}
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onLogout={handleLogout}
        />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        {currentPage === 'home' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0d1322]/80 border border-slate-700/60 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                          Live Telemetry Feed
                        </span>
                        <button
                          onClick={acquireAccuratePosition}
                          className="ml-2 text-[10px] text-amber-400 hover:text-amber-300 font-mono border border-amber-500/30 px-2 py-0.5 rounded-md hover:bg-amber-500/10 transition"
                        >
                          {isLocating ? "Reading GPS..." : "Refresh GPS"}
                        </button>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white tracking-tight">{city}</h2>
                      <p className="text-xs text-slate-300 mt-0.5 font-mono">
                        Hardware GPS: {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E` : "Acquiring..."}
                      </p>
                    </div>
                    <span className="text-5xl sm:text-6xl drop-shadow-lg">{renderWeatherSymbol(cur.condition)}</span>
                  </div>

                  <div className="mt-8 flex flex-wrap items-end gap-6 sm:gap-10">
                    <div className="flex items-baseline">
                      <span className="text-6xl sm:text-7xl font-light tracking-tighter text-amber-400 font-mono">{cur.temp}</span>
                      <span className="text-2xl text-slate-400 ml-1 font-medium">°C</span>
                    </div>
                    <div className="pb-1 text-sm text-slate-200 font-medium">
                      <div className="text-lg text-white font-semibold">{cur.condition}</div>
                      <div className="text-xs text-slate-300">Precipitation: {cur.precipitation}%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0d1322]/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-xl shadow-lg">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Wind Velocity</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.wind}</span>
                      <span className="text-xs text-slate-400 ml-1">km/h</span>
                    </div>
                    <span className="text-[11px] text-emerald-400">Surface Vector</span>
                  </div>

                  <div className="bg-[#0d1322]/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-xl shadow-lg">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Relative Humidity</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.humidity}</span>
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                    <span className="text-[11px] text-cyan-400">Atmospheric Moisture</span>
                  </div>

                  <div className="bg-[#0d1322]/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-xl shadow-lg">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Precipitation</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.precipitation}</span>
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                    <span className="text-[11px] text-indigo-400">Model Probability</span>
                  </div>

                  <div className="bg-[#0d1322]/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-xl shadow-lg">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Dew Point</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.dew_point}</span>
                      <span className="text-xs text-slate-400 ml-1">°C</span>
                    </div>
                    <span className="text-[11px] text-amber-300">Baseline</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d1322]/80 border border-slate-700/60 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">Diurnal Trend Vectors</h3>
                    <p className="text-xs text-slate-400">Continuous 24-hour meteorological projection</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#090d18] p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveMetric('temp')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                        activeMetric === 'temp' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Temperature
                    </button>
                    <button
                      onClick={() => setActiveMetric('precip')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                        activeMetric === 'precip' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Precipitation
                    </button>
                    <button
                      onClick={() => setActiveMetric('wind')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                        activeMetric === 'wind' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Wind
                    </button>
                  </div>
                </div>

                <div className="relative w-full h-32 pt-2">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 100">
                    <defs>
                      <linearGradient id="curveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,65 Q 65,75 130,80 T 260,50 T 390,20 T 500,55 L 500,100 L 0,100 Z" fill="url(#curveFill)" />
                    <path d="M 0,65 Q 65,75 130,80 T 260,50 T 390,20 T 500,55" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                  </svg>

                  <div className="absolute inset-0 flex justify-between items-start px-2 font-mono text-xs font-semibold text-slate-200">
                    {hourly.map((h, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-amber-300 drop-shadow-md">
                          {activeMetric === 'temp' ? `${h.temp}°` : activeMetric === 'precip' ? `${h.precip}%` : `${h.wind}k`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-300 font-mono px-2 pt-1 border-t border-slate-800/80">
                  {hourly.map((h, i) => (
                    <span key={i}>{h.time}</span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d1322]/80 border border-slate-700/60 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="text-base font-semibold text-white mb-4">7-Day Synoptic Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {daily.map((d, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center p-3 rounded-xl border backdrop-blur-md transition ${
                        i === 0
                          ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10'
                          : 'bg-[#0a0f1c]/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-200">{d.day}</span>
                      <span className="text-2xl my-2 drop-shadow-md">{renderWeatherSymbol(d.condition)}</span>
                      <span className="text-[11px] text-slate-300 truncate max-w-full">{d.condition}</span>
                      <div className="mt-2 text-xs font-mono flex gap-1.5">
                        <span className="text-white font-semibold">{d.max_temp}°</span>
                        <span className="text-slate-400">{d.min_temp}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {currentPage === 'satellite' && (
          <SatelliteView coords={coords} weather={weather} />
        )}

        {currentPage === 'copilot' && (
          <div className="flex-1 flex flex-col h-full min-h-0 w-full max-w-3xl mx-auto overflow-hidden">
            <div className="flex flex-col items-center justify-center pt-4 pb-2 flex-shrink-0">
              <SunAvatar isListening={isListening} className="w-14 h-14 sm:w-16 sm:h-16" />
              <h2 className="text-base sm:text-xl font-bold mt-1 text-amber-300">Sun Copilot Intelligence</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 text-center px-4">
                Strictly streaming live, verified atmospheric telemetry.
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-4">
              <ChatStream messages={messages} isLoading={isLoading} />
            </div>

            <div className="flex-shrink-0 p-3 sm:p-4 bg-[#05070e]/95 backdrop-blur-xl border-t border-slate-800/80">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isListening={isListening} 
                setIsListening={setIsListening} 
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {currentPage === 'alerts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Meteorological Advisories & Alerts</h2>
                      <p className="text-xs text-slate-400">Active regional observations for {city}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400">
                    Live Sensor Lock
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border bg-emerald-950/30 border-emerald-500/30 text-emerald-200 flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-white">Surface Rain Risk Index</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 uppercase">
                          {cur.precipitation > 20 ? "Elevated" : "Nominal"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Precipitation probability in {city} is {cur.precipitation}%. Expected surface conditions stable.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-amber-950/30 border-amber-500/30 text-amber-200 flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-white">Cloud Stratification</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 uppercase">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Conditions reported as {cur.condition} with {cur.humidity}% atmospheric moisture.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <History className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Telemetry & Copilot History</h2>
                      <p className="text-xs text-slate-400">Stored intelligence queries and authentication events</p>
                    </div>
                  </div>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Log</span>
                    </button>
                  )}
                </div>

                <div className="mb-6 p-4 rounded-2xl bg-[#080d1a] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">Authenticated Session</span>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Logged in: {user?.lastLoginDate || "Today"} at {user?.lastLoginTime || "Current Session"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    ACTIVE NODE
                  </span>
                </div>

                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                  Sun Copilot Dispatched Queries ({searchHistory.length})
                </h3>

                {searchHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No intelligence queries logged yet. Dispatched queries from Sun Copilot will appear here.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {searchHistory.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800/80 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">"{item.query}"</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Target: {item.location}</span>
                        </div>
                        <div className="text-right flex-shrink-0 text-[11px] font-mono text-slate-400">
                          <span>{item.time}</span>
                          <span className="text-slate-600 block text-[10px]">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">System Settings & Operator Profile</h2>
                      <p className="text-xs text-slate-400">Manage device telemetry and authorization status</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>AUTHENTICATED</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 flex items-center gap-3">
                    <User className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">Operator Name</span>
                      <span className="text-sm font-semibold text-white truncate block">{user?.name || "Operator Terminal"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">Registered Email</span>
                      <span className="text-sm font-semibold text-white font-mono truncate block">{user?.email || "operator@atmos.io"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 flex items-center gap-3">
                    <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">Mobile Contact</span>
                      <span className="text-sm font-semibold text-white font-mono truncate block">{user?.phone || "+91 9876543210"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">Session Time</span>
                      <span className="text-sm font-semibold text-white font-mono truncate block">
                        {user?.lastLoginDate ? `${user.lastLoginDate} • ${user.lastLoginTime}` : "Active Session"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Hardware Geolocation Lock:</span>
                    <span className="font-mono text-amber-300">
                      {coords ? `${coords.lat.toFixed(6)}°N, ${coords.lon.toFixed(6)}°E` : "Unavailable"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Resolved Micro-Locality:</span>
                    <span className="text-white font-medium">{city}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out & Teleport to Login Node</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
