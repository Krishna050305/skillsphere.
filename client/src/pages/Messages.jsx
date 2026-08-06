import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import { getConversations, getMessagesForConversation } from '../api/messages.api.js';
import useSocket from '../hooks/useSocket.js';

export default function Messages() {
  const currentUser = useSelector((state) => state.auth.user);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { emit, on } = useSocket();

  // 1. Fetch conversations on load
  const loadConversations = async (autoSelectId = null) => {
    setLoadingThreads(true);
    try {
      const data = await getConversations();
      if (data.success) {
        setConversations(data.conversations || []);
        if (autoSelectId) {
          const matched = data.conversations.find((c) => c.conversationId === autoSelectId);
          if (matched) setActiveConversation(matched);
        } else if (activeConversation) {
          const matched = data.conversations.find(
            (c) => c.conversationId === activeConversation.conversationId
          );
          if (matched) setActiveConversation(matched);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Fetch messages when active conversation changes
  const loadMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const data = await getMessagesForConversation(conversationId, 1, 100);
      if (data.success) setMessages(data.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.conversationId);
      emit('message:read', {
        conversationId: activeConversation.conversationId,
        senderId: activeConversation.otherParticipant._id,
      });
      setIsOtherUserTyping(false);
    }
  }, [activeConversation]);

  // 3. Socket listeners
  useEffect(() => {
    const unsubReceive = on('message:receive', (msg) => {
      const currentActiveId = activeConversation?.conversationId;
      if (msg.conversationId === currentActiveId) {
        setMessages((prev) => [...prev, msg]);
        if (msg.recipient._id.toString() === currentUser?._id?.toString()) {
          emit('message:read', { conversationId: currentActiveId, senderId: msg.sender._id });
        }
      }
      loadConversations();
    });

    const unsubTyping = on('message:typing', ({ senderId, isTyping }) => {
      if (
        activeConversation &&
        activeConversation.otherParticipant._id.toString() === senderId.toString()
      ) {
        setIsOtherUserTyping(isTyping);
      }
    });

    const unsubReadAck = on('message:read:ack', ({ conversationId, readerId, readAt }) => {
      if (activeConversation?.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id.toString() === currentUser?._id?.toString() && !msg.readAt
              ? { ...msg, readAt }
              : msg
          )
        );
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.conversationId !== conversationId) return c;
          return {
            ...c,
            unreadCount:
              readerId.toString() === currentUser?._id?.toString() ? 0 : c.unreadCount,
            lastMessage: {
              ...c.lastMessage,
              readAt:
                c.lastMessage.recipient?.toString() === readerId.toString()
                  ? readAt
                  : c.lastMessage.readAt,
            },
          };
        })
      );
    });

    return () => {
      if (unsubReceive) unsubReceive();
      if (unsubTyping) unsubTyping();
      if (unsubReadAck) unsubReadAck();
    };
  }, [on, activeConversation, currentUser, emit]);

  const handleSendMessage = (data) => {
    if (!activeConversation || !currentUser) return;
    emit(
      'message:send',
      {
        conversationId: activeConversation.conversationId,
        recipientId: activeConversation.otherParticipant._id,
        content: data.content,
        attachments: data.attachments || [],
      },
      (res) => {
        if (!res?.success) console.error('Failed to send message:', res?.error);
      }
    );
  };

  const handleTyping = (isTyping) => {
    if (!activeConversation) return;
    emit('message:typing', { recipientId: activeConversation.otherParticipant._id, isTyping });
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Navigation />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex gap-6 h-[calc(100vh-130px)] overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-80 flex flex-col overflow-hidden rounded-3xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          {/* Sidebar Header */}
          <div className="p-5 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                Messages
              </h2>
              {totalUnread > 0 && (
                <span
                  className="h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {totalUnread}
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
              DIRECT MESSAGES & NEGOTIATIONS
            </p>

            {/* Search input */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="mt-3 w-full text-xs rounded-xl px-3 py-2 outline-none transition-all"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-center animate-pulse">
                    <div className="h-10 w-10 rounded-full shrink-0" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded" style={{ background: 'var(--bg-tertiary)' }} />
                      <div className="h-2 w-full rounded" style={{ background: 'var(--bg-tertiary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <span className="text-3xl mb-2">📭</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {searchTerm ? 'No matches found' : 'No conversations yet'}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {searchTerm
                    ? 'Try a different name'
                    : 'Start chatting from a gig proposal page.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation?.conversationId === conv.conversationId;
                const isUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConversation(conv)}
                    className="w-full flex gap-3 p-4 text-left transition-all outline-none border-l-4"
                    style={{
                      borderLeftColor: isActive ? 'var(--accent-primary)' : 'transparent',
                      background: isActive ? 'rgba(45,80,22,0.07)' : 'transparent',
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.otherParticipant.avatarUrl ? (
                        <img
                          src={conv.otherParticipant.avatarUrl}
                          alt={conv.otherParticipant.name}
                          className="h-10 w-10 rounded-full object-cover border"
                          style={{ borderColor: 'var(--border-secondary)' }}
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                          style={{ background: 'var(--accent-primary)' }}
                        >
                          {conv.otherParticipant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background: '#22c55e', borderColor: 'var(--bg-card)' }}
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-bold truncate"
                          style={{ color: isUnread ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                        >
                          {conv.otherParticipant.name}
                        </span>
                        <span className="text-[9px] font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono block mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
                        {conv.otherParticipant.role}
                      </span>
                      <p
                        className="text-[11px] truncate mt-1.5"
                        style={{ color: isUnread ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isUnread ? 600 : 400 }}
                      >
                        {conv.lastMessage.content ||
                          (conv.lastMessage.attachments?.length > 0 ? '📎 File Attachment' : 'No preview')}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {isUnread && (
                      <span
                        className="h-5 min-w-5 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                        style={{ background: 'var(--accent-primary)' }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className="flex-1 rounded-3xl overflow-hidden flex flex-col relative border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          {loadingMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <div
                className="h-8 w-8 border-2 border-t-transparent rounded-full animate-spin mb-2"
                style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
              />
              <span className="text-xs">Loading messages...</span>
            </div>
          ) : (
            <ChatWindow
              activeConversation={activeConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              isOtherUserTyping={isOtherUserTyping}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      <footer
        className="py-6 text-center text-xs border-t"
        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}
      >
        © 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.
      </footer>
    </div>
  );
}
