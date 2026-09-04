import React, { useState } from "react";

export default function GoogleWeatherView({ weather }) {
  const [activeTab, setActiveTab] = useState("temp"); // "temp" | "precip" | "wind"

  const cur = weather?.current || { temp: 24, condition: "Partly cloudy", precipitation: 12, humidity: 75, wind: 10 };
  const city = weather?.resolved_city || "Vijayanagar, Bengaluru";
  const hourly = weather?.hourly || [];
  const daily = weather?.daily || [];

  const getIcon = (condition = "") => {
    const c = condition.toLowerCase();
    if (c.includes("rain")) {
      return (
        <div className="relative text-3xl sm:text-4xl">
          🌧️
        </div>
      );
    }
    if (c.includes("cloud") || c.includes("overcast")) {
      return (
        <div className="relative text-3xl sm:text-4xl">
          ⛅
        </div>
      );
    }
    return (
      <div className="relative text-3xl sm:text-4xl">
        ☀️
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl bg-[#202124] text-[#e8eaed] rounded-2xl p-4 sm:p-7 shadow-2xl font-sans border border-white/5 my-auto">
      {/* Top Location Bar */}
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span className="text-base sm:text-lg font-medium text-white">{city}</span>
        <button className="ml-2 px-2.5 py-0.5 rounded-full border border-slate-600 text-xs text-blue-300 hover:bg-slate-700/50 transition">
          Use precise location
        </button>
      </div>

      {/* Main Stats Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            <span className="text-5xl sm:text-6xl">🌤️</span>
          </div>

          <div className="flex items-start">
            <span className="text-5xl sm:text-7xl font-light tracking-tight">{cur.temp}</span>
            <div className="text-sm sm:text-base text-slate-400 ml-1.5 pt-1">
              <span className="text-white cursor-pointer">°C</span> | <span className="hover:text-white cursor-pointer">°F</span>
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

      {/* Metric Tabs */}
      <div className="flex gap-6 border-b border-slate-700/80 text-sm font-medium mb-3">
        <button
          onClick={() => setActiveTab("temp")}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === "temp" ? "border-amber-400 text-amber-400 font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Temperature
        </button>
        <button
          onClick={() => setActiveTab("precip")}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === "precip" ? "border-amber-400 text-amber-400 font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Precipitation
        </button>
        <button
          onClick={() => setActiveTab("wind")}
          className={`pb-2.5 border-b-2 transition ${
            activeTab === "wind" ? "border-amber-400 text-amber-400 font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Wind
        </button>
      </div>

      {/* Temperature Curve Chart */}
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

        {/* Dynamic Metric Labels over Chart Curve */}
        <div className="absolute inset-0 flex justify-between items-start pt-1 px-2 text-xs font-semibold text-slate-200">
          {hourly.slice(0, 8).map((h, i) => (
            <div key={i} className="flex flex-col items-center">
              <span>{activeTab === "temp" ? `${h.temp}°` : activeTab === "precip" ? `${h.precip}%` : `${h.wind}k`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8-Hour Timestamps */}
      <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 border-b border-slate-700/80 pb-3 mb-4 px-2">
        {hourly.slice(0, 8).map((h, i) => (
          <span key={i}>{h.time}</span>
        ))}
      </div>

      {/* 8-Day Forecast Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {daily.map((d, i) => (
          <div
            key={i}
            className={`flex flex-col items-center py-3 px-1 rounded-xl transition cursor-pointer ${
              i === 0 ? "bg-[#303134]" : "hover:bg-[#303134]/50"
            }`}
          >
            <span className="text-xs font-medium text-slate-300">{d.day}</span>
            <div className="my-2">{getIcon(d.condition)}</div>
            <div className="text-xs flex gap-1 font-medium">
              <span className="text-white">{d.max_temp}°</span>
              <span className="text-slate-500">{d.min_temp}°</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Note */}
      <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-end gap-3">
        <span className="hover:underline cursor-pointer">Google Weather</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Feedback</span>
      </div>
    </div>
  );
}
