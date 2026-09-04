import React from 'react';

export default function ChatStream({ messages }) {
  return (
    <div className="w-full max-h-48 overflow-y-auto space-y-3 mb-4 px-2">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
            m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900/90 border border-slate-800 text-slate-200'
          }`}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}