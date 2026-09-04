import React from 'react';
import { Sun, CloudRain, Wind, Droplets } from 'lucide-react';

export default function StatRibbon({ weather }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-3xl bg-slate-900/50 backdrop-blur border border-slate-800/80 flex items-center gap-4">
        <div className="p-3 bg-amber-400/10 rounded-2xl text-amber-400"><Sun size={24} /></div>
        <div>
          <span className="text-[11px] text-slate-400">Current Temp</span>
          <p className="text-2xl font-bold">{weather ? `${weather.current.temperature_2m}°C` : '--'}</p>
        </div>
      </div>
      <div className="p-4 rounded-3xl bg-slate-900/50 backdrop-blur border border-slate-800/80 flex items-center gap-4">
        <div className="p-3 bg-blue-400/10 rounded-2xl text-blue-400"><CloudRain size={24} /></div>
        <div>
          <span className="text-[11px] text-slate-400">Precipitation</span>
          <p className="text-2xl font-bold">{weather ? `${weather.current.precipitation} mm` : '--'}</p>
        </div>
      </div>
      <div className="p-4 rounded-3xl bg-slate-900/50 backdrop-blur border border-slate-800/80 flex items-center gap-4">
        <div className="p-3 bg-teal-400/10 rounded-2xl text-teal-400"><Wind size={24} /></div>
        <div>
          <span className="text-[11px] text-slate-400">Wind Velocity</span>
          <p className="text-2xl font-bold">{weather ? `${weather.current.wind_speed_10m} km/h` : '--'}</p>
        </div>
      </div>
      <div className="p-4 rounded-3xl bg-slate-900/50 backdrop-blur border border-slate-800/80 flex items-center gap-4">
        <div className="p-3 bg-indigo-400/10 rounded-2xl text-indigo-400"><Droplets size={24} /></div>
        <div>
          <span className="text-[11px] text-slate-400">Humidity Index</span>
          <p className="text-2xl font-bold">{weather ? `${weather.current.relative_humidity_2m}%` : '--'}</p>
        </div>
      </div>
    </div>
  );
}