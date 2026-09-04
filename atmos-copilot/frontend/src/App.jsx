import React, { useState, useEffect } from 'react';
import AmbientBg from './components/common/AmbientBg';
import Header from './components/common/Header';
import SplashScreen from './components/onboarding/SplashScreen';
import AuthModal from './components/onboarding/AuthModal';
import StatRibbon from './components/home/StatRibbon';
import RainbowGlobe from './components/home/RainbowGlobe';
import ForecastList from './components/home/ForecastList';
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

  return (
    <AmbientBg>
      <div className="flex flex-col h-[100dvh] w-full overflow-hidden">
        {/* Top Persistent Navigation Header */}
        <div className="flex-shrink-0 z-50">
          <Header 
            coords={coords} 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
          />
        </div>

        {/* Viewport Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentPage === 'home' ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
              <StatRibbon weather={weather} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RainbowGlobe />
                </div>
                <ForecastList weather={weather} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden">
              {/* Single Scaled Hero Header */}
              <div className="flex flex-col items-center justify-center my-2 sm:my-4 flex-shrink-0">
                <SunAvatar isListening={isListening} className="w-14 h-14 sm:w-20 sm:h-20" />
                <h2 className="text-lg sm:text-2xl font-bold mt-2 text-amber-300">
                  Sun Copilot Intelligence
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 text-center px-4">
                  Strictly streaming live, verified atmospheric telemetry.
                </p>
              </div>

              {/* Scrollable Chat Area */}
              <ChatStream messages={messages} isLoading={isLoading} />

              {/* Pinned Responsive Input Bar */}
              <div className="flex-shrink-0 p-3 sm:p-4 bg-[#0a0d18]/80 backdrop-blur-md border-t border-white/10">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isListening={isListening} 
                  setIsListening={setIsListening} 
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AmbientBg>
  );
}
