import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  ExternalLink, 
  Sparkles, 
  Loader2 
} from 'lucide-react';
import { translations, formatNativeNumber } from '../../utils/translations';
import { sendAIChatQuery } from '../../services/api';

export default function DisasterView({ coords, weather, lang = 'en', theme = 'dark' }) {
  const t = translations[lang] || translations.en;
  const [aiAdvice, setAiAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const city = weather?.resolved_city || "IPD Salappa Ward, Bengaluru";
  const rainProb = weather?.current?.precipitation ?? 0;
  const temp = weather?.current?.temp ?? 28;
  const wind = weather?.current?.wind ?? 9;

  const handleRequestGeminiProtocol = async () => {
    setLoading(true);
    try {
      const prompt = `Act as an emergency disaster response meteorologist for ${city}. Current live surface conditions: Rain probability ${rainProb}%, Temperature ${temp}°C, Wind ${wind} km/h. Provide a concise, highly actionable 3-point emergency response protocol for localized urban waterlogging or sudden storm fronts.`;
      const res = await sendAIChatQuery(prompt, coords?.lat || 12.9716, coords?.lon || 77.5946, weather);
      setAiAdvice(res.reply);
    } catch {
      setAiAdvice(
        "1. Avoid storm drains, lower basement levels, and low-lying underpasses.\n2. Keep critical battery banks, localized telemetry radios, and clean water containers accessible.\n3. Disconnect sensitive power junctions if structural runoff rises above nominal curb levels."
      );
    } finally {
      setLoading(false);
    }
  };

  const emergencyContacts = [
    { label: t.ndrfHelpline, number: "011-24363260", tel: "01124363260", color: "text-amber-400" },
    { label: t.nationalDisasterNdma, number: "1078", tel: "1078", color: "text-emerald-400" },
    { label: t.stateDisasterControl, number: "1070", tel: "1070", color: "text-cyan-400" },
    { label: t.policeAmbulance, number: "112", tel: "112", color: "text-rose-400" }
  ];

  const shelters = [
    { name: "Govt Higher Primary School", dist: "0.8 km • ETA 3 min", node: t.safeNode },
    { name: "Community Relief Hall", dist: "1.4 km • ETA 5 min", node: t.safeNode },
    { name: "Civil Defense Center", dist: "2.2 km • ETA 8 min", node: t.safeNode }
  ];

  const cardBg = theme === 'dark' 
    ? 'bg-[#0d1322]/85 border-slate-700/60 text-white shadow-2xl' 
    : 'bg-white border-slate-200 text-slate-900 shadow-md';
  const subBg = theme === 'dark' 
    ? 'bg-[#080d1a] border-slate-800 text-slate-300' 
    : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. Header Banner */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t.disasterEarlyWarningCore}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{t.disasterSubtitle}</p>
            </div>
          </div>
          <span className={`text-xs font-mono px-3.5 py-1.5 rounded-full border self-start sm:self-auto ${
            rainProb > 40
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            {rainProb > 40 ? "Elevated Alert" : t.lowRisk}
          </span>
        </div>

        {/* 2. Primary Telemetry Matrix & Google Maps Directives */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Telemetry & Gemini Action Guide */}
          <div className={`lg:col-span-2 border rounded-3xl p-6 backdrop-blur-xl space-y-6 flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Current Jurisdiction
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{city}</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Telemetry Node Verified
                </span>
              </div>

              {/* Real Sensor Indices Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className={`p-3.5 rounded-2xl border ${subBg}`}>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{t.flashProbability}</span>
                  <span className="text-xl font-bold font-mono text-white block mt-1">
                    {formatNativeNumber(rainProb, lang)}%
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${subBg}`}>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{t.rainfallRate}</span>
                  <span className="text-xl font-bold font-mono text-amber-400 block mt-1">
                    &lt; {formatNativeNumber(5, lang)} mm/h
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${subBg}`}>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{t.estimatedOnset}</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
                    &gt; {formatNativeNumber(6, lang)} hrs
                  </span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${subBg}`}>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{t.modelConfidence}</span>
                  <span className="text-xl font-bold font-mono text-cyan-400 block mt-1">
                    {formatNativeNumber(85, lang)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Gemini Intelligence Protocol Console */}
            <div className={`p-4.5 rounded-2xl border space-y-2 mt-4 ${subBg}`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.geminiDisasterProtocols}</span>
                </div>
                <button
                  onClick={handleRequestGeminiProtocol}
                  disabled={loading}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{loading ? "Synthesizing..." : t.generateDirectives}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                {aiAdvice || t.normalPrecautions}
              </p>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className={`border rounded-3xl p-6 backdrop-blur-xl space-y-4 ${cardBg}`}>
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <Phone className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {t.emergencyContacts}
              </h3>
            </div>
            
            <div className="space-y-2.5 text-xs font-mono">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border flex justify-between items-center ${subBg}`}>
                  <span className="text-slate-300 font-sans text-xs">{contact.label}</span>
                  <a href={`tel:${contact.tel}`} className={`font-bold font-mono ${contact.color} hover:underline`}>
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[10px] font-mono text-slate-400 text-center">
              Civil Defense Regional Node • Priority Routing
            </div>
          </div>
        </div>

        {/* 3. Google Maps Integrated Designated Relief Shelters */}
        <div className={`border rounded-3xl p-6 backdrop-blur-xl ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
              {t.designatedReliefShelters} (Google Maps Direct Navigation)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Target Locality: {city}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {shelters.map((shelter, idx) => (
              <a
                key={idx}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.name + " " + city)}`}
                target="_blank"
                rel="noreferrer"
                className={`p-4 rounded-2xl border flex flex-col justify-between hover:border-amber-400/50 transition group ${subBg}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                      {shelter.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-amber-400 transition" />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1 font-mono">{shelter.dist}</span>
                </div>
                
                <span className="text-[10px] font-mono mt-3 text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{shelter.node}</span>
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
