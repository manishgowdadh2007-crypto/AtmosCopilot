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
  const [activeWeatherTab, setActiveWeatherTab] = useState('temp');
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
      setMessages(prev => [...prev, { sender: 'ai', text: "Weather link disconnected. Check API status." }]);
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

  // Weather fallback & data mapping matching Google Weather UI
  const cur = weather?.current || { temp: 24, condition: "Partly cloudy", precipitation: 12, humidity: 75, wind: 10 };
  const city = weather?.resolved_city || "Vijayanagar, Bengaluru";
  const hourly = weather?.hourly || [
    { time: "10 pm", temp: 24, precip: 12, wind: 10 },
    { time: "1 am", temp: 23, precip: 10, wind: 9 },
    { time: "4 am", temp: 22, precip: 5, wind: 8 },
    { time: "7 am", temp: 21, precip: 5, wind: 8 },
    { time: "10 am", temp: 25, precip: 10, wind: 12 },
    { time: "1 pm", temp: 29, precip: 15, wind: 14 },
    { time: "4 pm", temp: 31, precip: 20, wind: 15 },
    { time: "7 pm", temp: 28, precip: 15, wind: 11 }
  ];
  const daily = weather?.daily || [
    { day: "Fri", max_temp: 30, min_temp: 21, condition: "Rain" },
    { day: "Sat", max_temp: 31, min_temp: 21, condition: "Partly cloudy" },
    { day: "Sun", max_temp: 31, min_temp: 20, condition: "Partly cloudy" },
    { day: "Mon", max_temp: 31, min_temp: 20, condition: "Partly cloudy" },
    { day: "Tue", max_temp: 31, min_temp: 21, condition: "Partly cloudy" },
    { day: "Wed", max_temp: 30, min_temp: 21, condition: "Partly cloudy" },
    { day: "Thu", max_temp: 30, min_temp: 21, condition: "Cloudy" },
    { day: "Fri", max_temp: 30, min_temp: 21, condition: "Partly cloudy" }
  ];

  const getConditionIcon = (condition = "") => {
    const c = condition.toLowerCase();
    if (c.includes("rain")) return "🌧️";
    if (c.includes("cloud") || c.includes("overcast")) return "⛅";
    return "☀️";
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#17181c] text-white overflow-hidden">
      {/* 1. Top Navbar */}
      <div className="flex-shrink-0 z-50">
        <Header 
          weather={weather}
          coords={coords}
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      </div>

      {/* 2. Main Page Viewport */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {currentPage === 'home' ? (
          /* Exact Google Weather Dashboard Layout */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-[#202124] text-[#e8eaed] rounded-2xl p-5 sm:p-7 shadow-2xl font-sans border border-white/5 my-auto">
              
              {/* Location Bar */}
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="text-base sm:text-lg font-medium text-white">{city}</span>
                <button className="ml-2 px-2.5 py-0.5 rounded-full border border-slate-600 text-xs text-blue-300 hover:bg-slate-700/50 transition">
                  Use precise location
                </button>
              </div>

              {/* Main Weather Stats */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl sm:text-6xl flex items-center justify-center">
                    🌤️
                  </div>

                  <div className="flex items-start">
                    <span className="text-5xl sm:text-7xl font-light tracking-tight">{cur.temp}</span>
                    <div className="text-sm sm:text-base text-slate-400 ml-1.5 pt-1">
                      <span className="text-white cursor-pointer font-medium">°C</span> | <span className="hover:text-white cursor-pointer">°F</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-400 space-y-0.5 border-l border-slate-700/80 pl-4 ml-1">
                    <div>Precipitation: {cur.precipitation}%</div>
                    <div>Humidity: {cur.humidity}%</div>
                    <div>Wind: {cur.wind} km/h</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base sm:text-lg font-medium text-white">Weather</div>
                  <div className="text-xs sm:text-sm text-slate-400">Friday, 9:00 pm</div>
                  <div className="text-xs sm:text-sm text-slate-300 font-medium">{cur.condition}</div>
                </div>
              </div>

              {/* Tabs: Temperature | Precipitation | Wind */}
              <div className="flex gap-6 border-b border-slate-700/80 text-sm font-medium mb-3">
                <button
                  onClick={() => setActiveWeatherTab("temp")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeWeatherTab === "temp" ? "border-amber-400 text-amber-400 font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Temperature
                </button>
                <button
                  onClick={() => setActiveWeatherTab("precip")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeWeatherTab === "precip" ? "border-amber-400 text-amber-400 font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Precipitation
                </button>
                <button
                  onClick={() => setActiveWeatherTab("wind")}
                  className={`pb-2.5 border-b-2 transition ${
                    activeWeatherTab === "wind" ? "border-amber-400 text-amber-400 font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Wind
                </button>
              </div>

              {/* Graph Curve */}
              <div className="relative w-full h-24 sm:h-28 overflow-hidden">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 100">
                  <defs>
                    <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,60 Q 60,65 125,75 T 250,55 T 375,20 T 500,60 L 500,100 L 0,100 Z"
                    fill="url(#yellowGrad)"
                  />
                  <path
                    d="M 0,60 Q 60,65 125,75 T 250,55 T 375,20 T 500,60"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Values Over Graph */}
                <div className="absolute inset-0 flex justify-between items-start pt-1 px-2 text-xs font-semibold text-slate-200">
                  {hourly.slice(0, 8).map((h, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span>{activeWeatherTab === "temp" ? `${h.temp}°` : activeWeatherTab === "precip" ? `${h.precip}%` : `${h.wind}k`}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Timestamps */}
              <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 border-b border-slate-700/80 pb-3 mb-4 px-2">
                {hourly.slice(0, 8).map((h, i) => (
                  <span key={i}>{h.time}</span>
                ))}
              </div>

              {/* 8-Day Forecast */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {daily.map((d, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center py-3 px-1 rounded-xl transition cursor-pointer ${
                      i === 0 ? "bg-[#303134]" : "hover:bg-[#303134]/50"
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-300">{d.day}</span>
                    <div className="my-2 text-xl">{getConditionIcon(d.condition)}</div>
                    <div className="text-xs flex gap-1 font-medium">
                      <span className="text-white">{d.max_temp}°</span>
                      <span className="text-slate-500">{d.min_temp}°</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-end gap-3">
                <span className="hover:underline cursor-pointer">Google Weather</span>
                <span>•</span>
                <span className="hover:underline cursor-pointer">Feedback</span>
              </div>
            </div>
          </div>
        ) : (
          /* Sun Copilot View */
          <div className="flex-1 flex flex-col min-h-0 w-full max-w-3xl mx-auto">
            <div className="flex flex-col items-center justify-center pt-3 pb-1 flex-shrink-0">
              <SunAvatar isListening={isListening} className="w-14 h-14 sm:w-20 sm:h-20" />
              <h2 className="text-base sm:text-xl font-bold mt-1 text-amber-300">
                Sun Copilot Intelligence
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 text-center px-4">
                Strictly streaming live, verified atmospheric telemetry.
              </p>
            </div>

            <ChatStream messages={messages} isLoading={isLoading} />

            <div className="flex-shrink-0 p-3 bg-[#17181c] border-t border-white/10">
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
