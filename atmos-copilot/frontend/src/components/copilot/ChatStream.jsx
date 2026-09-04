import React, { useEffect, useRef } from "react";

export default function ChatStream({ messages = [], isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 w-full max-w-2xl mx-auto">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
              msg.sender === "user"
                ? "bg-blue-600 text-white rounded-br-none shadow-md"
                : "bg-[#161f36] text-slate-200 border border-white/10 rounded-bl-none shadow-md"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[#161f36] text-amber-300 border border-white/10 px-3 py-1.5 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Analyzing telemetry...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
