import React from 'react';

/**
 * Renders a subtle typing indicator showing that the other user is typing.
 * Includes three pulsing dots and custom layout.
 */
export default function TypingIndicator({ isTyping, userName }) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 rounded-2xl border border-slate-800/80 w-fit max-w-[250px] animate-pulse">
      {/* Animated Pulsing Dots */}
      <div className="flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
      </div>
      <p className="text-[11px] font-semibold text-slate-400">
        {userName ? `${userName} is typing` : 'Typing'}...
      </p>
    </div>
  );
}
