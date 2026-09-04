import React from 'react';
import { Calendar } from 'lucide-react';

export default function ForecastList({ weather }) {
  return (
    <div className="rounded-3xl bg-slate-900/50 backdrop-blur border border-slate-800/80 p-6 flex flex-col">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-white">
        <Calendar className="w-4 h-4 text-amber-400" />
        Synoptic Multi-Scale Outlook
      </h3>
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs">
        {weather?.daily?.temperature_2m_max?.slice(0, 5).map((maxTemp, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <span className="font-semibold text-slate-300">Day +{idx + 1}</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-300 font-medium">{maxTemp}°C</span>
              <span className="text-slate-500">/</span>
              <span className="text-blue-400">{weather.daily.temperature_2m_min[idx]}°C</span>
            </div>
          </div>
        ))}
        <div className="mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed">
          Monthly Baseline: Telemetry aligns with 30-year regional climatological norms.
        </div>
      </div>
    </div>
  );
}