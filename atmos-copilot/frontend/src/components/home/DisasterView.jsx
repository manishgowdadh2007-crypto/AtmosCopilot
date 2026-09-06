import React, { useState } from 'react';
import { AlertOctagon, Phone, ShieldCheck, Home, Activity, Sparkles } from 'lucide-react';
import { sendAIChatQuery } from '../../services/api';

export default function DisasterView({ coords, weather }) {
  const [aiAdvice, setAiAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const city = weather?.resolved_city || "Bengaluru Regional District";
  const rainProb = weather?.current?.precipitation ?? 10;

  const handleRequestGeminiProtocol = async () => {
    setLoading(true);
    try {
      const prompt = `Act as an emergency disaster response specialist for ${city}. Current rain probability is ${rainProb}%. Provide a 3-step immediate safety checklist for urban localized flooding.`;
      const res = await sendAIChatQuery(prompt, coords?.lat || 12.9716, coords?.lon || 77.5946, weather);
      setAiAdvice(res.reply);
    } catch {
      setAiAdvice("1. Move to higher ground if ground floors begin waterlogging.\n2. Keep offline radios and battery banks accessible.\n3. Avoid underpasses and power transformers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertOctagon className="w-6 h-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Disaster Early Warning Core</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Flood intelligence, squall tracking & regional emergency response</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flash Flood Risk Card */}
          <div className="lg:col-span-2 bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block">Current Jurisdiction</span>
                <h3 className="text-lg font-bold text-white">{city}</h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full">
                {rainProb > 50 ? "Moderate Flood Risk" : "Low Risk"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#080d1a] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase">Flash Probability</span>
                <span className="text-xl font-bold font-mono text-white block mt-1">{rainProb}%</span>
              </div>
              <div className="p-3.5 bg-[#080d1a] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase">Rainfall Rate</span>
                <span className="text-xl font-bold font-mono text-amber-300 block mt-1">&lt; 5 mm/h</span>
              </div>
              <div className="p-3.5 bg-[#080d1a] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase">Estimated Onset</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">&gt; 6 hrs</span>
              </div>
              <div className="p-3.5 bg-[#080d1a] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase">Model Confidence</span>
                <span className="text-xl font-bold font-mono text-cyan-400 block mt-1">85%</span>
              </div>
            </div>

            {/* AI Action Guide */}
            <div className="p-4 bg-[#080d1a] border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini.AI Disaster Protocols</span>
                </div>
                <button
                  onClick={handleRequestGeminiProtocol}
                  className="text-[10px] font-mono text-amber-400 hover:underline"
                >
                  {loading ? "Synthesizing..." : "Generate Directives"}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {aiAdvice || "Normal precautions. Surface runoff within safe operational limits. In case of sudden cloud bursts, verify drainage outflows."}
              </p>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <Phone className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Emergency Contacts</h3>
            </div>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex justify-between items-center">
                <span className="text-slate-300">NDRF Helpline</span>
                <a href="tel:01124363260" className="text-amber-400 font-bold">011-24363260</a>
              </div>
              <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex justify-between items-center">
                <span className="text-slate-300">National Disaster (NDMA)</span>
                <a href="tel:1078" className="text-emerald-400 font-bold">1078</a>
              </div>
              <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex justify-between items-center">
                <span className="text-slate-300">State Disaster Control</span>
                <a href="tel:1070" className="text-cyan-400 font-bold">1070</a>
              </div>
              <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex justify-between items-center">
                <span className="text-slate-300">Police & Ambulance</span>
                <a href="tel:112" className="text-rose-400 font-bold">112</a>
              </div>
            </div>

            {/* Nearest Shelters */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-white pt-3 border-t border-slate-800">
              Designated Relief Shelters
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold block">Govt Higher Primary School</span>
                  <span className="text-[10px] text-slate-400 font-mono">0.8 km • ETA 3 min</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Safe Node</span>
              </div>
              <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-white font-semibold block">Community Relief Hall</span>
                  <span className="text-[10px] text-slate-400 font-mono">1.4 km • ETA 5 min</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Safe Node</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
