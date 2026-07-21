import React, { useState, useEffect, useRef } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications.api.js';
import useSocket from '../../hooks/useSocket.js';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { on } = useSocket();

  // Load initial notifications from DB
  const loadNotifications = async () => {
    try {
      const data = await getNotifications(1, 20);
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen to socket for real-time notifications
  useEffect(() => {
    const unsubscribe = on('notification:receive', (notification) => {
      console.log('Received notification via socket:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id) => {
    try {
      const data = await markAsRead(id);
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const data = await markAllAsRead();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // Helper to format notification text & icons based on type
  const getNotificationDetails = (n) => {
    switch (n.type) {
      case 'new_gig':
        return {
          icon: '💼',
          title: 'New Gig Match',
          desc: n.payload?.title ? `A new matching gig "${n.payload.title}" is available!` : 'A new matching gig has been posted.',
          color: 'text-indigo-400 bg-indigo-500/10'
        };
      case 'proposal_accepted':
        return {
          icon: '🎉',
          title: 'Proposal Accepted',
          desc: n.payload?.gigTitle ? `Your proposal for "${n.payload.gigTitle}" was accepted!` : 'Your proposal has been accepted!',
          color: 'text-emerald-400 bg-emerald-500/10'
        };
      case 'payment_received':
        return {
          icon: '💵',
          title: 'Payment Received',
          desc: n.payload?.amount ? `Received milestone payment of $${n.payload.amount}!` : 'You received a payment!',
          color: 'text-teal-400 bg-teal-500/10'
        };
      case 'review_added':
        return {
          icon: '⭐',
          title: 'New Review Added',
          desc: `${n.payload?.reviewerName || 'A client'} left you a ${n.payload?.rating}-star review!`,
          color: 'text-amber-400 bg-amber-500/10'
        };
      case 'dispute_update':
        return {
          icon: '⚠️',
          title: 'Dispute Update',
          desc: 'An update was posted regarding your active dispute.',
          color: 'text-rose-400 bg-rose-500/10'
        };
      default:
        return {
          icon: '🔔',
          title: 'Notification',
          desc: n.payload?.message || 'You have a new update.',
          color: 'text-slate-400 bg-slate-500/10'
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        id="notification-bell-btn"
        className="relative p-2 text-slate-400 hover:text-indigo-400 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all duration-200 cursor-pointer"
        aria-label="View notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[450px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[1000] flex flex-col scrollbar-thin scrollbar-thumb-slate-800 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-600/10 text-indigo-400 text-[10px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1 max-h-[350px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-500">
                <span className="text-3xl mb-2">🔔</span>
                <p className="text-xs font-medium">All caught up!</p>
                <p className="text-[10px] text-slate-650 mt-1">No notifications to show</p>
              </div>
            ) : (
              notifications.map((n) => {
                const details = getNotificationDetails(n);
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && handleMarkRead(n._id)}
                    className={`flex gap-3 p-3.5 text-left transition-all duration-150 cursor-pointer ${
                      n.isRead ? 'opacity-65 hover:bg-slate-850/40' : 'bg-slate-850/30 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Icon Circle */}
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${details.color}`}>
                      <span className="text-base">{details.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-xs font-bold text-slate-200 truncate">{details.title}</p>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5 break-words">
                        {details.desc}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-1.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
