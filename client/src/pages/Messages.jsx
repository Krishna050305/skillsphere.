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

  const { emit, on } = useSocket();

  // 1. Fetch conversations on load
  const loadConversations = async (autoSelectId = null) => {
    setLoadingThreads(true);
    try {
      const data = await getConversations();
      if (data.success) {
        setConversations(data.conversations || []);
        
        // If autoSelectId is provided or activeConversation exists, sync the active thread details
        if (autoSelectId) {
          const matched = data.conversations.find(c => c.conversationId === autoSelectId);
          if (matched) setActiveConversation(matched);
        } else if (activeConversation) {
          const matched = data.conversations.find(c => c.conversationId === activeConversation.conversationId);
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
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.conversationId);
      
      // Emit message read status to the sender of the conversation
      emit('message:read', {
        conversationId: activeConversation.conversationId,
        senderId: activeConversation.otherParticipant._id
      });

      // Clear typing indicator for safety
      setIsOtherUserTyping(false);
    }
  }, [activeConversation]);

  // 3. Listen to Socket events
  useEffect(() => {
    // A. Receive message
    const unsubscribeReceive = on('message:receive', (msg) => {
      console.log('Received message:', msg);
      
      const currentActiveId = activeConversation?.conversationId;
      const isForActiveChat = msg.conversationId === currentActiveId;

      if (isForActiveChat) {
        // Append message to active chat
        setMessages((prev) => [...prev, msg]);

        // If I am the recipient, automatically read it
        if (msg.recipient._id.toString() === currentUser?._id?.toString()) {
          emit('message:read', {
            conversationId: currentActiveId,
            senderId: msg.sender._id
          });
        }
      }

      // Re-fetch conversation list to update previews and unread counts
      loadConversations();
    });

    // B. Typing status
    const unsubscribeTyping = on('message:typing', (data) => {
      const { senderId, isTyping } = data;
      // Show typing indicator only if typing sender is the active conversation's other participant
      if (activeConversation && activeConversation.otherParticipant._id.toString() === senderId.toString()) {
        setIsOtherUserTyping(isTyping);
      }
    });

    // C. Read acknowledgements
    const unsubscribeReadAck = on('message:read:ack', (data) => {
      const { conversationId, readerId, readAt } = data;
      
      // If the ack is for the currently active conversation, update message read statuses
      if (activeConversation && activeConversation.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id.toString() === currentUser?._id?.toString() && !msg.readAt
              ? { ...msg, readAt }
              : msg
          )
        );
      }

      // Sync conversation list statuses
      setConversations((prev) =>
        prev.map((c) => {
          if (c.conversationId === conversationId) {
            return {
              ...c,
              unreadCount: readerId.toString() === currentUser?._id?.toString() ? 0 : c.unreadCount,
              lastMessage: {
                ...c.lastMessage,
                readAt: c.lastMessage.recipient.toString() === readerId.toString() ? readAt : c.lastMessage.readAt
              }
            };
          }
          return c;
        })
      );
    });

    return () => {
      if (unsubscribeReceive) unsubscribeReceive();
      if (unsubscribeTyping) unsubscribeTyping();
      if (unsubscribeReadAck) unsubscribeReadAck();
    };
  }, [on, activeConversation, currentUser, emit]);

  // 4. Send message handler
  const handleSendMessage = (data) => {
    if (!activeConversation || !currentUser) return;

    const payload = {
      conversationId: activeConversation.conversationId,
      recipientId: activeConversation.otherParticipant._id,
      content: data.content,
      attachments: data.attachments || []
    };

    emit('message:send', payload, (res) => {
      if (res && res.success) {
        console.log('Message sent successfully!');
      } else {
        console.error('Failed to send message:', res?.error);
      }
    });
  };

  // 5. Typing notification handler
  const handleTyping = (isTyping) => {
    if (!activeConversation) return;

    emit('message:typing', {
      recipientId: activeConversation.otherParticipant._id,
      isTyping
    });
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navigation />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex gap-6 h-[calc(100vh-130px)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm">
          {/* Header */}
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-base font-bold text-slate-100">Conversations</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">DIRECT MESSAGES & NEGOTIATIONS</p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800">
            {loadingThreads ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 gap-2">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Loading chats...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                <span className="text-2xl mb-1">📭</span>
                <p className="text-xs font-semibold">No active chats</p>
                <p className="text-[10px] text-slate-650 mt-1">Start chatting with clients or freelancers via gig proposals.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversation?.conversationId === conv.conversationId;
                const isUnread = conv.unreadCount > 0;
                
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex gap-3 p-4 text-left transition-all outline-none border-l-4 ${
                      isActive
                        ? 'bg-indigo-600/10 border-indigo-500'
                        : 'border-transparent hover:bg-slate-800/40'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      {conv.otherParticipant.avatarUrl ? (
                        <img
                          src={conv.otherParticipant.avatarUrl}
                          alt={conv.otherParticipant.name}
                          className="h-11 w-11 rounded-full border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white border border-slate-650">
                          {conv.otherParticipant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs font-bold truncate ${isUnread ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {conv.otherParticipant.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                        {conv.otherParticipant.role}
                      </span>
                      
                      <p className={`text-[11px] truncate mt-1.5 ${isUnread ? 'font-bold text-slate-100' : 'text-slate-400'}`}>
                        {conv.lastMessage.content || (conv.lastMessage.attachments?.length > 0 ? '📎 File Attachment' : 'No message preview')}
                      </p>
                    </div>

                    {/* Unread count badge */}
                    {isUnread && (
                      <span className="h-5 min-w-5 px-1 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col relative">
          {loadingMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-xs">Loading message logs...</span>
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

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
