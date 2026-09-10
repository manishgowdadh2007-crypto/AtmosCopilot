import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, CloudRain, Wind, History, Trash2, 
  Settings, LogOut, User, Mail, Phone, Clock, ShieldCheck, CheckCircle2,
  Sun, Moon, Volume2, Play, Square, Check, Mic, Activity, Sliders, AudioLines 
} from 'lucide-react';

import SatelliteView from './components/home/SatelliteView';
import SunCopilotCockpit from './components/copilot/SunCopilotCockpit';
import EnvironmentalPanel from './components/home/EnvironmentalPanel';
import AgriAdvisoryView from './components/home/AgriAdvisoryView';
import RoutePlannerView from './components/home/RoutePlannerView';
import DisasterView from './components/home/DisasterView';
import ClimateIntelView from './components/home/ClimateIntelView';
import Header from './components/common/Header';
import SplashScreen from './components/onboarding/SplashScreen';
import AuthModal from './components/onboarding/AuthModal';
import { translations, formatNativeNumber } from './utils/translations';
import { 
  fetchWeatherTelemetry, 
  reverseGeocodeCoordinates, 
  sendAIChatQuery, 
  fetchEnvironmentalTelemetry,
  fetchIPFallbackLocation 
} from './services/api';

const VOICE_CATALOG = [
  { id: 'in-female', name: 'Indian English (Female)', locale: 'en-IN', gender: 'Female', pitch: 1.15, rate: 1.0, accent: 'Indo-Aryan Standard', sample: 'Greetings Operator. Sun Copilot feminine synoptic core initialized.' },
  { id: 'in-male', name: 'Indian English (Male)', locale: 'en-IN', gender: 'Male', pitch: 0.90, rate: 1.0, accent: 'Indo-Aryan Tactical', sample: 'Station online. Sun Copilot Indian male advisory reporting.' },
  { id: 'us-female', name: 'American English (Female)', locale: 'en-US', gender: 'Female', pitch: 1.0, rate: 1.0, accent: 'General American Natural', sample: 'Hello Operator. Sun Copilot standard defense telemetry synchronized.' },
  { id: 'us-male', name: 'American English (Male)', locale: 'en-US', gender: 'Male', pitch: 0.85, rate: 0.98, accent: 'General American Low', sample: 'Terminal lock established. Sun Copilot tactical US unit active.' }
];

export default function App() {
  const savedUser = (() => {
    try {
      const saved = localStorage.getItem('atmos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState(savedUser);
  const [stage, setStage] = useState('splash'); // 'splash' | 'onboarding' | 'app'
  const [currentPage, setCurrentPage] = useState('home');
  const [coords, setCoords] = useState(null);

  const [activeVoiceId, setActiveVoiceId] = useState(() => localStorage.getItem('atmos_voice_id') || 'in-female');
  const [auditioningId, setAuditioningId] = useState(null);
  const [speakingTab, setSpeakingTab] = useState(null);

  const activeVoiceMeta = VOICE_CATALOG.find((v) => v.id === activeVoiceId) || VOICE_CATALOG[0];

  const handleAuditionVoice = (voiceItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (auditioningId === voiceItem.id) {
      setAuditioningId(null);
      return;
    }
    setAuditioningId(voiceItem.id);
    const utterance = new SpeechSynthesisUtterance(voiceItem.sample);
    const voices = window.speechSynthesis.getVoices();
    const matches = voices.filter(v => v.lang.replace('_', '-').includes(voiceItem.locale));
    utterance.voice = matches[0] || voices[0];
    utterance.pitch = voiceItem.pitch;
    utterance.rate = voiceItem.rate;
    utterance.onend = () => setAuditioningId(null);
    utterance.onerror = () => setAuditioningId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveVoice = (voiceId) => {
    setActiveVoiceId(voiceId);
    localStorage.setItem('atmos_voice_id', voiceId);
  };

  const speakTabBriefing = (tabKey, scriptText) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingTab === tabKey) {
      window.speechSynthesis.cancel();
      setSpeakingTab(null);
      return;
    }
    window.speechSynthesis.cancel();
    setSpeakingTab(tabKey);
    const utterance = new SpeechSynthesisUtterance(scriptText.replace(/[*#_`]/g, '').trim());
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices[0];
    utterance.onend = () => setSpeakingTab(null);
    utterance.onerror = () => setSpeakingTab(null);
    window.speechSynthesis.speak(utterance);
  };

  const [weather, setWeather] = useState({
    resolved_city: "Bengaluru, Karnataka",
    current: { temp: 26, condition: "Partly Cloudy", precipitation: 0, humidity: 55, wind: 12, dew_point: 16 },
    hourly: [],
    daily: []
  });

  const [envData, setEnvData] = useState({
    aqi: { value: 36, status: "Good", color: "emerald", pm25: 11, pm10: 15 },
    uv: { index: 5.9, risk: "Moderate", burnTime: "35-45 min" },
    agro: { soilMoisture: "22.6", vpd: "1.43" }
  });

  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState('11:56 AM');
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('temp');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your hyper-local meteorological intelligence core.' }
  ]);

  const t = translations[lang] || translations.en;
  const city = weather?.resolved_city || "Bengaluru, Karnataka";
  const cur = weather.current;

  const handleLogout = () => {
    localStorage.removeItem('atmos_user');
    setUser(null);
    setStage('onboarding');
  };

  // Fail-safe global app transition trigger
  const proceedToApp = () => {
    setStage(user ? 'app' : 'onboarding');
  };

  if (stage === 'splash') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080A0E] text-slate-200">
        <SplashScreen onFinish={proceedToApp} />
        {/* Manual Emergency Bypass Button */}
        <button
          onClick={proceedToApp}
          className="absolute bottom-10 px-6 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono tracking-widest uppercase hover:bg-amber-500/30 transition cursor-pointer"
        >
          Skip to Dashboard ➔
        </button>
      </div>
    );
  }

  if (stage === 'onboarding') {
    return <AuthModal onAuthorized={(c, u) => { if (u) setUser(u); setStage('app'); }} theme={theme} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-sans select-none bg-[#050811] text-white">
      <div className="relative z-50 flex-shrink-0">
        <Header 
          weather={weather}
          coords={coords}
          user={user}
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onLogout={handleLogout}
          lang={lang}
          theme={theme}
          setTheme={setTheme}
        />
      </div>

      <main className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent" style={{ height: "calc(100vh - 64px)" }}>
        {currentPage === 'home' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="p-6 rounded-3xl border border-slate-700 bg-[#0d1322]/80 backdrop-blur-md">
                <h2 className="text-2xl font-bold">{city}</h2>
                <p className="text-sm text-amber-400 mt-1">Temperature: {cur.temp}°C • {cur.condition}</p>
                <button
                  onClick={() => speakTabBriefing('home', `Observatory report for ${city}. Temperature is ${cur.temp} degrees Celsius.`)}
                  className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Vocalize Briefing
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'copilot' && (
          <SunCopilotCockpit
            weather={weather}
            coords={coords}
            messages={messages}
            onSendMessage={(q) => setMessages(p => [...p, { sender: 'user', text: q }, { sender: 'ai', text: 'Telemetry analyzed successfully.' }])}
            isLoading={isLoading}
            activeVoiceProfile={activeVoiceId}
          />
        )}

        {currentPage === 'agri' && <AgriAdvisoryView coords={coords} weather={weather} theme={theme} />}
        {currentPage === 'routes' && <RoutePlannerView coords={coords} weather={weather} lang={lang} theme={theme} />}
        {currentPage === 'disaster' && <DisasterView coords={coords} weather={weather} theme={theme} />}
        {currentPage === 'climate' && <ClimateIntelView coords={coords} weather={weather} theme={theme} />}
        {currentPage === 'settings' && (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold">Settings Panel Active</h2>
            <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl">Log Out</button>
          </div>
        )}
      </main>
    </div>
  );
}
