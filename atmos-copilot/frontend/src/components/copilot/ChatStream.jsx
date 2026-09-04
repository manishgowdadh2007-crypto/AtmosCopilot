import React, { useEffect, useRef } from "react";
import SunAvatar from "./SunAvatar";
import ChatInput from "./ChatInput";

export default function ChatStream({ messages = [], onSendMessage, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] w-full max-w-4xl mx-auto overflow-hidden">
      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {/* Compact Hero for Mobile */}
        <div className="flex flex-col items-center justify-center my-2 sm:my-4 flex-shrink-0">
          <SunAvatar className="w-16 h-16 sm:w-24 sm:h-24" />
          <h2 className="text-lg sm:text-2xl font-bold mt-2 text-amber-300">
            Sun Copilot Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 text-center">
            Strictly streaming live, verified atmospheric telemetry.
          </p>
        </div>

        {/* Message Stream */}
        <div className="space-y-3 pb-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                    : "bg-[#11192e] text-slate-200 border border-slate-700/50 rounded-bl-none shadow-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#11192e] text-amber-300/80 border border-slate-700/50 px-4 py-2 rounded-2xl rounded-bl-none text-xs flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Interpreting atmospheric data...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Pinned Input Bar */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-[#0a0d18] border-t border-slate-800">
        <ChatInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
