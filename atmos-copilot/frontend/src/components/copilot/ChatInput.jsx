import React, { useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, isListening, setIsListening }) {
  const [text, setText] = useState('');

  const triggerVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition unavailable. Please run on Google Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(transcript);
      onSendMessage(transcript);
    };
    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl">
      <input 
        type="text" 
        placeholder="Ask about live precipitation, wind vectors, or temperature..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 bg-transparent px-4 py-2 text-xs text-white outline-none placeholder:text-slate-500"
      />
      <button 
        type="button" 
        onClick={triggerVoice}
        className={`p-2.5 rounded-xl transition ${
          isListening ? 'bg-red-500 text-white animate-bounce' : 'text-slate-400 hover:text-white'
        }`}
        title="Microphone Input"
      >
        {isListening ? <Mic size={18} /> : <MicOff size={18} />}
      </button>
      <button 
        type="submit" 
        className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
      >
        <Send size={18} />
      </button>
    </form>
  );
}