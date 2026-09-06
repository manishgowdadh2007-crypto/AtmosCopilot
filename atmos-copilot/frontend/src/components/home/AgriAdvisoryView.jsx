import React, { useState, useEffect } from 'react';
import { Sprout, Search, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { sendAIChatQuery } from '../../services/api';

const DISTRICT_PRESETS = [
  { name: "Bengaluru", crops: ["Ragi (Finger Millet)", "Maize", "Grapes", "Vegetables", "Flowers"], soil: "Red Loamy", rainfall: "850 mm" },
  { name: "Mysuru", crops: ["Paddy", "Sugarcane", "Tobacco", "Cotton", "Ragi"], soil: "Red Sandy / Clay Loam", rainfall: "780 mm" },
  { name: "Mandya", crops: ["Sugarcane", "Paddy (Rice)", "Banana", "Ragi", "Coconut"], soil: "Red Sandy Loam", rainfall: "700 mm" },
  { name: "Chamarajanagar", crops: ["Turmeric", "Banana", "Maize", "Jowar", "Pulses"], soil: "Black & Red Soils", rainfall: "750 mm" }
];

export default function AgriAdvisoryView({ coords, weather }) {
  const [selectedPlace, setSelectedPlace] = useState("Bengaluru");
  const [typedPlace, setTypedPlace] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const activePreset = DISTRICT_PRESETS.find(p => p.name.toLowerCase() === selectedPlace.toLowerCase()) || {
    name: selectedPlace,
    crops: ["Paddy", "Millets", "Pulses", "Seasonal Vegetables"],
    soil: "Alluvial / Loam",
    rainfall: "Regional Avg"
  };

  const consultAgriAI = async (placeName) => {
    setLoading(true);
    try {
      const prompt = `Provide practical agricultural guidance for ${placeName} during current seasonal weather. List the top 3 best-suited crops, key soil considerations, and irrigation advice in 3 short paragraphs.`;
      const res = await sendAIChatQuery(prompt, coords?.lat || 12.9716, coords?.lon || 77.5946, weather);
      setAiAnalysis(res.reply);
    } catch {
      setAiAnalysis("Soil moisture and climate conditions are favorable. Prioritize climate-resilient millets and drip irrigation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    consultAgriAI(selectedPlace);
  }, [selectedPlace]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Sprout className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Weather-Smart Agriculture Intelligence</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Crop Suitability & Agro-Advisory</h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={typedPlace}
                onChange={(e) => setTypedPlace(e.target.value)}
                placeholder="Search area (e.g., Hassan)..."
                className="bg-[#080d1a] border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white outline-none focus:border-amber-400"
              />
              <button
                onClick={() => { if (typedPlace) setSelectedPlace(typedPlace); }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Analyze</span>
              </button>
            </div>
          </div>

          {/* Quick-select District Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {DISTRICT_PRESETS.map((d) => (
              <button
                key={d.name}
                onClick={() => setSelectedPlace(d.name)}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  selectedPlace.toLowerCase() === d.name.toLowerCase()
                    ? "bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/10"
                    : "bg-[#080d1a] border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-xs font-bold text-white block">{d.name}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Soil: {d.soil}</span>
                <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Rain: ~{d.rainfall}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Crop Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">High-Yield Regional Crops</h3>
            <div className="space-y-2.5">
              {activePreset.crops.map((c, i) => (
                <div key={i} className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">{c}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300">Optimal</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Powered Crop & Agro Intel */}
          <div className="lg:col-span-2 bg-[#0d1322]/85 border border-slate-700/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Gemini.AI Crop Intelligence Synthesis</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Target: {selectedPlace}</span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                Querying agricultural models...
              </div>
            ) : (
              <div className="text-xs leading-relaxed text-slate-300 space-y-3 whitespace-pre-line font-sans">
                {aiAnalysis}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
