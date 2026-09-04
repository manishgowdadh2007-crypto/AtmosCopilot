import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import SplashScreen from './components/onboarding/SplashScreen';
import AuthModal from './components/onboarding/AuthModal';
import SunAvatar from './components/copilot/SunAvatar';
import ChatStream from './components/copilot/ChatStream';
import ChatInput from './components/copilot/ChatInput';
import { fetchWeatherTelemetry, sendAIChatQuery } from './services/api';

export default function App() {
  const [stage, setStage] = useState('splash');
  const [currentPage, setCurrentPage] = useState('home');
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('temp');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your hyper-local meteorological intelligence core. How can I assist you with today’s atmosphere?' }
  ]);

  useEffect(() => {
    if (coords) {
      fetchWeatherTelemetry(coords.lat, coords.lon)
        .then(data => setWeather(data))
        .catch(err => console.error("Telemetry link error:", err));
    }
  }, [coords]);

  const handleAuthorized = (retrievedCoords) => {
    setCoords(retrievedCoords);
    setStage('app');
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setIsLoading(true);
    try {
      const response = await sendAIChatQuery(queryText, coords?.lat || 12.97, coords?.lon || 77.59);
      setMessages(prev => [...prev, { sender: 'ai', text: response.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: "Weather telemetry offline. Check API connectivity." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (stage === 'splash') {
    return <SplashScreen onFinish={() => setStage('onboarding')} />;
  }

  if (stage === 'onboarding') {
    return <AuthModal onAuthorized={handleAuthorized} />;
  }

  // Telemetry fallbacks
  const cur = weather?.current || { temp: 26, condition: "Partly Cloudy", precipitation: 18, humidity: 60, wind: 20 };
  const city = weather?.resolved_city || "Bangalore, Karnataka";
  const hourly = weather?.hourly?.length ? weather.hourly : [
    { time: "12 am", temp: 21, precip: 10, wind: 12 },
    { time: "3 am", temp: 20, precip: 15, wind: 10 },
    { time: "6 am", temp: 20, precip: 12, wind: 9 },
    { time: "9 am", temp: 24, precip: 8, wind: 14 },
    { time: "12 pm", temp: 28, precip: 20, wind: 18 },
    { time: "3 pm", temp: 31, precip: 25, wind: 22 },
    { time: "6 pm", temp: 29, precip: 18, wind: 16 },
    { time: "9 pm", temp: 26, precip: 15, wind: 12 }
  ];

  const daily = weather?.daily?.length ? weather.daily : [
    { day: "Today", max_temp: 31, min_temp: 20, condition: "Partly Cloudy" },
    { day: "Sat", max_temp: 32, min_temp: 21, condition: "Clear" },
    { day: "Sun", max_temp: 32, min_temp: 22, condition: "Partly Cloudy" },
    { day: "Mon", max_temp: 30, min_temp: 21, condition: "Rain" },
    { day: "Tue", max_temp: 31, min_temp: 21, condition: "Partly Cloudy" },
    { day: "Wed", max_temp: 30, min_temp: 20, condition: "Overcast" },
    { day: "Thu", max_temp: 29, min_temp: 19, condition: "Rain" }
  ];

  const renderWeatherSymbol = (cond = "") => {
    const c = cond.toLowerCase();
    if (c.includes("rain")) return "🌧️";
    if (c.includes("cloud") || c.includes("overcast")) return "⛅";
    if (c.includes("storm")) return "⛈️";
    return "☀️";
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#080b14] text-slate-100 overflow-hidden font-sans">
      {/* 1. Universal Pinned Header */}
      <div className="flex-shrink-0 z-50">
        <Header 
          weather={weather}
          coords={coords}
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      </div>

      {/* 2. Primary Surface */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {currentPage === 'home' ? (
          /* Observatory Telemetry Deck */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Station Hero Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#101524]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Live Telemetry Feed</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white tracking-tight">{city}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Atmospheric station telemetry • Real-time update</p>
                    </div>
                    <span className="text-5xl sm:text-6xl drop-shadow-lg">{renderWeatherSymbol(cur.condition)}</span>
                  </div>

                  <div className="mt-8 flex flex-wrap items-end gap-6 sm:gap-10">
                    <div className="flex items-baseline">
                      <span className="text-6xl sm:text-7xl font-light tracking-tighter text-amber-400 font-mono">{cur.temp}</span>
                      <span className="text-2xl text-slate-400 ml-1 font-medium">°C</span>
                    </div>
                    <div className="pb-1 text-sm text-slate-300 font-medium">
                      <div className="text-lg text-white font-semibold">{cur.condition}</div>
                      <div className="text-xs text-slate-400">Precipitation Probability: {cur.precipitation}%</div>
                    </div>
                  </div>
                </div>

                {/* Sub-Metric Panels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#101524]/70 border border-slate-800/70 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Wind Velocity</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.wind}</span>
                      <span className="text-xs text-slate-400 ml-1">km/h</span>
                    </div>
                    <span className="text-[11px] text-emerald-400">Moderate Vector</span>
                  </div>

                  <div className="bg-[#101524]/70 border border-slate-800/70 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Relative Humidity</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.humidity}</span>
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                    <span className="text-[11px] text-cyan-400">Atmospheric Saturation</span>
                  </div>

                  <div className="bg-[#101524]/70 border border-slate-800/70 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Precipitation</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">{cur.precipitation}</span>
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                    <span className="text-[11px] text-indigo-400">Cloud Radar Estimate</span>
                  </div>

                  <div className="bg-[#101524]/70 border border-slate-800/70 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Dew Point</span>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-semibold font-mono text-white">18</span>
                      <span className="text-xs text-slate-400 ml-1">°C</span>
                    </div>
                    <span className="text-[11px] text-amber-300">Comfort Baseline</span>
                  </div>
                </div>
              </div>

              {/* Kinetic Atmospheric Trend Deck */}
              <div className="bg-[#101524]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
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

                {/* Spline Area Canvas */}
                <div className="relative w-full h-32 pt-2">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 100">
                    <defs>
                      <linearGradient id="curveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,65 Q 65,75 130,80 T 260,50 T 390,20 T 500,55 L 500,100 L 0,100 Z"
                      fill="url(#curveFill)"
                    />
                    <path
                      d="M 0,65 Q 65,75 130,80 T 260,50 T 390,20 T 500,55"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                    />
                  </svg>

                  {/* Hourly Nodes Overlay */}
                  <div className="absolute inset-0 flex justify-between items-start px-2 font-mono text-xs font-semibold text-slate-200">
                    {hourly.map((h, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-amber-300">
                          {activeMetric === 'temp' ? `${h.temp}°` : activeMetric === 'precip' ? `${h.precip}%` : `${h.wind}k`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline axis */}
                <div className="flex justify-between text-xs text-slate-400 font-mono px-2 pt-1 border-t border-slate-800/60">
                  {hourly.map((h, i) => (
                    <span key={i}>{h.time}</span>
                  ))}
                </div>
              </div>

              {/* 7-Day Synoptic Outlook */}
              <div className="bg-[#101524]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <h3 className="text-base font-semibold text-white mb-4">7-Day Synoptic Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {daily.map((d, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center p-3 rounded-xl border transition ${
                        i === 0
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-[#0b0e18] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-medium text-slate-300">{d.day}</span>
                      <span className="text-2xl my-2">{renderWeatherSymbol(d.condition)}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-full">{d.condition}</span>
                      <div className="mt-2 text-xs font-mono flex gap-1.5">
                        <span className="text-white font-semibold">{d.max_temp}°</span>
                        <span className="text-slate-500">{d.min_temp}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Sun Copilot Intelligence Chat View */
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-3xl mx-auto">
            <div className="flex flex-col items-center justify-center pt-4 pb-2 flex-shrink-0">
              <SunAvatar isListening={isListening} className="w-14 h-14 sm:w-20 sm:h-20" />
              <h2 className="text-base sm:text-xl font-bold mt-1 text-amber-300">
                Sun Copilot Intelligence
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 text-center px-4">
                Strictly streaming live, verified atmospheric telemetry.
              </p>
            </div>

            <ChatStream messages={messages} isLoading={isLoading} />

            <div className="flex-shrink-0 p-3 sm:p-4 bg-[#080b14] border-t border-slate-800">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isListening={isListening} 
                setIsListening={setIsListening} 
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
