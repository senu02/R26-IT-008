"use client";
import React, { useState, useEffect } from 'react';
import { notificationAPI, Notification, getImageUrl } from '@/lib/api';
import { ShieldAlert, MessageCircle, Heart, UserPlus, CheckCircle, BellRing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationAPI.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'like': return <Heart className="h-5 w-5 text-red-500" />;
      case 'friend_request': return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'system_shield': return <ShieldAlert className="h-5 w-5 text-purple-500" />;
      default: return <MessageCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-blue-500/10 dark:bg-blue-500/20';
      case 'like': return 'bg-red-500/10 dark:bg-red-500/20';
      case 'friend_request': return 'bg-green-500/10 dark:bg-green-500/20';
      case 'system_shield': return 'bg-purple-500/10 dark:bg-purple-500/20';
      default: return 'bg-gray-500/10 dark:bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute h-full w-full animate-ping rounded-full bg-blue-500 opacity-20"></div>
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-0">
      
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20 text-white">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Notifications</h1>
            <p className="text-sm text-[var(--ig-muted)]">
              You have <span className="font-semibold text-blue-500">{unreadCount}</span> unread messages
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="group flex items-center gap-2 rounded-full bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-semibold text-blue-500 shadow-sm border border-blue-500/20 transition-all hover:bg-blue-50 hover:border-blue-500/40 dark:hover:bg-blue-900/20 active:scale-95"
          >
            <CheckCircle className="h-4 w-4 transition-transform group-hover:scale-110" /> 
            <span className="hidden sm:inline">Mark all as read</span>
            <span className="sm:hidden">Read all</span>
          </button>
        )}
      </div>

      {/* Notifications Container */}
      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-black/20 rounded-3xl border border-[var(--ig-border)] backdrop-blur-sm">
            <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <BellRing className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-[var(--foreground)]">All caught up!</h3>
            <p className="text-[var(--ig-muted)] mt-2">You don't have any new notifications right now.</p>
          </div>
        ) : (
          notifications.map(notification => {
            const avatar = notification.sender_detail?.profile_picture 
              ? getImageUrl(notification.sender_detail.profile_picture) 
              : 'https://i.pravatar.cc/150?img=11';

            return (
              <div 
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={`group relative overflow-hidden flex gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-md ${
                  !notification.is_read 
                    ? 'bg-white dark:bg-neutral-900/80 border-blue-500/30 shadow-md shadow-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5' 
                    : 'bg-white/60 dark:bg-black/40 border-[var(--ig-border)] hover:bg-white dark:hover:bg-neutral-900 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Unread indicator bar */}
                {!notification.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-2xl"></div>
                )}

                {/* Avatar / Icon area */}
                <div className="relative shrink-0 flex items-start">
                  {notification.sender_detail ? (
                    <div className="h-14 w-14 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm overflow-hidden z-10">
                      <img src={avatar || ''} alt="sender" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-sm z-10">
                      <span className="text-xl font-bold text-gray-500 dark:text-gray-400">PT</span>
                    </div>
                  )}
                  
                  {/* Badge Icon */}
                  <div className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 z-20 ${getIconBg(notification.notification_type)} shadow-sm`}>
                    {getIcon(notification.notification_type)}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 self-center pl-2">
                  <p className={`text-[15px] leading-relaxed text-[var(--foreground)] ${!notification.is_read ? 'font-medium' : ''}`}>
                    {notification.message}
                  </p>
                  <p className={`text-[13px] mt-1.5 ${!notification.is_read ? 'text-blue-500 font-medium' : 'text-[var(--ig-muted)]'}`}>
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                {/* Read Status Dot */}
                {!notification.is_read && (
                  <div className="shrink-0 self-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
