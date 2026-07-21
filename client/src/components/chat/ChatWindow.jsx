import React, { useEffect, useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator.jsx';
import MessageInput from './MessageInput.jsx';

export default function ChatWindow({
  activeConversation,
  messages,
  onSendMessage,
  onTyping,
  isOtherUserTyping,
  currentUser
}) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const scrollRef = useRef(null);

  // Scroll to bottom on new messages or typing status updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherUserTyping]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/20 text-center p-8">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/15 mb-4 animate-pulse">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="text-lg font-bold text-slate-200">Your Messages</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select a conversation from the sidebar or start a new chat from a gig page to start collaborating.
        </p>
      </div>
    );
  }

  const { otherParticipant } = activeConversation;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/10 relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            {otherParticipant.avatarUrl ? (
              <img
                src={otherParticipant.avatarUrl}
                alt={otherParticipant.name}
                className="h-10 w-10 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white border border-indigo-500/30">
                {otherParticipant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950"></div>
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">{otherParticipant.name}</h4>
            <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
              {otherParticipant.role}
            </p>
          </div>
        </div>

        {/* Video Call & Actions */}
        <div className="flex items-center gap-2">
          {/* Disabled Video Call Button */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
            title="Start video call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <span className="text-2xl mb-2">👋</span>
            <p className="text-xs font-semibold">Say hello to {otherParticipant.name}!</p>
            <p className="text-[10px] text-slate-650 mt-1">Send a message to start negotiating.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = msg.sender._id.toString() === currentUser._id.toString();
            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[70%] flex flex-col gap-1.5`}>
                  {/* Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isSender
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                        : 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-slate-700/60'
                    }`}
                  >
                    {msg.content}

                    {/* Attachments inside bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                        {msg.attachments.map((file, idx) => {
                          const isImage = file.type?.startsWith('image/');
                          return (
                            <div key={idx} className="block">
                              {isImage ? (
                                <div className="rounded-lg overflow-hidden border border-white/10 max-w-full">
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="max-h-48 max-w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/35 text-[11px] font-semibold text-white truncate transition-all"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  📎 <span className="truncate flex-1 underline">{file.name}</span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Read Ack */}
                  <div className="flex items-center gap-1.5 px-1.5">
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isSender && (
                      <span className="text-[9px] font-semibold">
                        {msg.readAt ? (
                          <span className="text-emerald-400">Read</span>
                        ) : (
                          <span className="text-slate-600">Sent</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        <div className="flex items-start">
          <TypingIndicator isTyping={isOtherUserTyping} userName={otherParticipant.name} />
        </div>

        {/* Scroll Target */}
        <div ref={scrollRef}></div>
      </div>

      {/* Message Input */}
      <MessageInput
        recipientId={otherParticipant._id}
        onTyping={onTyping}
        onSendMessage={onSendMessage}
      />

      {/* Video Call Modal */}
      {showVideoModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-100">Video Calls</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Video calls are coming soon! We are currently integrating secure WebRTC peer-to-peer connections.
            </p>
            <button
              onClick={() => setShowVideoModal(false)}
              className="mt-6 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
