import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Copy, Check, Sparkles, Sun
} from 'lucide-react';
import SunAvatar from './SunAvatar';
import { resolveVoiceUtterance } from '../../utils/voiceManager';

const PERSONAS = [
  {
    id: 'meteorologist',
    title: 'Meteorologist',
    badge: 'SYNOPTIC CORE',
    desc: 'Atmospheric fronts, barometric trends, dew point depression & diurnal swings'
  },
  {
    id: 'highway',
    title: 'Highway & Commute',
    badge: 'PAVEMENT & ROADS',
    desc: 'Aquaplaning risk, surface visibility, braking distance & vector gusts'
  },
  {
    id: 'agro',
    title: 'Agro & Farming',
    badge: 'SOIL & SPRAYS',
    desc: 'Evapotranspiration rate, spray drift index & dew point leaf wetness'
  },
  {
    id: 'fitness',
    title: 'Outdoor & Fitness',
    badge: 'BIOMETRICS & RUN',
    desc: 'Thermal strain, UV exposure threshold, hydration demand & air density'
  }
];

export default function SunCopilotCockpit({ 
  weather, 
  coords, 
  messages, 
  onSendMessage, 
  isLoading,
  isListening,
  setIsListening,
  activeVoiceProfile = 'in-female'
}) {
  const [activePersona, setActivePersona] = useState('meteorologist');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Web Speech API: Voice Synthesis routed from Settings selection
  const speakText = (text) => {
    if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const utterance = resolveVoiceUtterance(text, activeVoiceProfile);
    if (!utterance) return;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    onSendMessage(inputVal);
    setInputVal('');
  };

  const activePersonaObj = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full overflow-hidden text-slate-100 select-none pb-2">
      
      {/* 1. Header: Avatar & Audio Mute Control */}
      <div className="flex flex-col items-center justify-center pt-2 pb-2 relative flex-shrink-0">
        <div className="relative group cursor-pointer">
          <SunAvatar isListening={isListening || isSpeaking} className="w-14 h-14" />
          <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Mute Toggle Badge */}
        <div className="flex items-center gap-2 mt-2 bg-slate-900/80 border border-slate-800/90 rounded-full px-3 py-1 backdrop-blur-md">
          <button 
            onClick={() => {
              if (!isAudioMuted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
              setIsAudioMuted(!isAudioMuted);
            }} 
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition cursor-pointer"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[11px] font-mono text-slate-300">
              {isAudioMuted ? "Muted" : "Voice Synthesis Live"}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Persona Segmented Controls */}
      <div className="flex-shrink-0 px-4 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            Advisory Intelligence Persona:
          </span>
          <span className="text-[11px] font-mono text-slate-400 truncate">
            {activePersonaObj.desc}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PERSONAS.map((p) => {
            const isActive = activePersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePersona(p.id)}
                className={`p-2.5 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center justify-between cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-sky-950/70 to-slate-900/90 border-sky-400/70 shadow-[0_0_15px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/50' 
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">{p.title}</div>
                  <div className="text-[9px] font-mono text-sky-400/90 tracking-wider font-semibold">{p.badge}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Ground Telemetry HUD Bar */}
      <div className="flex-shrink-0 px-4 mb-3">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 backdrop-blur-xl p-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-tight">
                Live Ground Telemetry: <span className="text-sky-400 font-mono">{weather?.resolved_city || "Resolving Locality..."}</span>
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-400/40 text-sky-300 tracking-wider font-bold">
              SYNOPTIC SYNCHRONIZED
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-xs font-mono font-bold text-amber-400">{weather?.current?.temp ?? 25}°C</div>
              <div className="text-[10px] text-slate-400 truncate">{weather?.current?.condition ?? "Clear"}</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-xs font-mono font-bold text-cyan-400">{weather?.current?.humidity ?? 60}% RH</div>
              <div className="text-[10px] text-slate-400">Dew: {weather?.current?.dew_point ?? 18}°C</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-xs font-mono font-bold text-emerald-400">{weather?.current?.wind ?? 12} km/h</div>
              <div className="text-[10px] text-slate-400">Surface Vector</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-xs font-mono font-bold text-indigo-400">{weather?.current?.precipitation ?? 0}%</div>
              <div className="text-[10px] text-slate-400">Rain Probability</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-xs font-mono font-bold text-orange-400">UV 5.4</div>
              <div className="text-[10px] text-slate-400">Photochemical</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-xs font-mono font-bold text-teal-400">24.5%</div>
              <div className="text-[10px] text-slate-400">Soil Moisture</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Stream Conversation Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 space-y-3">
        {messages.map((m, idx) => {
          const isAI = m.sender === 'ai';
          return (
            <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
              <div className={`max-w-2xl rounded-2xl p-4 border backdrop-blur-xl transition-all duration-300 ${
                isAI 
                  ? 'bg-slate-950/80 border-slate-800/80 text-slate-200' 
                  : 'bg-gradient-to-r from-sky-600 to-sky-500 border-sky-400/50 text-white shadow-lg shadow-sky-500/20'
              }`}>
                {isAI && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" /> METEOROLOGIST ADVISORY
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakText(m.text)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Vocalize
                      </button>
                      <button
                        onClick={() => handleCopy(idx, m.text)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
                
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                  {m.text}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-3 bg-slate-950/80 border border-slate-800/80 text-sky-400 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              Synthesizing meteorological model vectors...
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 5. Command Input Bar */}
      <div className="flex-shrink-0 px-4 pt-2">
        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Inquire about thermal amplitudes, commute safety, or soil wetness..."
            className="w-full bg-slate-950/90 border border-slate-800/90 rounded-2xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/80 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="absolute right-2 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition disabled:opacity-40 cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
