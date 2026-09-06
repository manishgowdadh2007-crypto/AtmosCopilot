import React from 'react';
import { Wind, Sun, Sprout, ShieldAlert, Droplets, Activity } from 'lucide-react';

export default function EnvironmentalPanel({ envData }) {
  const aqi = envData?.aqi || { value: 32, status: "Good", pm25: 18, pm10: 34 };
  const uv = envData?.uv || { index: 4.8, risk: "Moderate", burnTime: "40 min" };
  const agro = envData?.agro || { soilMoisture: "24.5", vpd: "1.12" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Real-Time Air Quality Index (AQI) */}
      <div className="bg-[#0d1322]/80 border border-slate-700/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">Air Quality Index</h3>
              <p className="text-[11px] text-slate-400">Regional Atmospheric Purity</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            {aqi.status}
          </span>
        </div>

        <div className="my-4 flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-mono font-light text-white">{aqi.value}</span>
          <span className="text-xs text-slate-400 font-mono">EAQI</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-300">
          <div>
            <span className="text-slate-500 block">PM 2.5</span>
            <span className="text-slate-200 font-semibold">{aqi.pm25} µg/m³</span>
          </div>
          <div>
            <span className="text-slate-500 block">PM 10</span>
            <span className="text-slate-200 font-semibold">{aqi.pm10} µg/m³</span>
          </div>
        </div>
      </div>

      {/* 2. UV Index & Solar Radiance */}
      <div className="bg-[#0d1322]/80 border border-slate-700/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">Solar Exposure & UV</h3>
              <p className="text-[11px] text-slate-400">Photochemical Intensity</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
            {uv.risk}
          </span>
        </div>

        <div className="my-4 flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-mono font-light text-amber-300">{uv.index}</span>
          <span className="text-xs text-slate-400 font-mono">UVI</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-300">
          <div>
            <span className="text-slate-500 block">Burn Window</span>
            <span className="text-slate-200 font-semibold">~{uv.burnTime}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Radiation Protection</span>
            <span className="text-slate-200 font-semibold">{uv.index > 5 ? "SPF 30+ Required" : "Nominal"}</span>
          </div>
        </div>
      </div>

      {/* 3. Soil Moisture & Vapor-Pressure Deficit (Agro) */}
      <div className="bg-[#0d1322]/80 border border-slate-700/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300">Agro & Evapotranspiration</h3>
              <p className="text-[11px] text-slate-400">Soil Saturation & Crop Dynamics</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            Field Metrics
          </span>
        </div>

        <div className="my-4 flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-mono font-light text-cyan-300">{agro.soilMoisture}%</span>
          <span className="text-xs text-slate-400 font-mono">Saturation</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-300">
          <div>
            <span className="text-slate-500 block">Vapor Deficit (VPD)</span>
            <span className="text-slate-200 font-semibold">{agro.vpd} kPa</span>
          </div>
          <div>
            <span className="text-slate-500 block">Transpiration Stress</span>
            <span className="text-slate-200 font-semibold">{parseFloat(agro.vpd) > 1.5 ? "Elevated" : "Optimal"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
