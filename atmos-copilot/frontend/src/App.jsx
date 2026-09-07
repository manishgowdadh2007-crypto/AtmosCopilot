import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, CloudRain, Wind, History, Trash2, 
  Settings, LogOut, User, Mail, Phone, Clock, ShieldCheck, CheckCircle2,
  Sun, Moon
} from 'lucide-react';
import SatelliteView from './components/home/SatelliteView';
import EnvironmentalPanel from './components/home/EnvironmentalPanel';
import AgriAdvisoryView from './components/home/AgriAdvisoryView';
import RoutePlannerView from './components/home/RoutePlannerView';
import DisasterView from './components/home/DisasterView';
import ClimateIntelView from './components/home/ClimateIntelView';
import Header from './components/common/Header';
import SplashScreen from './components/onboarding/SplashScreen';
import AuthModal from './components/onboarding/AuthModal';
import SunAvatar from './components/copilot/SunAvatar';
import ChatStream from './components/copilot/ChatStream';
import ChatInput from './components/copilot/ChatInput';
import { translations, formatNativeNumber } from './utils/translations';
import { 
  fetchWeatherTelemetry, 
  reverseGeocodeCoordinates, 
  sendAIChatQuery, 
  fetchEnvironmentalTelemetry,
  fetchIPFallbackLocation 
} from './services/api';

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
  const [envData, setEnvData] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('atmos_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('atmos_theme') || 'dark');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Live second/minute time counter
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateLiveClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateLiveClock();
    const interval = setInterval(updateLiveClock, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const [activeMetric, setActiveMetric] = useState('temp'); // 'temp' | 'precip' | 'wind'
  const [isLocating, setIsLocating] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your hyper-local meteorological intelligence core. How can I assist you with today’s atmosphere?' }
  ]);

  const t = translations[lang] || translations.en;

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('atmos_lang', newLang);
  };

  const syncTelemetryLocation = async (lat, lon, knownCity = null) => {
    setIsLocating(true);
    try {
      const [weatherData, environmentalData] = await Promise.all([
        fetchWeatherTelemetry(lat, lon, knownCity),
        fetchEnvironmentalTelemetry(lat, lon)
      ]);
      setWeather(weatherData);
      setEnvData(environmentalData);

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

    const fallbackToIP = async () => {
      try {
        const ipLoc = await fetchIPFallbackLocation();
        setCoords({ lat: ipLoc.lat, lon: ipLoc.lon });
        syncTelemetryLocation(ipLoc.lat, ipLoc.lon, ipLoc.city);
      } catch {
        syncTelemetryLocation(12.9716, 77.5946, "Bengaluru, Karnataka");
      }
    };

    if (!navigator.geolocation) {
      fallbackToIP();
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
        console.warn("Hardware GPS lock unavailable, using network fallback:", err.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lowAcc = {
              lat: parseFloat(pos.coords.latitude.toFixed(6)),
              lon: parseFloat(pos.coords.longitude.toFixed(6)),
            };
            setCoords(lowAcc);
            syncTelemetryLocation(lowAcc.lat, lowAcc.lon);
          },
          () => {
            fallbackToIP();
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
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
    localStorage.setItem('atmos_search_history');
  };

  if (stage === 'splash') {
    return <SplashScreen onFinish={() => setStage(user ? 'app' : 'onboarding')} />;
  }

  if (stage === 'onboarding') {
    return <AuthModal onAuthorized={handleAuthorized} theme={theme} />;
  }

  const cur = {
    temp: weather?.current?.temp ?? 28,
    condition: weather?.current?.condition ?? "Partly Cloudy",
    precipitation: weather?.current?.precipitation ?? 0,
    humidity: weather?.current?.humidity ?? 55,
    wind: weather?.current?.wind ?? 14,
    dew_point: weather?.current?.dew_point ?? 17
  };

  const city = weather?.resolved_city || (isLocating ? t.acquiring : "Bengaluru, Karnataka");

  const getSelectedDayHourly = () => {
    const rawHourly = weather?.hourly || [];
    if (selectedDayIndex === 0) {
      if (rawHourly.length > 0) return rawHourly.slice(0, 8);
      return [
        { time: "6 pm", temp: cur.temp, precip: cur.precipitation, wind: cur.wind },
        { time: "9 pm", temp: cur.temp - 2, precip: Math.max(0, cur.precipitation - 5), wind: Math.max(5, cur.wind - 2) },
        { time: "12 am", temp: cur.temp - 4, precip: 0, wind: Math.max(5, cur.wind - 4) },
        { time: "3 am", temp: cur.temp - 6, precip: 0, wind: Math.max(5, cur.wind - 5) },
        { time: "6 am", temp: cur.temp - 6, precip: 5, wind: Math.max(5, cur.wind - 4) },
        { time: "9 am", temp: cur.temp - 1, precip: 10, wind: cur.wind },
        { time: "12 pm", temp: cur.temp + 3, precip: 15, wind: cur.wind + 2 },
        { time: "3 pm", temp: cur.temp + 4, precip: 5, wind: cur.wind + 3 }
      ];
    }

    const activeDay = weather?.daily?.[selectedDayIndex] || {};
    const maxT = activeDay.max_temp ?? (cur.temp + 2);
    const minT = activeDay.min_temp ?? (cur.temp - 6);
    const dayRain = activeDay.chance_of_rain ?? 20;
    const timeSlots = ["12 am", "3 am", "6 am", "9 am", "12 pm", "3 pm", "6 pm", "9 pm"];

    return timeSlots.map((slot, idx) => {
      const solarCycle = [0.1, 0.0, 0.05, 0.45, 0.9, 1.0, 0.7, 0.35];
      const slotTemp = Math.round(minT + (maxT - minT) * solarCycle[idx]);
      const slotPrecip = Math.max(0, Math.round(dayRain * (0.4 + solarCycle[idx] * 0.6)));
      const slotWind = Math.round(8 + solarCycle[idx] * 8);

      return {
        time: slot,
        temp: slotTemp,
        precip: slotPrecip,
        wind: slotWind
      };
    });
  };

  const activeHourlyData = getSelectedDayHourly();

  const daily = weather?.daily?.length ? weather.daily : [
    { day: t.today, max_temp: 31, min_temp: 21, condition: "Partly Cloudy", chance_of_rain: 10 },
    { day: "Tue", max_temp: 31, min_temp: 20, condition: "Rain", chance_of_rain: 45 },
    { day: "Wed", max_temp: 30, min_temp: 20, condition: "Rain", chance_of_rain: 50 },
    { day: "Thu", max_temp: 31, min_temp: 20, condition: "Rain", chance_of_rain: 40 },
    { day: "Fri", max_temp: 31, min_temp: 20, condition: "Rain", chance_of_rain: 35 },
    { day: "Sat", max_temp: 32, min_temp: 20, condition: "Overcast", chance_of_rain: 20 },
    { day: "Sun", max_temp: 31, min_temp: 20, condition: "Overcast", chance_of_rain: 15 }
  ];

  const renderWeatherSymbol = (cond = "") => {
    const c = String(cond).toLowerCase();
    if (c.includes("rain")) return "🌧️";
    if (c.includes("cloud") || c.includes("overcast")) return "⛅";
    if (c.includes("storm")) return "⛈️";
    return "☀️";
  };

  const calculateRealCurve = (dataList, metric) => {
    if (!dataList || dataList.length === 0) return { path: "", area: "", coords: [], values: [] };

    const rawValues = dataList.map((item) => {
      if (metric === 'precip') return Number(item.precip ?? 0);
      if (metric === 'wind') return Number(item.wind ?? 10);
      return Number(item.temp ?? 25);
    });

    const minVal = Math.min(...rawValues);
    const maxVal = Math.max(...rawValues);
    const spread = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const width = 800;
    const height = 140;
    const paddingY = 24;
    const stepX = width / (rawValues.length - 1);

    const calculatedCoords = rawValues.map((val, idx) => {
      const x = idx * stepX;
      const normalizedRatio = (val - minVal) / spread;
      const y = (height - paddingY) - normalizedRatio * (height - paddingY * 2);
      return { x, y, val };
    });

    let strokePath = `M ${calculatedCoords[0].x},${calculatedCoords[0].y}`;
    for (let i = 0; i < calculatedCoords.length - 1; i++) {
      const curPt = calculatedCoords[i];
      const nextPt = calculatedCoords[i + 1];
      const controlX = (curPt.x + nextPt.x) / 2;
      strokePath += ` C ${controlX},${curPt.y} ${controlX},${nextPt.y} ${nextPt.x},${nextPt.y}`;
    }

    const areaPath = `${strokePath} L ${width},${height} L 0,${height} Z`;
    return { path: strokePath, area: areaPath, coords: calculatedCoords, values: rawValues };
  };

  const { path: dynamicStroke, area: dynamicArea, coords: activeGraphPoints, values: activeGraphValues } = calculateRealCurve(activeHourlyData, activeMetric);

  // Cards have soft glassmorphism so the globe video shows behind them cleanly
  const cardBg = theme === 'dark' 
    ? 'bg-[#0d1322]/80 border-slate-700/60 text-slate-100 shadow-2xl backdrop-blur-md' 
    : 'bg-white/75 border-slate-300/80 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-md';

  const subCardBg = theme === 'dark'
    ? 'bg-[#080d1a]/80 border-slate-800/80 text-slate-300'
    : 'bg-slate-100/80 border-slate-300/60 text-slate-800';

  const headingText = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-sans select-none">
      
      {/* 1. GLOBAL CONSTANT BACKGROUND VIDEO LAYER */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onError={(e) => (e.currentTarget.style.display = 'none')}
        className={`fixed inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-700 ${
          theme === 'dark' 
            ? 'opacity-70 filter brightness-105 contrast-110' 
            : 'opacity-55 filter brightness-110 saturate-120'
        }`}
      >
        <source src="/2611-865412751.mp4" type="video/mp4" />
      </video>

      {/* 2. ATMOSPHERIC GLASS TINT (Preserves Globe Clarity across Themes) */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-500 ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-[#050811]/70 via-[#050811]/35 to-[#050811]/80'
          : 'bg-gradient-to-b from-[#b8c7d9]/50 via-[#cdd8e6]/30 to-[#a8bbce]/60'
      }`} />

      {/* 3. HEADER BAR (Transparent Glass) */}
      <div className="relative z-50 flex-shrink-0">
        <Header 
          weather={weather}
          coords={coords}
          user={user}
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onLogout={handleLogout}
          lang={lang}
          theme={theme}
          setTheme={setTheme}
        />
      </div>

      {/* 4. MAIN VIEWPORT ROUTER (Always Transparent) */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent" style={{ height: "calc(100vh - 64px)" }}>
        {currentPage === 'home' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Station Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 border rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between ${cardBg}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold font-mono">
                          {t.liveTelemetryFeed}
                        </span>
                        <button
                          onClick={acquireAccuratePosition}
                          className="ml-2 text-[10px] text-amber-500 hover:text-amber-600 font-mono border border-amber-500/40 px-2 py-0.5 rounded-md hover:bg-amber-500/10 transition"
                        >
                          {isLocating ? t.readingGps : t.refreshGps}
                        </button>
                      </div>
                      <h2 className={`text-2xl sm:text-3xl font-bold mt-1 tracking-tight ${headingText}`}>{city}</h2>
                      <p className={`text-xs mt-0.5 font-mono ${subText}`}>
                        {t.hardwareGps}: {coords ? `${formatNativeNumber(coords.lat.toFixed(4), lang)}°N, ${formatNativeNumber(coords.lon.toFixed(4), lang)}°E` : t.acquiring}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-5xl sm:text-6xl drop-shadow-lg">{renderWeatherSymbol(cur.condition)}</span>
                      <span className="text-xs font-mono font-bold text-amber-500 mt-2 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        {currentTime}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-end gap-6 sm:gap-10">
                    <div className="flex items-baseline">
                      <span className="text-6xl sm:text-7xl font-light tracking-tighter text-amber-500 font-mono">
                        {formatNativeNumber(cur.temp, lang)}
                      </span>
                      <span className="text-2xl opacity-60 ml-1 font-medium">°C</span>
                    </div>
                    <div className="pb-1 text-sm font-medium">
                      <div className={`text-lg font-semibold ${headingText}`}>{cur.condition}</div>
                      <div className={`text-xs ${subText}`}>{t.precipitation}: {formatNativeNumber(cur.precipitation, lang)}%</div>
                    </div>
                  </div>
                </div>

                {/* Auxiliary Atmospheric Vectors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`border rounded-3xl p-4.5 flex flex-col justify-between backdrop-blur-xl ${cardBg}`}>
                    <span className={`text-xs uppercase tracking-wider font-mono ${subText}`}>{t.windVelocity}</span>
                    <div className="my-2">
                      <span className={`text-2xl sm:text-3xl font-semibold font-mono ${headingText}`}>{formatNativeNumber(cur.wind, lang)}</span>
                      <span className={`text-xs ml-1 ${subText}`}>km/h</span>
                    </div>
                    <span className="text-[11px] text-emerald-500 font-medium">{t.surfaceVector}</span>
                  </div>

                  <div className={`border rounded-3xl p-4.5 flex flex-col justify-between backdrop-blur-xl ${cardBg}`}>
                    <span className={`text-xs uppercase tracking-wider font-mono ${subText}`}>{t.relativeHumidity}</span>
                    <div className="my-2">
                      <span className={`text-2xl sm:text-3xl font-semibold font-mono ${headingText}`}>{formatNativeNumber(cur.humidity, lang)}</span>
                      <span className={`text-xs ml-1 ${subText}`}>%</span>
                    </div>
                    <span className="text-[11px] text-cyan-500 font-medium">{t.atmosphericMoisture}</span>
                  </div>

                  <div className={`border rounded-3xl p-4.5 flex flex-col justify-between backdrop-blur-xl ${cardBg}`}>
                    <span className={`text-xs uppercase tracking-wider font-mono ${subText}`}>{t.precipitation}</span>
                    <div className="my-2">
                      <span className={`text-2xl sm:text-3xl font-semibold font-mono ${headingText}`}>{formatNativeNumber(cur.precipitation, lang)}</span>
                      <span className={`text-xs ml-1 ${subText}`}>%</span>
                    </div>
                    <span className="text-[11px] text-indigo-500 font-medium">{t.modelProbability}</span>
                  </div>

                  <div className={`border rounded-3xl p-4.5 flex flex-col justify-between backdrop-blur-xl ${cardBg}`}>
                    <span className={`text-xs uppercase tracking-wider font-mono ${subText}`}>{t.dewPoint}</span>
                    <div className="my-2">
                      <span className={`text-2xl sm:text-3xl font-semibold font-mono ${headingText}`}>{formatNativeNumber(cur.dew_point, lang)}</span>
                      <span className={`text-xs ml-1 ${subText}`}>°C</span>
                    </div>
                    <span className="text-[11px] text-amber-500 font-medium">{t.baseline}</span>
                  </div>
                </div>
              </div>

              {/* Environmental Indices */}
              <EnvironmentalPanel envData={envData} lang={lang} theme={theme} />

              {/* Diurnal Trend Vector Graph */}
              <div className={`border rounded-3xl p-6 backdrop-blur-xl space-y-4 ${cardBg}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                  theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div>
                    <h3 className={`text-base font-semibold ${headingText}`}>{t.diurnalTrendVectors}</h3>
                    <p className={`text-xs font-mono ${subText}`}>
                      {daily[selectedDayIndex]?.day || t.today} • {t.continuousProjection}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 p-1 rounded-2xl border ${subCardBg}`}>
                    {[
                      { id: 'temp', label: t.temperature, unit: '°C' },
                      { id: 'precip', label: t.precipitation, unit: '%' },
                      { id: 'wind', label: t.wind, unit: 'km/h' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setActiveMetric(m.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-medium transition ${
                          activeMetric === m.id
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full h-40 pt-4 overflow-visible">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 800 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="realGraphFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path d={dynamicArea} fill="url(#realGraphFill)" />

                    <path 
                      d={dynamicStroke} 
                      fill="none" 
                      stroke="#fbbf24" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />

                    {activeGraphPoints.map((pt, idx) => (
                      <g key={idx}>
                        <circle cx={pt.x} cy={pt.y} r="6" className="fill-[#0b101e] stroke-amber-400 stroke-2" />
                        <circle cx={pt.x} cy={pt.y} r="2.5" className="fill-amber-300" />
                      </g>
                    ))}
                  </svg>

                  <div className="absolute inset-x-0 top-0 flex justify-between px-2 pointer-events-none font-mono text-xs font-bold">
                    {activeGraphValues.map((num, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-amber-500 drop-shadow-md bg-[#050811]/70 px-1.5 py-0.5 rounded border border-amber-400/20">
                          {formatNativeNumber(num, lang)}
                          {activeMetric === 'temp' ? '°' : activeMetric === 'precip' ? '%' : 'k'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex justify-between text-xs font-mono px-2 pt-2 border-t ${
                  theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}>
                  {activeHourlyData.map((h, i) => (
                    <span key={i} className="text-center">{h.time}</span>
                  ))}
                </div>
              </div>

              {/* 7-Day Synoptic Forecast */}
              <div className={`border rounded-3xl p-6 backdrop-blur-xl ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-semibold ${headingText}`}>{t.synopticForecast}</h3>
                  <span className="text-xs font-mono text-amber-500 font-semibold">
                    {daily[selectedDayIndex]?.day}: {formatNativeNumber(daily[selectedDayIndex]?.max_temp, lang)}° / {formatNativeNumber(daily[selectedDayIndex]?.min_temp, lang)}°C
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {daily.map((d, i) => {
                    const isSelected = selectedDayIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDayIndex(i)}
                        className={`flex flex-col items-center p-3.5 rounded-2xl border backdrop-blur-md transition text-left w-full active:scale-98 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                            : subCardBg
                        }`}
                      >
                        <span className="text-xs font-medium text-slate-400">{d.day}</span>
                        <span className="text-2xl my-2 drop-shadow">{renderWeatherSymbol(d.condition)}</span>
                        <span className={`text-[11px] truncate max-w-full ${subText}`}>{d.condition}</span>
                        <div className="mt-2 text-xs font-mono flex gap-1.5">
                          <span className={`font-semibold ${headingText}`}>{formatNativeNumber(d.max_temp, lang)}°</span>
                          <span className="opacity-60">{formatNativeNumber(d.min_temp, lang)}°</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {currentPage === 'satellite' && (
          <div className="w-full h-full flex-1 overflow-hidden bg-transparent" style={{ height: "calc(100vh - 64px)" }}>
            <SatelliteView coords={coords} weather={weather} theme={theme} />
          </div>
        )}

        {currentPage === 'copilot' && (
          <div className="w-full max-w-3xl mx-auto flex flex-col justify-between h-full overflow-hidden bg-transparent" style={{ height: "calc(100vh - 64px)" }}>
            <div className="flex flex-col items-center justify-center pt-3 pb-1 flex-shrink-0">
              <SunAvatar isListening={isListening} className="w-14 h-14 sm:w-16 sm:h-16" />
              <h2 className="text-base sm:text-lg font-bold mt-1 text-amber-500">{t.sunCopilot}</h2>
              <p className={`text-[11px] text-center px-4 ${subText}`}>Streaming verified atmospheric telemetry.</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-3">
              <ChatStream messages={messages} isLoading={isLoading} theme={theme} />
            </div>
            <div className={`flex-shrink-0 p-3 sm:p-4 border-t mt-auto backdrop-blur-xl ${
              theme === 'dark' ? 'bg-[#050811]/95 border-slate-800' : 'bg-white/95 border-slate-200'
            }`}>
              <ChatInput onSendMessage={handleSendMessage} isListening={isListening} setIsListening={setIsListening} disabled={isLoading} theme={theme} />
            </div>
          </div>
        )}

        {currentPage === 'agri' && <AgriAdvisoryView coords={coords} weather={weather} theme={theme} />}
        {currentPage === 'routes' && <RoutePlannerView coords={coords} weather={weather} lang={lang} theme={theme} />}
        {currentPage === 'disaster' && <DisasterView coords={coords} weather={weather} theme={theme} />}
        {currentPage === 'climate' && <ClimateIntelView coords={coords} weather={weather} theme={theme} />}

        {currentPage === 'alerts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
            <div className="max-w-4xl mx-auto">
              <div className={`border rounded-3xl p-6 backdrop-blur-xl ${cardBg}`}>
                <div className={`flex items-center justify-between border-b pb-4 mb-5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-lg sm:text-xl font-bold ${headingText}`}>{t.meteorologicalAdvisoriesAlerts}</h2>
                      <p className={`text-xs ${subText}`}>{t.activeRegionalObservations} {city}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                  <h4 className="font-semibold text-sm">{t.surfaceRainRiskIndex}: {t.nominal}</h4>
                  <p className="text-xs mt-1">{t.precipitation} is {formatNativeNumber(cur.precipitation, lang)}%.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'history' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
            <div className="max-w-4xl mx-auto">
              <div className={`border rounded-3xl p-6 backdrop-blur-xl ${cardBg}`}>
                <div className={`flex items-center justify-between border-b pb-4 mb-5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-lg sm:text-xl font-bold ${headingText}`}>{t.telemetryCopilotHistory}</h2>
                      <p className={`text-xs ${subText}`}>{t.historySubtitle} ({searchHistory.length})</p>
                    </div>
                  </div>
                  {searchHistory.length > 0 && (
                    <button onClick={clearHistory} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.clearLog}</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {searchHistory.map((item, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${subCardBg}`}>
                      <div>
                        <p className="text-xs font-medium">"{item.query}"</p>
                        <span className={`text-[10px] block mt-0.5 ${subText}`}>{item.location}</span>
                      </div>
                      <span className="text-[11px] font-mono opacity-60">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className={`border rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 ${cardBg}`}>
                <div className={`flex items-center justify-between border-b pb-5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-lg sm:text-xl font-bold ${headingText}`}>{t.systemSettingsHeading}</h2>
                      <p className={`text-xs ${subText}`}>{t.systemSettingsSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.authenticated}</span>
                  </div>
                </div>

                {/* Display Theme Selector */}
                <div className={`p-4 rounded-2xl border ${subCardBg}`}>
                  <span className={`text-xs font-semibold block mb-2.5 ${headingText}`}>{t.displayMode}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setTheme('dark'); localStorage.setItem('atmos_theme', 'dark'); }}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                        theme === 'dark' 
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20' 
                          : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Moon className="w-4 h-4" /> {t.darkMode}
                    </button>
                    <button
                      onClick={() => { setTheme('light'); localStorage.setItem('atmos_theme', 'light'); }}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition ${
                        theme === 'light' 
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20' 
                          : 'border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Sun className="w-4 h-4" /> {t.lightMode}
                    </button>
                  </div>
                </div>

                {/* System Language Selector */}
                <div className={`p-4 rounded-2xl border ${subCardBg}`}>
                  <span className={`text-xs font-semibold block mb-2.5 ${headingText}`}>{t.systemLanguage}</span>
                  <select
                    value={lang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-xl outline-none border focus:border-amber-500 transition ${
                      theme === 'dark' 
                        ? 'bg-[#0d1322] border-slate-700 text-white' 
                        : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                  >
                    <option value="en">English (Global)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="es">Español (Spanish)</option>
                  </select>
                </div>

                {/* Operator Profile Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${subCardBg}`}>
                    <User className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className={`text-[11px] block ${subText}`}>{t.operatorName}</span>
                      <span className={`text-sm font-semibold truncate block ${headingText}`}>{user?.name || "Operator Terminal"}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${subCardBg}`}>
                    <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className={`text-[11px] block ${subText}`}>{t.registeredEmail}</span>
                      <span className={`text-sm font-semibold font-mono truncate block ${headingText}`}>{user?.email || "operator@atmos.io"}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${subCardBg}`}>
                    <Phone className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className={`text-[11px] block ${subText}`}>{t.mobileContact}</span>
                      <span className={`text-sm font-semibold font-mono truncate block ${headingText}`}>+91 {formatNativeNumber(user?.phone || "9876543210", lang)}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${subCardBg}`}>
                    <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className={`text-[11px] block ${subText}`}>{t.sessionTime}</span>
                      <span className={`text-sm font-semibold font-mono truncate block ${headingText}`}>
                        {user?.lastLoginDate ? `${user.lastLoginDate} • ${user.lastLoginTime}` : "Active Session"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Geolocation Status */}
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${subCardBg}`}>
                  <div className="flex justify-between items-center">
                    <span className={subText}>{t.hardwareGeolocationLock}</span>
                    <span className="font-mono text-amber-500 font-semibold">
                      {coords ? `${formatNativeNumber(coords.lat.toFixed(6), lang)}°N, ${formatNativeNumber(coords.lon.toFixed(6), lang)}°E` : t.acquiring}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={subText}>{t.resolvedMicroLocality}</span>
                    <span className={`font-medium ${headingText}`}>{city}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    onClick={handleLogout}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logOutBtn}</span>
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
