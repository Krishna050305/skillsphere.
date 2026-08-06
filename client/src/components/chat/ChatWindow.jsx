import React, { useEffect, useRef, useState } from 'react';
import TypingIndicator from './TypingIndicator.jsx';
import MessageInput from './MessageInput.jsx';
import { IconMessage, IconVideo, IconPaperclip } from '../icons';

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
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8" style={{ background: 'var(--bg-card)' }}>
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center border mb-4 animate-pulse" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
          <IconMessage className="text-3xl" />
        </div>
        <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Your Messages</h3>
        <p className="text-sm max-w-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Select a conversation from the sidebar or start a new chat from a gig page to start collaborating.
        </p>
      </div>
    );
  }

  const { otherParticipant } = activeConversation;

  return (
    <div className="flex-1 flex flex-col h-full relative" style={{ background: 'var(--bg-card)' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            {otherParticipant.avatarUrl ? (
              <img
                src={otherParticipant.avatarUrl}
                alt={otherParticipant.name}
                className="h-10 w-10 rounded-full object-cover border"
                style={{ borderColor: 'var(--border-secondary)' }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: 'var(--accent-primary)' }}>
                {otherParticipant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: '#22c55e', borderColor: 'var(--bg-card)' }}></div>
          </div>
          <div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{otherParticipant.name}</h4>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {otherParticipant.role}
            </p>
          </div>
        </div>

        {/* Video Call & Actions */}
        <div className="flex items-center gap-2">
          {/* Disabled Video Call Button */}
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-2 rounded-xl border transition-all cursor-pointer"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
            title="Start video call"
          >
            <IconVideo className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: 'var(--bg-tertiary)' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <IconMessage className="text-2xl mb-2" />
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Say hello to {otherParticipant.name}!</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Send a message to start negotiating.</p>
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
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isSender ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                    style={isSender
                      ? { background: 'var(--accent-primary)', color: '#fff' }
                      : { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-secondary)' }}
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
                                      <IconPaperclip className="w-4 h-4" /> <span className="truncate flex-1 underline">{file.name}</span>
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
                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isSender && (
                      <span className="text-[9px] font-semibold">
                        {msg.readAt ? (
                          <span style={{ color: '#22c55e' }}>Read</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sent</span>
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
        <div className="absolute inset-0 backdrop-blur-sm z-[2000] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--accent-primary)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>Video Calls</h4>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Video calls are coming soon! We are integrating secure WebRTC peer-to-peer connections.
            </p>
            <button
              onClick={() => setShowVideoModal(false)}
              className="mt-6 w-full btn-primary py-2.5 text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
