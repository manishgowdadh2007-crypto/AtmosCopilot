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
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    try {
      const response = await sendAIChatQuery(queryText, coords?.lat || 15.36, coords?.lon || 75.12);
      setMessages(prev => [...prev, { sender: 'ai', text: response.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: "Weather link disconnected. Check API status." }]);
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
      <Header 
        coords={coords} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
      />

      <div className="flex-1 overflow-y-auto z-10">
        {currentPage === 'home' ? (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            <StatRibbon weather={weather} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RainbowGlobe />
              </div>
              <ForecastList weather={weather} />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-between p-6 max-w-4xl mx-auto">
            <SunAvatar isListening={isListening} />
            <ChatStream messages={messages} />
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isListening={isListening} 
              setIsListening={setIsListening} 
            />
          </div>
        )}
      </div>
    </AmbientBg>
  );
}